/// <reference types="jest" />
import { TaskService } from "../../services/task.service"

// ==========================================
// MOCKS OF SYSTEM DEPENDENCIES AND CONFIGS
// ==========================================

jest.mock(
  "@/configs/entities/project.config.ts",
  () => ({
    TASK_CREATION_POLICY: {
      LEADER_ONLY: "LEADER_ONLY",
      ANYONE: "ANYONE",
    },
    TASK_STATUS: {
      TODO: "todo",
      IN_PROGRESS: "in_progress",
      IN_REVIEW: "in_review",
      DONE: "done",
      CANCELLED: "cancelled",
    },
  }),
  { virtual: true },
)

jest.mock(
  "@/configs/system/error-code.config.ts",
  () => ({
    ErrorLayer: {
      SERVICE: "SERVICE",
    },
  }),
  { virtual: true },
)

jest.mock(
  "@/configs/system/http.config.ts",
  () => ({
    HttpStatusCode: {
      OK: 200,
      BAD_REQUEST: 400,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500,
    },
  }),
  { virtual: true },
)

jest.mock(
  "@/services/authorization.service.ts",
  () => ({
    authorizationService: {
      getAuthorizationContext: jest.fn(),
    },
  }),
  { virtual: true },
)

jest.mock(
  "@/utils/error.util.ts",
  () => {
    return {
      AppError: class AppError extends Error {
        public statusCode: number
        public layer: string
        constructor(message: string, statusCode: number, layer: string) {
          super(message)
          this.statusCode = statusCode
          this.layer = layer
        }
      },
    }
  },
  { virtual: true },
)

jest.mock(
  "@/utils/status-mapping.util.ts",
  () => ({
    mapStatusNameToEnum: jest.fn(),
  }),
  { virtual: true },
)

const { authorizationService } = jest.requireMock("@/services/authorization.service.ts")
const { mapStatusNameToEnum } = jest.requireMock("@/utils/status-mapping.util.ts")

