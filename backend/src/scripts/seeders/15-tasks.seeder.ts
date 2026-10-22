import { APPLICATION_STATUS, APPLICATION_TYPES } from "@/configs/entities/attendance.config.ts"
import {
  SPENT_TIME_ACTIVITY,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TRACKER,
} from "@/configs/entities/project.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class TasksSeeder implements ISeeder {
  readonly name = "Tasks"
  readonly order = 15

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding tasks...")

    const adminId = context.adminId
    const projectIds = context.projectIds

    if (!adminId || projectIds.length === 0) {
      throw new Error("Missing required context (admin or projects).")
    }

    // Clear only tasks for the projects owned by this seed context to avoid deleting live data
    // when the task seeder is run standalone against a shared demo database.
    await prisma.task.deleteMany({
      where: { projectId: { in: projectIds } },
    })

    for (const projectId of projectIds) {
      // Find members of this project
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: { employeeId: true },
      })

      if (members.length === 0) continue

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      })

      const projStart = project?.startDate ? new Date(project.startDate) : new Date()

      // Get custom statuses for this project to map statusId
      const statuses = await prisma.projectTaskStatus.findMany({
        where: { projectId },
      })
      const statusMap = new Map<string, string>()
      for (const s of statuses) {
        statusMap.set(s.name.toLowerCase().replace(/[\s_-]/g, ""), s.id)
      }
      const getStatusId = (enumStatus: string): string | null => {
        const key = enumStatus.toLowerCase().replace(/[\s_-]/g, "")
        return statusMap.get(key) || statusMap.get("todo") || null
      }

      // Define structured parent features to demonstrate the subtask tree
      const parentFeatures = [
        {
          title: "Feature: [201001] Admin - Danh sách doanh nghiệp",
          tracker: TASK_TRACKER.FEATURE,
        },
        {
          title: "Feature: [201002] Admin - Tạo/Sửa/Xóa doanh nghiệp",
          tracker: TASK_TRACKER.FEATURE,
        },
        {
          title: "Feature: [201003] User - Đăng ký thông tin doanh nghiệp",
          tracker: TASK_TRACKER.FEATURE,
        },
      ]

      for (const [fIdx, feat] of parentFeatures.entries()) {
        // 1. Create Parent Feature Task
        const parentTask = await prisma.task.create({
          data: {
            projectId,
            title: feat.title,
            description: `Tính năng cha quản lý cấu trúc nghiệp vụ của phân hệ doanh nghiệp.`,
            priority: TASK_PRIORITY.HIGH,
            status: TASK_STATUS.IN_PROGRESS,
            statusId: getStatusId(TASK_STATUS.IN_PROGRESS),
            assigneeId: members[0].employeeId,
            createdById: adminId,
            startDate: projStart,
            dueDate: new Date(projStart.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days duration
            estimatedTime: 40,
            progress: 30,
            tracker: TASK_TRACKER.FEATURE,
          },
        })

        // 2. Create Child Subtasks for this feature
        // Subtask 1: Completed Task (progress = 100, status = done)
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Dev][${201001 + fIdx}] Code giao diện danh sách`,
            description: "Thiết kế và code UI React cho danh sách.",
            priority: TASK_PRIORITY.MEDIUM,
            status: TASK_STATUS.DONE,
            statusId: getStatusId(TASK_STATUS.DONE),
            assigneeId: members[0].employeeId,
            createdById: adminId,
            startDate: projStart,
            dueDate: new Date(projStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            completedAt: new Date(projStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            estimatedTime: 12,
            progress: 100,
            tracker: TASK_TRACKER.TASK,
            parentTaskId: parentTask.id,
            // Spent time mock
            spentTimes: {
              create: {
                employeeId: members[0].employeeId,
                hours: 10,
                comment: "Hoàn thành code UI danh sách sớm hơn dự kiến",
                activity: SPENT_TIME_ACTIVITY.DEVELOP,
                date: projStart,
              },
            },
          },
        })

        // Subtask 2: In Review Task (status = in_review, with link deliverables)
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [TEST][${201001 + fIdx}] Viết test case tự động`,
            description: "Viết Integration test Playwright cho UI.",
            priority: TASK_PRIORITY.MEDIUM,
            status: TASK_STATUS.IN_REVIEW,
            statusId: getStatusId(TASK_STATUS.IN_REVIEW),
            assigneeId: members.length > 1 ? members[1].employeeId : members[0].employeeId,
            createdById: adminId,
            startDate: new Date(projStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            dueDate: new Date(projStart.getTime() + 8 * 24 * 60 * 60 * 1000),
            estimatedTime: 8,
            progress: 95,
            tracker: TASK_TRACKER.TEST,
            parentTaskId: parentTask.id,
            resultUrl: "https://github.com/ldanh270/dev-core-erp/pull/42",
            resultNotes: "Đã pass toàn bộ test case ở local. Nhờ Team Leader review hộ.",
          },
        })

        // Subtask 3: Overdue Task (progress < 100, status = in_progress, current date is after dueDate)
        // Set start/due dates to be in the past relative to today (since today is June 19, 2026)
        const pastStart = new Date("2026-06-01T00:00:00.000Z")
        const pastDue = new Date("2026-06-10T00:00:00.000Z") // Due date in the past
        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Dev][${201001 + fIdx}] Code logic API & Database`,
            description: "Xây dựng các repository và controllers cho API.",
            priority: TASK_PRIORITY.URGENT,
            status: TASK_STATUS.IN_PROGRESS,
            statusId: getStatusId(TASK_STATUS.IN_PROGRESS),
            assigneeId: members.length > 2 ? members[2].employeeId : members[0].employeeId,
            createdById: adminId,
            startDate: pastStart,
            dueDate: pastDue,
            estimatedTime: 16,
            progress: 60, // Not finished yet (Overdue)
            tracker: TASK_TRACKER.TASK,
            parentTaskId: parentTask.id,
          },
        })

        // Subtask 4: Task with HR Leave Conflict (overlaps with approved leave days)
        // Fetch if the employee has any approved leave days
        const assigneeIdForConflict =
          members.length > 1 ? members[1].employeeId : members[0].employeeId
        const employeeLeaves = await prisma.application.findMany({
          where: {
            employeeId: assigneeIdForConflict,
            status: APPLICATION_STATUS.APPROVED,
            type: APPLICATION_TYPES.LEAVE.LABEL,
          },
          take: 1,
        })

        let conflictStart = new Date(projStart.getTime() + 10 * 24 * 60 * 60 * 1000)
        let conflictDue = new Date(projStart.getTime() + 14 * 24 * 60 * 60 * 1000)

        if (employeeLeaves.length > 0) {
          // Set task dates to overlap with the employee's approved leave days
          conflictStart = new Date(employeeLeaves[0].startDate)
          conflictDue = new Date(employeeLeaves[0].endDate)
        }

        await prisma.task.create({
          data: {
            projectId,
            title: `Task: [Support][${201001 + fIdx}] Hướng dẫn sử dụng & Deploy`,
            description: "Deploy sản phẩm lên môi trường Staging.",
            priority: TASK_PRIORITY.LOW,
            status: TASK_STATUS.TODO,
            statusId: getStatusId(TASK_STATUS.TODO),
            assigneeId: assigneeIdForConflict,
            createdById: adminId,
            startDate: conflictStart,
            dueDate: conflictDue,
            estimatedTime: 6,
            progress: 0,
            tracker: TASK_TRACKER.SUPPORT,
            parentTaskId: parentTask.id,
          },
        })
      }
    }

    console.log("  Successfully seeded structured parent-child tasks and statuses.")

    return {}
  }
}

registry.register(new TasksSeeder())

if (import.meta.main) {
  const seeder = new TasksSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const projects = await prisma.project.findMany()
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.projectIds = projects.map((p) => p.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
