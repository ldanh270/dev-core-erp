/// <reference types="jest" />
import { ProjectRoleService } from "../../services/project-role.service"
import type { IProjectRepository, IProjectRoleRepository } from "../../types"

// Mock all external dependencies using their exact alias paths with virtual: true
jest.mock("@/types", () => ({}), { virtual: true })

jest.mock(
  "@/utils/error.util.ts",
  () => {
    return {
      AppError: class AppError extends Error {
        public statusCode: number
        public layer: string
        constructor(message: string, statusCode: number, layer: string) {
          super(message)
          this.name = "AppError"
          this.statusCode = statusCode
          this.layer = layer
        }
      },
    }
  },
  { virtual: true },
)

jest.mock(
  "@/configs/system/http.config.ts",
  () => ({
    HttpStatusCode: {
      NOT_FOUND: 404,
      CONFLICT: 409,
      BAD_REQUEST: 400,
      OK: 200,
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
  "@/configs/entities/project.config.ts",
  () => ({
    PROJECT_ROLE: {
      LEADER: "leader",
      DEVELOPER: "developer",
      TESTER: "tester",
      VIEWER: "viewer",
    },
  }),
  { virtual: true },
)

describe("ProjectRoleService", () => {
  let service: ProjectRoleService
  let mockProjectRepository: {
    findById: jest.Mock
  }
  let mockProjectRoleRepository: {
    list: jest.Mock
    create: jest.Mock
    createMany: jest.Mock
    findById: jest.Mock
    update: jest.Mock
    delete: jest.Mock
    findByCode: jest.Mock
  }

  beforeEach(() => {
    mockProjectRepository = {
      findById: jest.fn(),
    }
    mockProjectRoleRepository = {
      list: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCode: jest.fn(),
    }
    service = new ProjectRoleService(
      mockProjectRoleRepository as unknown as IProjectRoleRepository,
      mockProjectRepository as unknown as IProjectRepository,
    )
  })

  describe("list", () => {
    it("should return list of project roles when project exists and roles are not empty", async () => {
      // Arrange
      const projectId = "proj-123"
      const mockRoles = [{ id: "role-1", projectId, name: "Developer", code: "developer" }]
      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRoleRepository.list.mockResolvedValue(mockRoles)

      // Act
      const result = await service.list(projectId)

      // Assert
      expect(result).toEqual(mockRoles)
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
      expect(mockProjectRoleRepository.list).toHaveBeenCalledWith(projectId)
    })

    it("should seed default roles and return the new list when role set is empty", async () => {
      // Arrange
      const projectId = "proj-123"
      const mockSeededRoles = [
        { id: "role-1", projectId, name: "Trưởng nhóm", code: "leader" },
        { id: "role-2", projectId, name: "Lập trình viên", code: "developer" },
      ]
      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRoleRepository.list
        .mockResolvedValueOnce([]) // First list call returns empty to trigger seeding
        .mockResolvedValueOnce(mockSeededRoles) // Second list call returns seeded roles

      // Act
      const result = await service.list(projectId)

      // Assert
      expect(mockProjectRoleRepository.createMany).toHaveBeenCalledWith(projectId, [
        {
          name: "Trưởng nhóm",
          code: "leader",
          allowedTaskTrackers: [
            "feature",
            "bug",
            "support",
            "task",
            "meeting",
            "test",
            "subtask",
            "management",
          ],
        },
        {
          name: "Lập trình viên",
          code: "developer",
          allowedTaskTrackers: [
            "feature",
            "bug",
            "support",
            "task",
            "meeting",
            "test",
            "subtask",
            "management",
          ],
        },
        { name: "Kiểm thử viên", code: "tester", allowedTaskTrackers: ["bug", "test"] },
        { name: "Người xem", code: "viewer", allowedTaskTrackers: [] },
      ])
      expect(result).toEqual(mockSeededRoles)
    })

    it("should throw NOT_FOUND error when project does not exist", async () => {
      // Arrange
      const projectId = "non-existent"
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.list(projectId)).rejects.toThrow("Dự án không tồn tại")
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
      expect(mockProjectRoleRepository.list).not.toHaveBeenCalled()
    })

    it("should propagate database error when repository.list throws", async () => {
      // Arrange
      const projectId = "proj-123"
      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRoleRepository.list.mockRejectedValue(new Error("Database connectivity failure"))

      // Act & Assert
      await expect(service.list(projectId)).rejects.toThrow("Database connectivity failure")
    })
  })

  describe("create", () => {
    it("should successfully create a new custom project role and generate the slug code", async () => {
      // Arrange
      const projectId = "proj-123"
      const inputDto = { name: "Lập trình viên cấp cao", allowedTaskTrackers: ["feature"] }
      const expectedCode = "lap-trinh-vien-cap-cao"
      const createdRole = { id: "role-new", projectId, name: inputDto.name, code: expectedCode }

      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRoleRepository.list.mockResolvedValue([])
      mockProjectRoleRepository.create.mockResolvedValue(createdRole)

      // Act
      const result = await service.create(projectId, inputDto)

      // Assert
      expect(result).toEqual(createdRole)
      expect(mockProjectRoleRepository.create).toHaveBeenCalledWith(projectId, {
        name: inputDto.name,
        allowedTaskTrackers: inputDto.allowedTaskTrackers,
        code: expectedCode,
      })
    })

    it("should throw NOT_FOUND error when project does not exist", async () => {
      // Arrange
      const projectId = "non-existent"
      const inputDto = { name: "New Role", allowedTaskTrackers: [] as string[] }
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.create(projectId, inputDto)).rejects.toThrow("Dự án không tồn tại")
    })

    it("should throw CONFLICT error when duplicate role code or name already exists in the project", async () => {
      // Arrange
      const projectId = "proj-123"
      const inputDto = { name: "Developer Custom", allowedTaskTrackers: [] as string[] }
      const existingRoles = [
        { id: "role-1", projectId, name: "Developer Custom", code: "developer-custom" },
      ]

      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRoleRepository.list.mockResolvedValue(existingRoles)

      // Act & Assert
      await expect(service.create(projectId, inputDto)).rejects.toThrow(
        "Vai trò này đã tồn tại trong dự án",
      )
    })
  })

  describe("update", () => {
    it("should successfully update project role details and update code if name changes", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "role-1"
      const updateDto = { name: "Updated Tester Custom", allowedTaskTrackers: ["bug"] }
      const existingRole = { id: roleId, projectId, name: "Tester Custom", code: "tester-custom" }
      const updatedRole = {
        id: roleId,
        projectId,
        name: updateDto.name,
        code: "updated-tester-custom",
      }

      mockProjectRoleRepository.findById.mockResolvedValue(existingRole)
      mockProjectRoleRepository.list.mockResolvedValue([existingRole])
      mockProjectRoleRepository.update.mockResolvedValue(updatedRole)

      // Act
      const result = await service.update(projectId, roleId, updateDto)

      // Assert
      expect(result).toEqual(updatedRole)
      expect(mockProjectRoleRepository.update).toHaveBeenCalledWith(roleId, {
        name: updateDto.name,
        allowedTaskTrackers: updateDto.allowedTaskTrackers,
        code: "updated-tester-custom",
      })
    })

    it("should throw NOT_FOUND error if role does not exist", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "non-existent-role"
      const updateDto = { name: "Updated" }
      mockProjectRoleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.update(projectId, roleId, updateDto)).rejects.toThrow(
        "Vai trò không tồn tại hoặc không thuộc dự án này",
      )
    })

    it("should throw NOT_FOUND error if role exists but belongs to a different project", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "role-1"
      const updateDto = { name: "Updated" }
      const existingRole = {
        id: roleId,
        projectId: "different-project",
        name: "Tester Custom",
        code: "tester-custom",
      }

      mockProjectRoleRepository.findById.mockResolvedValue(existingRole)

      // Act & Assert
      await expect(service.update(projectId, roleId, updateDto)).rejects.toThrow(
        "Vai trò không tồn tại hoặc không thuộc dự án này",
      )
    })

    it("should throw CONFLICT error when new name conflicts with another role in the project", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "role-1"
      const updateDto = { name: "Duplicate Name" }
      const existingRoleToUpdate = {
        id: roleId,
        projectId,
        name: "Tester Custom",
        code: "tester-custom",
      }
      const conflictingRole = {
        id: "role-2",
        projectId,
        name: "Duplicate Name",
        code: "duplicate-name",
      }

      mockProjectRoleRepository.findById.mockResolvedValue(existingRoleToUpdate)
      mockProjectRoleRepository.list.mockResolvedValue([existingRoleToUpdate, conflictingRole])

      // Act & Assert
      await expect(service.update(projectId, roleId, updateDto)).rejects.toThrow(
        "Tên vai trò đã tồn tại trong dự án",
      )
    })
  })

  describe("delete", () => {
    it("should successfully delete role if it exists, belongs to project, and is not Leader", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "role-1"
      const existingRole = { id: roleId, projectId, name: "Viewer Custom", code: "viewer-custom" }

      mockProjectRoleRepository.findById.mockResolvedValue(existingRole)
      mockProjectRoleRepository.delete.mockResolvedValue(undefined)

      // Act
      await service.delete(projectId, roleId)

      // Assert
      expect(mockProjectRoleRepository.delete).toHaveBeenCalledWith(roleId)
    })

    it("should throw NOT_FOUND error when role to delete does not exist", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "non-existent"
      mockProjectRoleRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.delete(projectId, roleId)).rejects.toThrow(
        "Vai trò không tồn tại hoặc không thuộc dự án này",
      )
    })

    it("should throw BAD_REQUEST error when trying to delete default Leader role", async () => {
      // Arrange
      const projectId = "proj-123"
      const roleId = "role-leader-id"
      const leaderRole = { id: roleId, projectId, name: "Trưởng nhóm", code: "leader" }

      mockProjectRoleRepository.findById.mockResolvedValue(leaderRole)

      // Act & Assert
      await expect(service.delete(projectId, roleId)).rejects.toThrow(
        "Không thể xóa vai trò Trưởng nhóm mặc định",
      )
      expect(mockProjectRoleRepository.delete).not.toHaveBeenCalled()
    })
  })
})
