import { TASK_STATUS } from "@/configs/entities/project.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import {
  CompletedTaskSuggestionRow,
  IEmployeeRepository,
  IProjectRepository,
  ISpentTimeRepository,
  ITaskRepository,
} from "@/types"
import { IApplicationRepository } from "@/types/attendance.types.ts"
import { aiClient } from "@/utils/ai-client.util.ts"
import { AppError } from "@/utils/error.util.ts"

const LAYER_NAME = "TaskEstimateAiService"

export interface TaskEstimateAiSuggestion {
  employeeId: string
  fullName: string
  position: string | null
  skillScore: number
  workloadScore: number
  availabilityScore: number
  finalScore: number
  reasons: string[]
}

export interface GeneratedTaskSuggestion {
  title: string
  description: string
  tracker: string
  priority: string
  estimatedTime: number
}

export class TaskEstimateAiService {
  constructor(
    private taskRepository: ITaskRepository,
    private projectRepository: IProjectRepository,
    private employeeRepository: IEmployeeRepository,
    private applicationRepository: IApplicationRepository,
    private spentTimeRepository: ISpentTimeRepository,
  ) {}

  /**
   * Generates assignee suggestions using the Hybrid AI Approach:
   * 1. Backend calculates Workload Score & Availability Score.
   * 2. Gemini API calculates Skill Match Score and writes Vietnamese descriptions.
   * 3. Backend merges and ranks candidates.
   */
  async getAssigneeSuggestions(taskId: string): Promise<TaskEstimateAiSuggestion[]> {
    // 1. Fetch Task details
    const task = await this.taskRepository.findById(taskId)
    if (!task) {
      throw new AppError("Task not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    // 2. Fetch Project members
    const members = await this.projectRepository.getMembers(task.projectId)
    if (!members || members.length === 0) {
      return []
    }

    interface GeminiCandidateContext {
      employeeId: string
      fullName: string
      position: string
      completedTaskTitles: string[]
      personalVelocity: string
    }

    const suggestions: TaskEstimateAiSuggestion[] = []
    const geminiCandidatesContext: GeminiCandidateContext[] = []
    const velocities = new Map<string, number>()

    const startDate = task.startDate || new Date()
    // Default to 3 days if dueDate is not specified
    const dueDate = task.dueDate || new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)

    const memberIds = members.map((member) => member.employeeId as string)

    // Reuse member.employee projection from getMembers; fallback only for callers/mocks missing it.
    const resolvedEmployees = await Promise.all(
      members.map(async (member) => {
        if (member.employee) {
          return {
            id: member.employeeId as string,
            fullName: member.employee.fullName as string,
            position: (member.employee.position as string | null) ?? null,
          }
        }
        const emp = await this.employeeRepository.findById(member.employeeId)
        return emp
          ? { id: emp.id, fullName: emp.fullName, position: emp.position ?? null }
          : null
      }),
    )

    const employeeById = new Map<string, { id: string; fullName: string; position: string | null }>()
    for (const emp of resolvedEmployees) {
      if (emp) employeeById.set(emp.id, emp)
    }
    const activeMemberIds = memberIds.filter((id) => employeeById.has(id))
    if (activeMemberIds.length === 0) {
      return []
    }

    const [activeTaskCounts, overlappingEmployees, completedTasksByAssignee] = await Promise.all([
      this.loadActiveTaskCounts(activeMemberIds),
      this.loadLeaveOverlappingEmployees(activeMemberIds, startDate, dueDate),
      this.loadRecentCompletedTasks(activeMemberIds),
    ])

    const taskIdsNeedingSpentHours = Array.from(
      new Set(
        Array.from(completedTasksByAssignee.values())
          .flat()
          .filter((t) => Boolean(t.estimatedTime && t.id))
          .map((t) => t.id),
      ),
    )

    const spentHoursByTaskId = await this.loadSpentHoursMap(taskIdsNeedingSpentHours)

    // 3. Process each member in memory using batched query results
    for (const employeeId of activeMemberIds) {
      const employee = employeeById.get(employeeId)!
      const activeCount = activeTaskCounts.get(employeeId) ?? 0

      let workloadScore = 0
      if (activeCount === 0) workloadScore = 100
      else if (activeCount === 1) workloadScore = 85
      else if (activeCount === 2) workloadScore = 60
      else if (activeCount === 3) workloadScore = 30
      else workloadScore = 0

      const availabilityScore = overlappingEmployees.has(employeeId) ? 0 : 100
      const completedTasks = completedTasksByAssignee.get(employeeId) ?? []
      const completedTaskTitles = completedTasks.slice(0, 5).map((t) => t.title)

      let totalBaseline = 0
      let totalSpent = 0

      for (const t of completedTasks) {
        if (t.estimatedTime && t.id) {
          const taskSpentHours = spentHoursByTaskId.get(t.id) ?? 0
          if (taskSpentHours > 0) {
            totalBaseline += t.estimatedTime
            totalSpent += taskSpentHours
          }
        }
      }

      let velocity = 1.0 // default multiplier
      if (totalSpent > 0 && totalBaseline > 0) {
        velocity = totalBaseline / totalSpent
        // Giới hạn hệ số từ 0.5 đến 2.0 để tránh lệch điểm quá lớn
        velocity = Math.max(0.5, Math.min(2.0, velocity))
      }
      velocities.set(employeeId, velocity)

      // Add to list for Gemini evaluation
      geminiCandidatesContext.push({
        employeeId,
        fullName: employee.fullName,
        position: employee.position || "Employee",
        completedTaskTitles,
        personalVelocity: velocity.toFixed(2), // báo cho AI tốc độ của nhân viên này
      })

      // Store basic data in temporary array
      suggestions.push({
        employeeId,
        fullName: employee.fullName,
        position: employee.position || null,
        skillScore: 0, // Will be filled by Gemini
        workloadScore,
        availabilityScore,
        finalScore: 0, // Will be calculated below
        reasons: [],
      })
    }

    // 4. Call General AI API to calculate Skill Match Score
    try {
      const prompt = `
        Bạn là giám đốc kỹ thuật hoặc quản lý dự án công nghệ. Hãy phân tích độ tương thích kỹ năng (Skill Match) của từng nhân viên đối với Task mục tiêu.

        Task mục tiêu:
        - Tiêu đề: "${task.title}"
        - Mô tả: "${task.description || "Không có mô tả"}"
        - Tracker: "${task.tracker}"
        - Độ ưu tiên: "${task.priority}"

        Danh sách các ứng viên:
        ${JSON.stringify(geminiCandidatesContext, null, 2)}

        Yêu cầu:
        1. Chấm điểm kỹ năng (skillScore) từ 0 đến 100 cho từng ứng viên dựa trên chức danh (position) và danh sách các task tương tự họ từng làm (completedTaskTitles).
        2. Viết 2 lý do ngắn gọn bằng tiếng Việt giải thích vì sao họ có điểm số kỹ năng đó (tập trung vào chuyên môn kỹ thuật).
        3. Trả về đúng định dạng JSON là một mảng chứa các đối tượng có thuộc tính: "employeeId" (string), "skillScore" (number), "reasons" (mảng string gồm đúng 2 lý do ngắn gọn).

        Chú ý: Trả về duy nhất dữ liệu JSON sạch, không thêm bất kỳ dòng chữ giải thích nào ngoài JSON.
      `

      const geminiResults = await aiClient.generateJson<
        Array<{
          employeeId: string
          skillScore: number
          reasons: string[]
        }>
      >(prompt)

      // Map Gemini results back to suggestions and compute finalScore
      for (const s of suggestions) {
        const geminiRes = geminiResults.find((r) => r.employeeId === s.employeeId)
        if (geminiRes) {
          s.skillScore = geminiRes.skillScore
          s.reasons = geminiRes.reasons
        } else {
          s.skillScore = 50 // default fallback
          s.reasons = ["AI chưa phân tích được kỹ năng."]
        }

        // Apply velocity to skill score: faster velocity increases/scales the skill match score
        const velocity = velocities.get(s.employeeId) || 1.0
        const adjustedSkillScore = Math.min(100, s.skillScore * velocity)

        // Calculate final score: H_avail * (0.7 * S_skill_adjusted + 0.3 * S_workload)
        const availabilityFactor = s.availabilityScore / 100
        const rawScore = 0.7 * adjustedSkillScore + 0.3 * s.workloadScore
        s.finalScore = Math.round(availabilityFactor * rawScore * 10) / 10
      }

      // Sort by finalScore descending
      suggestions.sort((a, b) => b.finalScore - a.finalScore)
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      // Fallback in case of API failure
      for (const s of suggestions) {
        const skillScore = 60
        const velocity = velocities.get(s.employeeId) || 1.0
        const adjustedSkillScore = Math.min(100, skillScore * velocity)
        const finalScore =
          (s.availabilityScore / 100) * (0.7 * adjustedSkillScore + 0.3 * s.workloadScore)
        s.skillScore = skillScore
        s.finalScore = Math.round(finalScore * 10) / 10
        s.reasons = ["Gặp lỗi khi gọi AI API. Đây là điểm số dự phòng có tính đến tốc độ."]
      }
      // Đảm bảo danh sách dự phòng vẫn được sắp xếp giảm dần theo điểm số
      suggestions.sort((a, b) => b.finalScore - a.finalScore)
    }

    return suggestions
  }

  /**
   * Generates a list of suggested tasks to complete a project using General AI.
   */
  async generateProjectTasks(projectId: string): Promise<GeneratedTaskSuggestion[]> {
    const project = await this.projectRepository.findById(projectId)
    if (!project) {
      throw new AppError("Project not found", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE)
    }

    const prompt = `
      Bạn là Tech Lead dự án. Hãy phân rã dự án sau đây thành một danh sách gồm 2 đến 4 công việc (Tasks) cụ thể, chi tiết cần làm để hoàn thành dự án.

      Thông tin dự án:
      - Tên dự án: "${project.name}"
      - Mô tả: "${project.description || "Không có mô tả"}"
      - Công nghệ sử dụng: ${JSON.stringify(project.techStack)}

      Yêu cầu trả về cấu trúc dữ liệu JSON là một mảng các đối tượng chứa:
      - "title": tiêu đề công việc ngắn gọn (tiếng Việt)
      - "description": mô tả chi tiết công việc cần thực hiện (tiếng Việt)
      - "tracker": loại công việc (chỉ được phép chọn 1 trong các giá trị: "feature", "task", "support", "test")
      - "priority": độ ưu tiên (chỉ được chọn 1 trong các giá trị: "low", "medium", "high", "urgent")
      - "estimatedTime": số giờ dự kiến để hoàn thành (nhập số nguyên từ 2 đến 40)

      Chú ý: Trả về duy nhất dữ liệu JSON sạch.
    `

    const taskSuggestions = await aiClient.generateJson<GeneratedTaskSuggestion[]>(prompt)
    return taskSuggestions
  }

  private async loadActiveTaskCounts(employeeIds: string[]): Promise<Map<string, number>> {
    if (this.taskRepository.countActiveByAssignees) {
      return this.taskRepository.countActiveByAssignees(employeeIds)
    }

    const entries = await Promise.all(
      employeeIds.map(async (assigneeId) => {
        const res = await this.taskRepository.listTasks({
          assigneeId,
          status: TASK_STATUS.IN_PROGRESS,
          limit: 100,
        })
        return [assigneeId, res.meta.total] as const
      }),
    )
    return new Map(entries)
  }

  private async loadLeaveOverlappingEmployees(
    employeeIds: string[],
    startDate: Date,
    dueDate: Date,
  ): Promise<Set<string>> {
    if (this.applicationRepository.findLeaveOverlappingEmployees) {
      return this.applicationRepository.findLeaveOverlappingEmployees(
        employeeIds,
        startDate,
        dueDate,
      )
    }

    const flags = await Promise.all(
      employeeIds.map(async (employeeId) => ({
        employeeId,
        overlaps: await this.applicationRepository.checkLeaveOverlap(
          employeeId,
          startDate,
          dueDate,
        ),
      })),
    )
    return new Set(flags.filter((f) => f.overlaps).map((f) => f.employeeId))
  }

  private async loadRecentCompletedTasks(
    employeeIds: string[],
  ): Promise<Map<string, CompletedTaskSuggestionRow[]>> {
    if (this.taskRepository.listRecentCompletedByAssignees) {
      return this.taskRepository.listRecentCompletedByAssignees(employeeIds, 20)
    }

    const entries = await Promise.all(
      employeeIds.map(async (assigneeId) => {
        const res = await this.taskRepository.listTasks({
          assigneeId,
          status: TASK_STATUS.DONE,
          limit: 20,
          sortBy: "completedAt",
          sortOrder: "desc",
        })
        return [
          assigneeId,
          res.data.map((t) => ({ id: t.id, title: t.title, estimatedTime: t.estimatedTime ?? null })),
        ] as const
      }),
    )
    return new Map(entries)
  }

  private async loadSpentHoursMap(taskIds: string[]): Promise<Map<string, number>> {
    if (taskIds.length === 0) return new Map()
    if (this.spentTimeRepository.sumHoursByTaskIds) {
      return this.spentTimeRepository.sumHoursByTaskIds(taskIds)
    }

    const entries = await Promise.all(
      taskIds.map(
        async (taskId) => [taskId, await this.spentTimeRepository.sumTaskHours(taskId)] as const,
      ),
    )
    return new Map(entries)
  }
}
