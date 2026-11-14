import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AppError } from "@/utils/error.util.ts"

import { ProjectTrackerService } from "../../services/project-tracker.service"

/// <reference types="jest" />
// Mocking external modules virtually before imports
jest.mock("@/types", () => ({}), { virtual: true })
jest.mock(
  "@/utils/error.util.ts",
  () => {
    return {
      AppError: class AppError extends Error {
        statusCode: number
        layer: string
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

describe("ProjectTrackerService", () => {
  let service: ProjectTrackerService
  let mockProjectTrackerRepository: Record<string, jest.Mock>
  let mockProjectRepository: Record<string, jest.Mock>

  beforeEach(() => {
    mockProjectTrackerRepository = {
      list: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }

    mockProjectRepository = {
      findById: jest.fn(),
    }

    service = new ProjectTrackerService(
      mockProjectTrackerRepository as never,
      mockProjectRepository as never,
    )
  })

  describe("list", () => {
    it("should return project trackers list when project exists and list is not empty (Happy Path)", async () => {
      // Arrange
      const projectId = "proj-1"
      const mockProject = { id: projectId, name: "Project 1" }
      const mockTrackers = [
        { id: "tracker-1", name: "Tính năng", code: "feature", isActive: true, projectId },
      ]

      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list.mockResolvedValue(mockTrackers)

      // Act
      const result = await service.list(projectId)

      // Assert
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
      expect(mockProjectTrackerRepository.list).toHaveBeenCalledWith(projectId)
      expect(result).toEqual(mockTrackers)
    })

    it("should seed default trackers and return list when tracker list is empty (Happy Path Alternate)", async () => {
      // Arrange
      const projectId = "proj-1"
      const mockProject = { id: projectId, name: "Project 1" }
      const mockTrackers = [
        { id: "tracker-1", name: "Tính năng", code: "feature", isActive: true, projectId },
      ]

      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockTrackers)

      // Act
      const result = await service.list(projectId)

      // Assert
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
      expect(mockProjectTrackerRepository.createMany).toHaveBeenCalledWith(
        projectId,
        expect.arrayContaining([{ name: "Tính năng", code: "feature", isActive: true }]),
      )
      expect(result).toEqual(mockTrackers)
    })

    it("should throw AppError 404 when project does not exist (Error Case 1)", async () => {
      // Arrange
      const projectId = "non-existent-proj"
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.list(projectId)).rejects.toThrow(
        new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE),
      )
    })

    it("should propagate errors thrown by repository list (Error Case 2)", async () => {
      // Arrange
      const projectId = "proj-1"
      const mockProject = { id: projectId, name: "Project 1" }
      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list.mockRejectedValue(new Error("Database connection failed"))

      // Act & Assert
      await expect(service.list(projectId)).rejects.toThrow("Database connection failed")
    })
  })

  describe("create", () => {
    it("should successfully create a new tracker with generated slug (Happy Path)", async () => {
      // Arrange
      const projectId = "proj-1"
      const dto = { name: "Yêu cầu mới", isActive: true }
      const mockProject = { id: projectId, name: "Project 1" }
      const mockCreatedTracker = {
        id: "tracker-2",
        name: "Yêu cầu mới",
        code: "yeu-cau-moi",
        isActive: true,
        projectId,
      }

      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list.mockResolvedValue([])
      mockProjectTrackerRepository.create.mockResolvedValue(mockCreatedTracker)

      // Act
      const result = await service.create(projectId, dto)

      // Assert
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
      expect(mockProjectTrackerRepository.create).toHaveBeenCalledWith(projectId, {
        name: "Yêu cầu mới",
        isActive: true,
        code: "yeu-cau-moi",
      })
      expect(result).toEqual(mockCreatedTracker)
    })

    it("should correctly slugify complex Vietnamese characters (Happy Path Alternate)", async () => {
      // Arrange
      const projectId = "proj-1"
      const dto = { name: "  Hỗ Trợ Kỹ Thuật!  ", isActive: true }
      const mockProject = { id: projectId, name: "Project 1" }
      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list.mockResolvedValue([])
      mockProjectTrackerRepository.create.mockImplementation(
        (projId: string, data: Record<string, unknown>) =>
          Promise.resolve({ id: "tracker-id", ...data }),
      )

      // Act
      const result = await service.create(projectId, dto)

      // Assert
      expect(result.code).toBe("ho-tro-ky-thuat")
    })

    it("should throw AppError 404 if project is not found during creation (Error Case 1)", async () => {
      // Arrange
      const projectId = "non-existent-proj"
      const dto = { name: "New Tracker", isActive: true }
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.create(projectId, dto)).rejects.toThrow(
        new AppError("Dự án không tồn tại", HttpStatusCode.NOT_FOUND, ErrorLayer.SERVICE),
      )
    })

    it("should throw AppError 409 if a tracker with the same code or name already exists (Error Case 2)", async () => {
      // Arrange
      const projectId = "proj-1"
      const dto = { name: "Tính năng", isActive: true }
      const mockProject = { id: projectId, name: "Project 1" }
      const existingTrackers = [
        { id: "tracker-1", name: "Tính năng", code: "tinh-nang", isActive: true, projectId },
      ]

      mockProjectRepository.findById.mockResolvedValue(mockProject)
      mockProjectTrackerRepository.list.mockResolvedValue(existingTrackers)

      // Act & Assert
      await expect(service.create(projectId, dto)).rejects.toThrow(
        new AppError(
          "Loại yêu cầu này đã tồn tại trong dự án",
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
        ),
      )
    })
  })

  describe("update", () => {
    it("should update the tracker successfully when valid and no duplicate name (Happy Path)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "tracker-1"
      const dto = { name: "Mới cập nhật", isActive: false }
      const existingTracker = { id: trackerId, name: "Cũ", code: "cu", isActive: true, projectId }
      const updatedTracker = {
        id: trackerId,
        name: "Mới cập nhật",
        code: "moi-cap-nhat",
        isActive: false,
        projectId,
      }

      mockProjectTrackerRepository.findById.mockResolvedValue(existingTracker)
      mockProjectTrackerRepository.list.mockResolvedValue([existingTracker])
      mockProjectTrackerRepository.update.mockResolvedValue(updatedTracker)

      // Act
      const result = await service.update(projectId, trackerId, dto)

      // Assert
      expect(mockProjectTrackerRepository.findById).toHaveBeenCalledWith(trackerId)
      expect(mockProjectTrackerRepository.update).toHaveBeenCalledWith(trackerId, {
        name: "Mới cập nhật",
        isActive: false,
        code: "moi-cap-nhat",
      })
      expect(result).toEqual(updatedTracker)
    })

    it("should throw AppError 404 when tracker does not exist (Error Case 1)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "non-existent-tracker"
      const dto = { name: "Updated" }
      mockProjectTrackerRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.update(projectId, trackerId, dto)).rejects.toThrow(
        new AppError(
          "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        ),
      )
    })

    it("should throw AppError 404 when tracker belongs to a different project (Error Case 2)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "tracker-1"
      const dto = { name: "Updated" }
      const existingTracker = {
        id: trackerId,
        name: "Cũ",
        code: "cu",
        isActive: true,
        projectId: "different-proj",
      }
      mockProjectTrackerRepository.findById.mockResolvedValue(existingTracker)

      // Act & Assert
      await expect(service.update(projectId, trackerId, dto)).rejects.toThrow(
        new AppError(
          "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        ),
      )
    })

    it("should throw AppError 409 if updated name causes duplicate code (Error Case 3)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "tracker-1"
      const dto = { name: "Trùng lặp" }
      const existingTracker = { id: trackerId, name: "Cũ", code: "cu", isActive: true, projectId }
      const anotherTracker = {
        id: "tracker-2",
        name: "Trùng lặp",
        code: "trung-lap",
        isActive: true,
        projectId,
      }

      mockProjectTrackerRepository.findById.mockResolvedValue(existingTracker)
      mockProjectTrackerRepository.list.mockResolvedValue([existingTracker, anotherTracker])

      // Act & Assert
      await expect(service.update(projectId, trackerId, dto)).rejects.toThrow(
        new AppError(
          "Tên loại yêu cầu đã tồn tại trong dự án",
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
        ),
      )
    })
  })

  describe("delete", () => {
    it("should successfully delete tracker when found and matching project (Happy Path)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "tracker-1"
      const existingTracker = {
        id: trackerId,
        name: "Test",
        code: "test",
        isActive: true,
        projectId,
      }

      mockProjectTrackerRepository.findById.mockResolvedValue(existingTracker)
      mockProjectTrackerRepository.delete.mockResolvedValue(undefined)

      // Act
      await service.delete(projectId, trackerId)

      // Assert
      expect(mockProjectTrackerRepository.findById).toHaveBeenCalledWith(trackerId)
      expect(mockProjectTrackerRepository.delete).toHaveBeenCalledWith(trackerId)
    })

    it("should throw AppError 404 when tracker does not exist (Error Case 1)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "non-existent-tracker"
      mockProjectTrackerRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.delete(projectId, trackerId)).rejects.toThrow(
        new AppError(
          "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        ),
      )
    })

    it("should throw AppError 404 when tracker belongs to a different project (Error Case 2)", async () => {
      // Arrange
      const projectId = "proj-1"
      const trackerId = "tracker-1"
      const existingTracker = {
        id: trackerId,
        name: "Test",
        code: "test",
        isActive: true,
        projectId: "different-proj",
      }
      mockProjectTrackerRepository.findById.mockResolvedValue(existingTracker)

      // Act & Assert
      await expect(service.delete(projectId, trackerId)).rejects.toThrow(
        new AppError(
          "Loại yêu cầu không tồn tại hoặc không thuộc dự án này",
          HttpStatusCode.NOT_FOUND,
          ErrorLayer.SERVICE,
        ),
      )
    })
  })
})
