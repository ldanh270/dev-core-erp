/// <reference types="jest" />
import { authorizationService } from "@/services/authorization.service.ts"
import { AppError } from "@/utils/error.util.ts"
import { mapStatusNameToEnum } from "@/utils/status-mapping.util.ts"

import { ProjectTaskStatusService } from "../../services/project-task-status.service"

jest.mock(
  "@/configs/entities/project.config.ts",
  () => ({
    DEFAULT_PROJECT_TASK_STATUSES: [
      { name: "To Do", color: "#ff0000", order: 1, isDefault: true, isCompleted: false },
      { name: "Done", color: "#00ff00", order: 2, isDefault: false, isCompleted: true },
    ],
  }),
  { virtual: true },
)

jest.mock(
  "@/configs/system/http.config.ts",
  () => ({
    HttpStatusCode: {
      BAD_REQUEST: 400,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
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
  () => ({
    AppError: class AppError extends Error {
      statusCode: number
      layerName?: string
      constructor(message: string, statusCode: number, layerName?: string) {
        super(message)
        this.statusCode = statusCode
        this.layerName = layerName
      }
    },
  }),
  { virtual: true },
)

jest.mock(
  "@/utils/status-mapping.util.ts",
  () => ({
    mapStatusNameToEnum: jest.fn(),
  }),
  { virtual: true },
)

const mockStatusRepository = {
  findById: jest.fn(),
  listByProjectId: jest.fn(),
  findByProjectAndName: jest.fn(),
  getMaxOrder: jest.fn(),
  clearDefaultStatus: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findDefaultStatus: jest.fn(),
}

const mockProjectRepository = {
  findById: jest.fn(),
  isMember: jest.fn(),
}

const mockTaskRepository = {
  syncLegacyStatus: jest.fn(),
  updateTasksStatusId: jest.fn(),
}

describe("ProjectTaskStatusService", () => {
  let service: ProjectTaskStatusService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ProjectTaskStatusService(
      mockStatusRepository as never,
      mockProjectRepository as never,
      mockTaskRepository as never,
    )
  })

  describe("getStatus", () => {
    it("should return the project task status when caller has access", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-123"
      const projectId = "project-123"
      const mockStatus = {
        id: statusId,
        projectId,
        name: "In Progress",
        isDefault: false,
        isCompleted: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(mockStatus)

      // Act
      const result = await service.getStatus(statusId, userId)

      // Assert
      expect(result).toEqual(mockStatus)
      expect(mockStatusRepository.findById).toHaveBeenCalledWith(statusId)
    })

    it("should throw NOT_FOUND error when status does not exist", async () => {
      // Arrange
      const statusId = "status-invalid"
      const userId = "user-123"
      mockStatusRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getStatus(statusId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Status not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw NOT_FOUND error when status project does not exist", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-123"
      const projectId = "project-invalid"
      const mockStatus = {
        id: statusId,
        projectId,
        name: "In Progress",
        isDefault: false,
        isCompleted: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockStatusRepository.findById.mockResolvedValue(mockStatus)
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getStatus(statusId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw FORBIDDEN error when caller is not team leader or member", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-stranger"
      const projectId = "project-123"
      const mockStatus = {
        id: statusId,
        projectId,
        name: "In Progress",
        isDefault: false,
        isCompleted: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockStatusRepository.findById.mockResolvedValue(mockStatus)
      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "user-tl" })
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(service.getStatus(statusId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Access denied to this project's statuses.",
          statusCode: 403,
        }),
      )
    })
  })

  describe("listStatuses", () => {
    it("should return a list of project task statuses for authorized member", async () => {
      // Arrange
      const projectId = "project-123"
      const userId = "user-member"
      const mockStatuses = [
        { id: "1", projectId, name: "To Do", isDefault: true, isCompleted: false },
      ]

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "user-tl" })
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockStatusRepository.listByProjectId.mockResolvedValue(mockStatuses)

      // Act
      const result = await service.listStatuses(projectId, userId)

      // Assert
      expect(result).toEqual(mockStatuses)
      expect(mockStatusRepository.listByProjectId).toHaveBeenCalledWith(projectId)
    })

    it("should throw NOT_FOUND error when project is not found during access validation", async () => {
      // Arrange
      const projectId = "project-invalid"
      const userId = "user-123"

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.listStatuses(projectId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw FORBIDDEN error when unauthorized client attempts to list statuses", async () => {
      // Arrange
      const projectId = "project-123"
      const userId = "user-unauthorized"

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "user-tl" })
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(service.listStatuses(projectId, userId)).rejects.toThrow(
        expect.objectContaining({
          statusCode: 403,
        }),
      )
    })
  })

  describe("createStatus", () => {
    it("should successfully create a new task status", async () => {
      // Arrange
      const userId = "user-admin"
      const dto = {
        projectId: "project-123",
        name: "New Status",
        isDefault: false,
      }
      const createdStatus = { id: "status-new", ...dto, order: 1 }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findByProjectAndName.mockResolvedValue(null)
      mockStatusRepository.listByProjectId.mockResolvedValue([{ id: "existing" }])
      mockStatusRepository.getMaxOrder.mockResolvedValue(0)
      mockStatusRepository.create.mockResolvedValue(createdStatus)

      // Act
      const result = await service.createStatus(dto, userId)

      // Assert
      expect(result).toEqual(createdStatus)
      expect(mockStatusRepository.create).toHaveBeenCalledWith({
        ...dto,
        order: 1,
      })
    })

    it("should throw CONFLICT error when status name already exists in the project", async () => {
      // Arrange
      const userId = "user-admin"
      const dto = {
        projectId: "project-123",
        name: "Existing Status",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findByProjectAndName.mockResolvedValue({ id: "exists" })

      // Act & Assert
      await expect(service.createStatus(dto, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Status name already exists in this project",
          statusCode: 409,
        }),
      )
    })

    it("should throw FORBIDDEN error when user has writeAccess restrictions (not TL or Admin)", async () => {
      // Arrange
      const userId = "user-normal-member"
      const dto = {
        projectId: "project-123",
        name: "New Status",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(),
      })
      mockProjectRepository.findById.mockResolvedValue({
        id: "project-123",
        teamLeaderId: "user-tl",
      })

      // Act & Assert
      await expect(service.createStatus(dto, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Access denied. Only Team Leaders or Managers can modify project statuses.",
          statusCode: 403,
        }),
      )
    })

    it("should throw database execution error if repository.create fails", async () => {
      // Arrange
      const userId = "user-admin"
      const dto = {
        projectId: "project-123",
        name: "Failure Status",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findByProjectAndName.mockResolvedValue(null)
      mockStatusRepository.getMaxOrder.mockResolvedValue(3)
      mockStatusRepository.create.mockRejectedValue(new Error("DB operation failed"))

      // Act & Assert
      await expect(service.createStatus(dto, userId)).rejects.toThrow("DB operation failed")
    })
  })

  describe("updateStatus", () => {
    it("should successfully update task status details and trigger syncLegacyStatus if name updates", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-admin"
      const dto = { name: "Updated Name", isCompleted: true }
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Old Name",
        isDefault: false,
        isCompleted: false,
      }
      const updatedStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Updated Name",
        isDefault: false,
        isCompleted: true,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)
      mockStatusRepository.findByProjectAndName.mockResolvedValue(null)
      mockStatusRepository.update.mockResolvedValue(updatedStatus)
      ;(mapStatusNameToEnum as jest.Mock).mockReturnValue("COMPLETED")
      mockTaskRepository.syncLegacyStatus.mockResolvedValue(undefined)

      // Act
      const result = await service.updateStatus(statusId, dto, userId)

      // Assert
      expect(result).toEqual(updatedStatus)
      expect(mapStatusNameToEnum).toHaveBeenCalledWith("Updated Name", true)
      expect(mockTaskRepository.syncLegacyStatus).toHaveBeenCalledWith(statusId, "COMPLETED")
    })

    it("should throw NOT_FOUND error when status to update does not exist", async () => {
      // Arrange
      const statusId = "status-invalid"
      const userId = "user-admin"
      const dto = { name: "Updates" }

      mockStatusRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.updateStatus(statusId, dto, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Status not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw BAD_REQUEST error when trying to unset default status without assignment", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-admin"
      const dto = { isDefault: false }
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Default Status",
        isDefault: true,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)

      // Act & Assert
      await expect(service.updateStatus(statusId, dto, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Cannot unset default status. Please set another status as default instead.",
          statusCode: 400,
        }),
      )
    })

    it("should throw CONFLICT error when new name is already utilized in the same project", async () => {
      // Arrange
      const statusId = "status-123"
      const userId = "user-admin"
      const dto = { name: "Conflict Status" }
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Old Status",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)
      mockStatusRepository.findByProjectAndName.mockResolvedValue({ id: "another-status" })

      // Act & Assert
      await expect(service.updateStatus(statusId, dto, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Status name already exists in this project",
          statusCode: 409,
        }),
      )
    })
  })

  describe("deleteStatus", () => {
    it("should delete task status and update legacy tasks with fallback status ID", async () => {
      // Arrange
      const statusId = "status-delete"
      const fallbackId = "status-fallback"
      const userId = "user-admin"
      const projectId = "project-123"

      const currentStatus = { id: statusId, projectId, name: "To Delete", isDefault: false }
      const fallbackStatus = {
        id: fallbackId,
        projectId,
        name: "Fallback",
        isDefault: true,
        isCompleted: false,
      }
      const projectStatuses = [currentStatus, fallbackStatus]

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockImplementation((id) => {
        if (id === statusId) return Promise.resolve(currentStatus)
        if (id === fallbackId) return Promise.resolve(fallbackStatus)
        return Promise.resolve(null)
      })
      mockStatusRepository.listByProjectId.mockResolvedValue(projectStatuses)
      mockTaskRepository.updateTasksStatusId.mockResolvedValue(undefined)
      ;(mapStatusNameToEnum as jest.Mock).mockReturnValue("FALLBACK_ENUM")
      mockTaskRepository.syncLegacyStatus.mockResolvedValue(undefined)
      mockStatusRepository.delete.mockResolvedValue(true)

      // Act
      const result = await service.deleteStatus(statusId, fallbackId, userId)

      // Assert
      expect(result).toBe(true)
      expect(mockTaskRepository.updateTasksStatusId).toHaveBeenCalledWith(
        projectId,
        statusId,
        fallbackId,
      )
      expect(mockTaskRepository.syncLegacyStatus).toHaveBeenCalledWith(fallbackId, "FALLBACK_ENUM")
      expect(mockStatusRepository.delete).toHaveBeenCalledWith(statusId)
    })

    it("should delete task status and clear task reference when fallback is absent", async () => {
      // Arrange
      const statusId = "status-delete"
      const userId = "user-admin"
      const projectId = "project-123"

      const currentStatus = { id: statusId, projectId, name: "To Delete", isDefault: false }
      const otherStatus = { id: "other", projectId, name: "Remaining", isDefault: true }
      const projectStatuses = [currentStatus, otherStatus]

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)
      mockStatusRepository.listByProjectId.mockResolvedValue(projectStatuses)
      mockTaskRepository.updateTasksStatusId.mockResolvedValue(undefined)
      mockStatusRepository.delete.mockResolvedValue(true)

      // Act
      const result = await service.deleteStatus(statusId, undefined, userId)

      // Assert
      expect(result).toBe(true)
      expect(mockTaskRepository.updateTasksStatusId).toHaveBeenCalledWith(projectId, statusId, null)
      expect(mockStatusRepository.delete).toHaveBeenCalledWith(statusId)
    })

    it("should throw NOT_FOUND error when status to delete is not found", async () => {
      // Arrange
      const statusId = "status-invalid"
      const userId = "user-admin"

      mockStatusRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.deleteStatus(statusId, undefined, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Status not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw BAD_REQUEST error when attempting to delete the default status", async () => {
      // Arrange
      const statusId = "status-default"
      const userId = "user-admin"
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Default",
        isDefault: true,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)

      // Act & Assert
      await expect(service.deleteStatus(statusId, undefined, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Cannot delete the default status. Please set another status as default first.",
          statusCode: 400,
        }),
      )
    })

    it("should throw BAD_REQUEST error if only one status remains in the project", async () => {
      // Arrange
      const statusId = "status-only"
      const userId = "user-admin"
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "Only One",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)
      mockStatusRepository.listByProjectId.mockResolvedValue([currentStatus])

      // Act & Assert
      await expect(service.deleteStatus(statusId, undefined, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Cannot delete the only status in the project.",
          statusCode: 400,
        }),
      )
    })

    it("should throw BAD_REQUEST error when fallback status matches status being deleted", async () => {
      // Arrange
      const statusId = "status-delete"
      const userId = "user-admin"
      const currentStatus = {
        id: statusId,
        projectId: "project-123",
        name: "To Delete",
        isDefault: false,
      }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockResolvedValue(currentStatus)
      mockStatusRepository.listByProjectId.mockResolvedValue([currentStatus, { id: "other" }])

      // Act & Assert
      await expect(service.deleteStatus(statusId, statusId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Fallback status cannot be the same as the status being deleted.",
          statusCode: 400,
        }),
      )
    })

    it("should throw BAD_REQUEST error when fallback status belongs to a different project or does not exist", async () => {
      // Arrange
      const statusId = "status-delete"
      const fallbackId = "status-foreign"
      const userId = "user-admin"
      const projectId = "project-123"

      const currentStatus = { id: statusId, projectId, name: "To Delete", isDefault: false }
      const foreignStatus = { id: fallbackId, projectId: "project-different", name: "Foreign" }

      ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
        permissions: new Set(["project.update"]),
      })
      mockStatusRepository.findById.mockImplementation((id) => {
        if (id === statusId) return Promise.resolve(currentStatus)
        if (id === fallbackId) return Promise.resolve(foreignStatus)
        return Promise.resolve(null)
      })
      mockStatusRepository.listByProjectId.mockResolvedValue([currentStatus, { id: "other" }])

      // Act & Assert
      await expect(service.deleteStatus(statusId, fallbackId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Fallback status not found or belongs to another project.",
          statusCode: 400,
        }),
      )
    })
  })

  describe("createDefaultStatuses", () => {
    it("should create default statuses successfully and return array of created statuses", async () => {
      // Arrange
      const projectId = "project-123"
      const mockResultStatus = {
        id: "status-todo",
        projectId,
        name: "To Do",
        color: "#ff0000",
        order: 1,
        isDefault: true,
        isCompleted: false,
      }
      mockStatusRepository.create.mockResolvedValue(mockResultStatus)

      // Act
      const result = await service.createDefaultStatuses(projectId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockResultStatus)
      expect(mockStatusRepository.create).toHaveBeenCalledTimes(2)
    })

    it("should propagate database error during default status creation", async () => {
      // Arrange
      const projectId = "project-123"
      mockStatusRepository.create.mockRejectedValue(new Error("Transaction timeout"))

      // Act & Assert
      await expect(service.createDefaultStatuses(projectId)).rejects.toThrow("Transaction timeout")
    })

    it("should throw validation or system errors raised when parameters are incomplete", async () => {
      // Arrange
      const projectId = "project-123"
      mockStatusRepository.create
        .mockResolvedValueOnce({ id: "status-first" })
        .mockRejectedValueOnce(new Error("Invalid arguments provided"))

      // Act & Assert
      await expect(service.createDefaultStatuses(projectId)).rejects.toThrow(
        "Invalid arguments provided",
      )
    })
  })
})