describe("TaskService Suite", () => {
  // Shared mock repositories
  const mockTaskRepository = {
    findById: jest.fn(),
    listTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  }

  const mockProjectRepository = {
    findById: jest.fn(),
    isMember: jest.fn(),
  }

  const mockEmployeeRepository = {
    findById: jest.fn(),
  }

  const mockStatusRepository = {
    findById: jest.fn(),
    findDefaultStatus: jest.fn(),
    listByProjectId: jest.fn(),
  }

  const mockPositionService = {
    validateTaskCreation: jest.fn(),
  }

  let taskService: TaskService

  beforeEach(() => {
    jest.clearAllMocks()
    taskService = new TaskService(
      mockTaskRepository as never,
      mockProjectRepository as never,
      mockEmployeeRepository as never,
      mockStatusRepository as never,
      mockPositionService as never,
    )

    // Default status mapping implementation helper returning lowercase statuses
    mapStatusNameToEnum.mockImplementation((name: string, isCompleted: boolean) => {
      if (name === "DoneStatus" || isCompleted) return "done"
      if (name === "InProgressStatus") return "in_progress"
      if (name === "InReviewStatus") return "in_review"
      return "todo"
    })

    // Solve the "Cannot read properties of undefined (reading 'find')" error:
    mockStatusRepository.listByProjectId.mockResolvedValue([
      { id: "status-todo-id", name: "TodoStatus", isCompleted: false },
      { id: "status-in-progress-id", name: "InProgressStatus", isCompleted: false },
      { id: "status-in-review-id", name: "InReviewStatus", isCompleted: false },
      { id: "status-done-id", name: "DoneStatus", isCompleted: true },
    ])
  })

  // ==========================================
  // getTask() TESTS
  // ==========================================
  describe("getTask", () => {
    it("should successfully return the task if user is a global approver", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(["project.update"]),
      } as never)

      // Act
      const result = await taskService.getTask("task-1", "user-1")

      // Assert
      expect(result).toEqual(mockTask)
      expect(mockTaskRepository.findById).toHaveBeenCalledWith("task-1")
    })

    it("should throw NOT_FOUND error when the task does not exist", async () => {
      // Arrange
      mockTaskRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.getTask("non-existent", "user-1")).rejects.toThrow("Task not found")
    })

    it("should throw NOT_FOUND error when the associated project is not found for non-admin", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.getTask("task-1", "user-1")).rejects.toThrow(
        "Associated project not found",
      )
    })

    it("should throw FORBIDDEN error if user has no access to the project tasks", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(taskService.getTask("task-1", "user-stranger")).rejects.toThrow(
        "Access denied to this project's tasks",
      )
    })
  })

  // ==========================================
  // listTasks() TESTS
  // ==========================================
  describe("listTasks", () => {
    it("should list tasks successfully for global approver", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const expectedOutput = { tasks: [], total: 0 }
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(["project.update"]),
      } as never)
      mockTaskRepository.listTasks.mockResolvedValue(expectedOutput)

      // Act
      const result = await taskService.listTasks(query, "user-1")

      // Assert
      expect(result).toEqual(expectedOutput)
    })

    it("should throw BAD_REQUEST when projectId is missing for non-global approvers", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)

      // Act & Assert
      await expect(taskService.listTasks(query, "user-1")).rejects.toThrow(
        "Project ID is required to view tasks",
      )
    })

    it("should throw NOT_FOUND when query project does not exist for non-global approvers", async () => {
      // Arrange
      const query = { projectId: "project-1", page: 1, limit: 10 }
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.listTasks(query, "user-1")).rejects.toThrow("Project not found")
    })

    it("should throw FORBIDDEN when user has no access to target project tasks", async () => {
      // Arrange
      const query = { projectId: "project-1", page: 1, limit: 10 }
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(taskService.listTasks(query, "user-stranger")).rejects.toThrow(
        "Access denied to this project's tasks",
      )
    })
  })

  // ==========================================
  // createTask() TESTS
  // ==========================================
  describe("createTask", () => {
    it("should successfully create a task with default status mapping", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task" }
      const expectedTask = { id: "task-1", ...payload, status: "todo", createdById: "user-1" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "ANYONE",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockStatusRepository.findDefaultStatus.mockResolvedValue({
        id: "status-1",
        name: "TodoStatus",
        isCompleted: false,
      })
      mockTaskRepository.createTask.mockResolvedValue(expectedTask)

      // Act
      const result = await taskService.createTask(payload, "user-1")

      // Assert
      expect(result).toEqual(expectedTask)
    })

    it("should throw NOT_FOUND error when target project does not exist", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task" }
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow("Project not found")
    })

    it("should throw FORBIDDEN error when caller is not a member of the project", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "You are not a member of this project",
      )
    })

    it("should throw FORBIDDEN error when project policy is LEADER_ONLY and user is member but not leader", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "LEADER_ONLY",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(true)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "Only Team Leaders or Managers can create tasks in this project",
      )
    })

    it("should throw NOT_FOUND error when assignee employee does not exist", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task", assigneeId: "assignee-1" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "ANYONE",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockEmployeeRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "Assignee employee not found",
      )
    })

    it("should throw BAD_REQUEST error when assignee is not a member or the leader of the project", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task", assigneeId: "assignee-1" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "ANYONE",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockImplementation((projId: string, uId: string) => {
        if (uId === "user-1") return Promise.resolve(true) // Creator is member
        if (uId === "assignee-1") return Promise.resolve(false) // Assignee is not member
        return Promise.resolve(false)
      })
      mockEmployeeRepository.findById.mockResolvedValue({ id: "assignee-1" })

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "Assignee must be a member or the leader of this project",
      )
    })

    it("should throw NOT_FOUND error when parent task does not exist", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task", parentTaskId: "parent-1" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "ANYONE",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockTaskRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "Parent task not found",
      )
    })

    it("should throw BAD_REQUEST when custom statusId is invalid for the project", async () => {
      // Arrange
      const payload = { projectId: "project-1", title: "New Task", statusId: "status-custom" }
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
        taskCreationPolicy: "ANYONE",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockStatusRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.createTask(payload, "user-1")).rejects.toThrow(
        "Invalid task status for this project",
      )
    })
  })

  // ==========================================
  // updateTask() TESTS
  // ==========================================
  describe("updateTask", () => {
    it("should update task details successfully", async () => {
      // Arrange
      const updatePayload = { title: "New Title" }
      const originalTask = {
        id: "task-1",
        projectId: "project-1",
        createdById: "user-1",
        status: "todo",
      }
      const updatedTaskResult = { ...originalTask, title: "New Title" }

      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "user-1", position: "developer" })
      mockTaskRepository.updateTask.mockResolvedValue(updatedTaskResult)

      // Act
      const result = await taskService.updateTask("task-1", updatePayload, "user-1")

      // Assert
      expect(result).toEqual(updatedTaskResult)
    })

    it("should throw NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockTaskRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.updateTask("task-1", { title: "Update" }, "user-1")).rejects.toThrow(
        "Task not found",
      )
    })

    it("should throw NOT_FOUND when associated project does not exist", async () => {
      // Arrange
      mockTaskRepository.findById.mockResolvedValue({ id: "task-1", projectId: "project-1" })
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.updateTask("task-1", { title: "Update" }, "user-1")).rejects.toThrow(
        "Associated project not found",
      )
    })

    it("should throw FORBIDDEN when user has no permission to update (not GM, TL, creator, or assignee)", async () => {
      // Arrange
      const originalTask = {
        id: "task-1",
        projectId: "project-1",
        createdById: "creator-1",
        assigneeId: "assignee-1",
      }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)

      // Act & Assert
      await expect(
        taskService.updateTask("task-1", { title: "Update" }, "user-stranger"),
      ).rejects.toThrow("You do not have permission to update this task")
    })

    it("should throw NOT_FOUND if proposed assignee employee is not found", async () => {
      // Arrange
      const originalTask = { id: "task-1", projectId: "project-1", createdById: "user-1" }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockImplementation((id: string) => {
        if (id === "user-1") return Promise.resolve({ id: "user-1", position: "developer" })
        return Promise.resolve(null)
      })

      // Act & Assert
      await expect(
        taskService.updateTask("task-1", { assigneeId: "assignee-nonexistent" }, "user-1"),
      ).rejects.toThrow("Assignee employee not found")
    })

    it("should throw BAD_REQUEST if assignee is not a member or leader", async () => {
      // Arrange
      const originalTask = { id: "task-1", projectId: "project-1", createdById: "user-1" }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockImplementation((id: string) => {
        if (id === "user-1") return Promise.resolve({ id: "user-1", position: "developer" })
        if (id === "assignee-1") return Promise.resolve({ id: "assignee-1" })
        return Promise.resolve(null)
      })
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(
        taskService.updateTask("task-1", { assigneeId: "assignee-1" }, "user-1"),
      ).rejects.toThrow("Assignee must be a member or the leader of this project")
    })

    it("should throw BAD_REQUEST if task is proposed to be its own parent", async () => {
      // Arrange
      const originalTask = { id: "task-1", projectId: "project-1", createdById: "user-1" }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "user-1", position: "developer" })

      // Act & Assert
      await expect(
        taskService.updateTask("task-1", { parentTaskId: "task-1" }, "user-1"),
      ).rejects.toThrow("A task cannot be its own parent")
    })

    it("should throw FORBIDDEN if status transition completion changes and user is not GM, TL, or Tester", async () => {
      // Arrange
      const originalTask = {
        id: "task-1",
        projectId: "project-1",
        createdById: "user-1",
        statusId: "status-active",
        status: "in_progress",
      }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "user-1", position: "developer" }) // not tester

      mockStatusRepository.findById.mockImplementation((id: string) => {
        if (id === "status-active")
          return Promise.resolve({
            id: "status-active",
            projectId: "project-1",
            isCompleted: false,
            name: "InProgress",
          })
        if (id === "status-done")
          return Promise.resolve({
            id: "status-done",
            projectId: "project-1",
            isCompleted: true,
            name: "Done",
          })
        return Promise.resolve(null)
      })

      // Act & Assert
      await expect(
        taskService.updateTask("task-1", { statusId: "status-done" }, "user-1"),
      ).rejects.toThrow(
        "Chỉ Team Leader, Manager hoặc Tester mới có quyền hoàn thành công việc này.",
      )
    })

    it("should throw FORBIDDEN when transitioning directly to DONE and user is not GM, TL, or Tester", async () => {
      // Arrange
      const originalTask = {
        id: "task-1",
        projectId: "project-1",
        createdById: "user-1",
        status: "in_progress",
      }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "user-1", position: "developer" })

      // Act & Assert
      await expect(taskService.updateTask("task-1", { status: "done" }, "user-1")).rejects.toThrow(
        "Chỉ Team Leader, Manager hoặc Tester mới có quyền phê duyệt hoàn thành công việc",
      )
    })

    it("should update successfully when setting IN_REVIEW status without results", async () => {
      // Arrange
      const originalTask = {
        id: "task-1",
        projectId: "project-1",
        createdById: "user-1",
        status: "in_progress",
        resultUrl: null,
        resultNotes: null,
      }
      mockTaskRepository.findById.mockResolvedValue(originalTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "user-1", position: "developer" })
      mockTaskRepository.updateTask.mockResolvedValue({ ...originalTask, status: "in_review" })

      // Act
      const result = await taskService.updateTask("task-1", { status: "in_review" }, "user-1")

      // Assert
      expect(result?.status).toBe("in_review")
    })
  })

  // ==========================================
  // deleteTask() TESTS
  // ==========================================
  describe("deleteTask", () => {
    it("should delete task successfully when caller is the creator", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1", createdById: "user-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)
      mockTaskRepository.deleteTask.mockResolvedValue(true)

      // Act
      const result = await taskService.deleteTask("task-1", "user-1")

      // Assert
      expect(result).toBe(true)
      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith("task-1")
    })

    it("should throw NOT_FOUND when task does not exist", async () => {
      // Arrange
      mockTaskRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.deleteTask("task-1", "user-1")).rejects.toThrow("Task not found")
    })

    it("should throw NOT_FOUND when associated project does not exist", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1", createdById: "user-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(taskService.deleteTask("task-1", "user-1")).rejects.toThrow(
        "Associated project not found",
      )
    })

    it("should throw FORBIDDEN when user has no delete rights (not GM, TL, or creator)", async () => {
      // Arrange
      const mockTask = { id: "task-1", projectId: "project-1", createdById: "creator-1" }
      mockTaskRepository.findById.mockResolvedValue(mockTask)
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-1",
        teamLeaderId: "leader-1",
      })
      authorizationService.getAuthorizationContext.mockResolvedValue({
        permissions: new Set(),
      } as never)

      // Act & Assert
      await expect(taskService.deleteTask("task-1", "user-stranger")).rejects.toThrow(
        "You do not have permission to delete this task",
      )
    })
  })
})
