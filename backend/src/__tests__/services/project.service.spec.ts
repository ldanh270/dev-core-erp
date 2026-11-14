/// <reference types="jest" />
import { authorizationService } from "@/services/authorization.service.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"

import { PrismaClient } from "@prisma/client"

import { ProjectService } from "../../services/project.service"

// ----------------------------------------------------
// Mocks
// ----------------------------------------------------

jest.mock("@/configs/entities/project.config.ts", () => ({
  DEFAULT_PROJECT_TASK_STATUSES: [
    { name: "Todo", color: "#000000", order: 1, isDefault: true, isCompleted: false },
    { name: "In Progress", color: "#0000ff", order: 2, isDefault: false, isCompleted: false },
  ],
  PROJECT_STATUS: {
    PLANNING: "PLANNING",
    ACTIVE: "ACTIVE",
  },
  TASK_CREATION_POLICY: {
    LEADER_ONLY: "LEADER_ONLY",
    ANYONE: "ANYONE",
  },
}))

jest.mock("@/utils/employee/is-part-time-work-schedule.util.ts", () => ({
  isPartTimeWorkSchedule: jest.fn(),
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    OK: 200,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
  },
}))

jest.mock("@/services/authorization.service.ts", () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn(),
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    public statusCode: number
    public serviceName: string
    constructor(message: string, statusCode: number, serviceName: string) {
      super(message)
      this.message = message
      this.statusCode = statusCode
      this.serviceName = serviceName
    }
  },
}))

jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    $transaction: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  }
})

describe("ProjectService", () => {
  let projectService: ProjectService
  let mockProjectRepository: Record<string, jest.Mock>
  let mockEmployeeRepository: Record<string, jest.Mock>
  let mockPrismaClient: unknown
  let mockStatusService: Record<string, jest.Mock>

  beforeEach(() => {
    jest.clearAllMocks()

    mockProjectRepository = {
      findById: jest.fn(),
      isMember: jest.fn(),
      listProjects: jest.fn(),
      findByName: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      getMember: jest.fn(),
      updateMember: jest.fn(),
      getMembers: jest.fn(),
      getGanttData: jest.fn(),
    }

    mockEmployeeRepository = {
      findById: jest.fn(),
    }

    mockPrismaClient = new PrismaClient()
    mockStatusService = {}

    projectService = new ProjectService(
      mockProjectRepository as never,
      mockEmployeeRepository as never,
      mockPrismaClient as never,
      mockStatusService as never,
    )
  })

  // Helper helper to mock user permissions
  const mockUserPermission = (isAdmin: boolean) => {
    ;(authorizationService.getAuthorizationContext as jest.Mock).mockResolvedValue({
      permissions: {
        has: jest.fn().mockReturnValue(isAdmin),
      },
    })
  }

  // ----------------------------------------------------
  // ProjectService.getProject
  // ----------------------------------------------------
  describe("getProject", () => {
    it("should successfully return the project when the user is Admin/GM", async () => {
      // Arrange
      const projectId = "proj-123"
      const userId = "admin-user"
      const projectMock = {
        id: projectId,
        name: "Alpha Project",
        teamLeaderId: "tl-user",
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(projectMock)
      mockUserPermission(true)

      // Act
      const result = await projectService.getProject(projectId, userId)

      // Assert
      expect(result).toEqual(projectMock)
      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId)
    })

    it("should successfully return the project when the user is Team Leader but not Admin/GM", async () => {
      // Arrange
      const projectId = "proj-123"
      const userId = "tl-user"
      const projectMock = {
        id: projectId,
        name: "Alpha Project",
        teamLeaderId: userId,
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(projectMock)
      mockUserPermission(false)

      // Act
      const result = await projectService.getProject(projectId, userId)

      // Assert
      expect(result).toEqual(projectMock)
    })

    it("should throw AppError 404 if project is not found", async () => {
      // Arrange
      const projectId = "non-existent"
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.getProject(projectId, "user-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 (Access Denied) when user is not admin, not TL, and not a member", async () => {
      // Arrange
      const projectId = "proj-123"
      const userId = "stranger-user"
      const projectMock = {
        id: projectId,
        name: "Alpha Project",
        teamLeaderId: "another-tl",
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(projectMock)
      mockUserPermission(false)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(projectService.getProject(projectId, userId)).rejects.toThrow(
        expect.objectContaining({
          message: "Access denied",
          statusCode: 403,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.listProjects
  // ----------------------------------------------------
  describe("listProjects", () => {
    it("should list projects when permission context returns correctly", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const userId = "user-1"
      const expectedOutput = { data: [], total: 0 }
      mockUserPermission(false)
      mockProjectRepository.listProjects.mockResolvedValue(expectedOutput)

      // Act
      const result = await projectService.listProjects(query, userId)

      // Assert
      expect(result).toEqual(expectedOutput)
      expect(mockProjectRepository.listProjects).toHaveBeenCalledWith(query, userId, false)
    })

    it("should correctly propagate parameter isAdminOrGM as true when user is admin", async () => {
      // Arrange
      const query = { page: 1, limit: 10 }
      const userId = "admin-user"
      mockUserPermission(true)
      mockProjectRepository.listProjects.mockResolvedValue({ data: [], total: 0 })

      // Act
      await projectService.listProjects(query, userId)

      // Assert
      expect(mockProjectRepository.listProjects).toHaveBeenCalledWith(query, userId, true)
    })

    it("should propagate repository errors upward", async () => {
      // Arrange
      const query = {}
      mockUserPermission(true)
      mockProjectRepository.listProjects.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(projectService.listProjects(query, "user-1")).rejects.toThrow("Database error")
    })
  })

  // ----------------------------------------------------
  // ProjectService.createProject
  // ----------------------------------------------------
  describe("createProject", () => {
    it("should successfully create a project with default statuses inside a transaction when caller is admin", async () => {
      // Arrange
      const userId = "admin-user"
      const createData = {
        name: "New Project",
        description: "New Project Description",
        techStack: ["Node.js"],
        status: "PLANNING",
        teamLeaderId: "tl-1",
        startDate: "2023-01-01",
        expectedEndDate: "2023-12-31",
        taskCreationPolicy: "LEADER_ONLY",
      }

      const createdProjectMock = {
        id: "proj-new",
        name: createData.name,
        description: createData.description,
        techStack: createData.techStack,
        status: createData.status,
        teamLeaderId: createData.teamLeaderId,
        createdById: userId,
        startDate: new Date(createData.startDate),
        expectedEndDate: new Date(createData.expectedEndDate),
        taskCreationPolicy: createData.taskCreationPolicy,
      }

      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "tl-1" })
      mockProjectRepository.findByName.mockResolvedValue(null)

      const txProjectCreateMock = jest.fn().mockResolvedValue(createdProjectMock)
      const txTaskStatusCreateMock = jest.fn().mockResolvedValue({})

      ;(mockPrismaClient as { $transaction: jest.Mock }).$transaction.mockImplementation(
        async (
          callback: (tx: {
            project: { create: jest.Mock }
            projectTaskStatus: { create: jest.Mock }
          }) => Promise<unknown>,
        ) => {
          const tx = {
            project: {
              create: txProjectCreateMock,
            },
            projectTaskStatus: {
              create: txTaskStatusCreateMock,
            },
          }
          return callback(tx)
        },
      )

      // Act
      const result = await projectService.createProject(createData as never, userId)

      // Assert
      expect(result).toEqual(createdProjectMock)
      expect(txProjectCreateMock).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          techStack: createData.techStack,
          status: createData.status,
          teamLeaderId: createData.teamLeaderId,
          createdById: userId,
          startDate: new Date(createData.startDate),
          expectedEndDate: new Date(createData.expectedEndDate),
          taskCreationPolicy: createData.taskCreationPolicy,
        },
      })
      expect(txTaskStatusCreateMock).toHaveBeenCalledTimes(2) // From mock config statuses
    })

    it("should throw AppError 403 when user is not admin or GM", async () => {
      // Arrange
      mockUserPermission(false)

      // Act & Assert
      await expect(
        projectService.createProject({ name: "Alpha" } as never, "non-admin"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Only General Managers or Admins can create projects",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 when configured teamLeaderId is not found", async () => {
      // Arrange
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.createProject(
          { name: "Alpha", teamLeaderId: "unknown-tl" } as never,
          "admin-id",
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Team Leader employee not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 409 when project name already exists", async () => {
      // Arrange
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "tl-1" })
      mockProjectRepository.findByName.mockResolvedValue({ id: "existing-proj" })

      // Act & Assert
      await expect(
        projectService.createProject(
          { name: "Duplicate Name", teamLeaderId: "tl-1" } as never,
          "admin-id",
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Project name already exists",
          statusCode: 409,
        }),
      )
    })

    it("should throw AppError 400 when start date is after expected end date", async () => {
      // Arrange
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "tl-1" })
      mockProjectRepository.findByName.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.createProject(
          {
            name: "Wrong Dates",
            startDate: "2023-12-31",
            expectedEndDate: "2023-01-01",
            teamLeaderId: "tl-1",
          } as never,
          "admin-id",
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
          statusCode: 400,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.updateProject
  // ----------------------------------------------------
  describe("updateProject", () => {
    it("should successfully update project properties when caller is Admin and values are valid", async () => {
      // Arrange
      const projectId = "proj-1"
      const userId = "admin-id"
      const existingProject = {
        id: projectId,
        name: "Old Name",
        teamLeaderId: "tl-1",
        startDate: new Date("2023-01-01"),
        expectedEndDate: new Date("2023-12-31"),
        actualEndDate: null,
      }

      const updateData = {
        name: "Updated Name",
        startDate: "2023-02-01",
        expectedEndDate: "2023-11-30",
        actualEndDate: "2023-11-15",
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(true)
      mockProjectRepository.findByName.mockResolvedValue(null)
      mockProjectRepository.updateProject.mockResolvedValue({ ...existingProject, ...updateData })

      // Act
      const result = await projectService.updateProject(projectId, updateData, userId)

      // Assert
      expect(result).toEqual(expect.objectContaining({ name: "Updated Name" }))
      expect(mockProjectRepository.updateProject).toHaveBeenCalledWith(projectId, updateData)
    })

    it("should throw AppError 404 when project is not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.updateProject("non-existent", { name: "New Name" }, "admin-id"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 when user is neither Admin/GM nor the Team Leader", async () => {
      // Arrange
      const existingProject = {
        id: "proj-1",
        name: "Test Project",
        teamLeaderId: "some-other-tl",
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(false)

      // Act & Assert
      await expect(
        projectService.updateProject("proj-1", { name: "Attempt" }, "normal-user"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Only Admins, GMs, or the Project's Team Leader can update this project",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 if the new teamLeaderId is not found", async () => {
      // Arrange
      const existingProject = {
        id: "proj-1",
        name: "Test Project",
        teamLeaderId: "admin-id",
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.updateProject("proj-1", { teamLeaderId: "non-existent-tl" }, "admin-id"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Team Leader employee not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 409 if project name changes and conflicts with an existing project", async () => {
      // Arrange
      const existingProject = {
        id: "proj-1",
        name: "Original Name",
        teamLeaderId: "admin-id",
        startDate: null,
        expectedEndDate: null,
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(true)
      mockProjectRepository.findByName.mockResolvedValue({ id: "proj-2", name: "Conflicting Name" })

      // Act & Assert
      await expect(
        projectService.updateProject("proj-1", { name: "Conflicting Name" }, "admin-id"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Project name already exists",
          statusCode: 409,
        }),
      )
    })

    it("should throw AppError 400 when start date > expected end date during update", async () => {
      // Arrange
      const existingProject = {
        id: "proj-1",
        name: "Proj Name",
        teamLeaderId: "admin-id",
        startDate: new Date("2023-01-01"),
        expectedEndDate: new Date("2023-12-31"),
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(true)

      // Act & Assert
      await expect(
        projectService.updateProject(
          "proj-1",
          { startDate: "2024-01-01", expectedEndDate: "2023-05-01" },
          "admin-id",
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến",
          statusCode: 400,
        }),
      )
    })

    it("should throw AppError 400 when start date > actual end date during update", async () => {
      // Arrange
      const existingProject = {
        id: "proj-1",
        name: "Proj Name",
        teamLeaderId: "admin-id",
        startDate: new Date("2023-05-01"),
        expectedEndDate: new Date("2023-12-31"),
        actualEndDate: null,
      }

      mockProjectRepository.findById.mockResolvedValue(existingProject)
      mockUserPermission(true)

      // Act & Assert
      await expect(
        projectService.updateProject(
          "proj-1",
          { actualEndDate: "2023-04-01" }, // start date is 2023-05-01
          "admin-id",
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Ngày bắt đầu không được lớn hơn ngày kết thúc thực tế",
          statusCode: 400,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.deleteProject
  // ----------------------------------------------------
  describe("deleteProject", () => {
    it("should successfully delete a project when caller is admin", async () => {
      // Arrange
      const projectId = "proj-1"
      const userId = "admin-id"
      mockUserPermission(true)
      mockProjectRepository.findById.mockResolvedValue({ id: projectId })
      mockProjectRepository.deleteProject.mockResolvedValue(true)

      // Act
      const result = await projectService.deleteProject(projectId, userId)

      // Assert
      expect(result).toBe(true)
      expect(mockProjectRepository.deleteProject).toHaveBeenCalledWith(projectId)
    })

    it("should throw AppError 403 when non-admin attempts deletion", async () => {
      // Arrange
      mockUserPermission(false)

      // Act & Assert
      await expect(projectService.deleteProject("proj-1", "user-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Only General Managers or Admins can delete projects",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 when project does not exist", async () => {
      // Arrange
      mockUserPermission(true)
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.deleteProject("non-existent", "admin-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.addMember
  // ----------------------------------------------------
  describe("addMember", () => {
    it("should successfully add full-time member to project", async () => {
      // Arrange
      const projectId = "proj-1"
      const employeeId = "emp-1"
      const userId = "admin-id"
      const options = { hourlyRate: null, workMode: "remote", roleId: null }

      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: employeeId })
      ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(false) // Full-time employee
      mockProjectRepository.isMember.mockResolvedValue(false)
      mockProjectRepository.addMember.mockResolvedValue(true)

      // Act
      const result = await projectService.addMember(projectId, employeeId, userId, options)

      // Assert
      expect(result).toBe(true)
      expect(mockProjectRepository.addMember).toHaveBeenCalledWith(projectId, employeeId, options)
    })

    it("should throw AppError 404 if project not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.addMember("non-existent", "emp-1", "user-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 if user has no authority to manage members", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(false)

      // Act & Assert
      await expect(projectService.addMember("proj-1", "emp-1", "random-user")).rejects.toThrow(
        expect.objectContaining({
          message: "Only Admins, GMs, or the Project's Team Leader can manage members",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 if employee does not exist", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.addMember("proj-1", "non-existent-emp", "admin-id"),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Employee not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 422 for part-time worker without a valid hourly rate", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "emp-pt" })
      ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(true) // Part-time worker

      // Act & Assert
      await expect(
        projectService.addMember("proj-1", "emp-pt", "admin-id", { hourlyRate: null }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Part-time members require an hourly rate",
          statusCode: 422,
        }),
      )
    })

    it("should throw AppError 409 if employee is already a member of the project", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "emp-1" })
      ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(false)
      mockProjectRepository.isMember.mockResolvedValue(true)

      // Act & Assert
      await expect(projectService.addMember("proj-1", "emp-1", "admin-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Employee is already a member of this project",
          statusCode: 409,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.removeMember
  // ----------------------------------------------------
  describe("removeMember", () => {
    it("should successfully remove member when authorization check passes", async () => {
      // Arrange
      const projectId = "proj-1"
      const employeeId = "emp-1"
      const userId = "admin-id"

      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockProjectRepository.removeMember.mockResolvedValue(true)

      // Act
      const result = await projectService.removeMember(projectId, employeeId, userId)

      // Assert
      expect(result).toBe(true)
      expect(mockProjectRepository.removeMember).toHaveBeenCalledWith(projectId, employeeId)
    })

    it("should throw AppError 404 when project not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.removeMember("non-existent", "emp-1", "user-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 when access is denied", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(false)

      // Act & Assert
      await expect(projectService.removeMember("proj-1", "emp-1", "random-user")).rejects.toThrow(
        expect.objectContaining({
          message: "Only Admins, GMs, or the Project's Team Leader can manage members",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 when employee is not a member of the project", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(projectService.removeMember("proj-1", "emp-1", "admin-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Employee is not a member of this project",
          statusCode: 404,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.updateMember
  // ----------------------------------------------------
  describe("updateMember", () => {
    it("should successfully update member data when validations pass", async () => {
      // Arrange
      const projectId = "proj-1"
      const employeeId = "emp-1"
      const userId = "admin-id"
      const updateData = { hourlyRate: 50, workMode: "onsite", roleId: null }

      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: employeeId })
      mockProjectRepository.getMember.mockResolvedValue({ hourlyRate: 30 })
      ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(true) // PT with rate of 50 (valid)
      mockProjectRepository.updateMember.mockResolvedValue(true)

      // Act
      const result = await projectService.updateMember(projectId, employeeId, userId, updateData)

      // Assert
      expect(result).toBe(true)
      expect(mockProjectRepository.updateMember).toHaveBeenCalledWith(
        projectId,
        employeeId,
        updateData,
      )
    })

    it("should throw AppError 404 if project is not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        projectService.updateMember("non-existent", "emp-1", "admin-id", {}),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 if user lacks access control", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(false)

      // Act & Assert
      await expect(
        projectService.updateMember("proj-1", "emp-1", "random-user", {}),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Only Admins, GMs, or the Project's Team Leader can manage members",
          statusCode: 403,
        }),
      )
    })

    it("should throw AppError 404 if user is not a member of project", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(projectService.updateMember("proj-1", "emp-1", "admin-id", {})).rejects.toThrow(
        expect.objectContaining({
          message: "Employee is not a member of this project",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 404 if employee is not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockEmployeeRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.updateMember("proj-1", "emp-1", "admin-id", {})).rejects.toThrow(
        expect.objectContaining({
          message: "Employee not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 422 if part-time worker hourly rate resolves to null or <= 0", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.isMember.mockResolvedValue(true)
      mockEmployeeRepository.findById.mockResolvedValue({ id: "emp-1" })
      mockProjectRepository.getMember.mockResolvedValue({ hourlyRate: null })
      ;(isPartTimeWorkSchedule as jest.Mock).mockReturnValue(true)

      // Act & Assert
      await expect(
        projectService.updateMember("proj-1", "emp-1", "admin-id", { hourlyRate: 0 }),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Part-time members require an hourly rate",
          statusCode: 422,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.getMembers
  // ----------------------------------------------------
  describe("getMembers", () => {
    it("should return list of project members when project access is verified", async () => {
      // Arrange
      const projectId = "proj-1"
      const userId = "admin-id"
      const expectedMembers = [{ employeeId: "emp-1", hourlyRate: null, roleId: null }]

      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.getMembers.mockResolvedValue(expectedMembers)

      // Act
      const result = await projectService.getMembers(projectId, userId)

      // Assert
      expect(result).toEqual(expectedMembers)
      expect(mockProjectRepository.getMembers).toHaveBeenCalledWith(projectId)
    })

    it("should throw AppError 404 if project is not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.getMembers("non-existent", "admin-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 if project access is denied", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(false)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(projectService.getMembers("proj-1", "normal-user")).rejects.toThrow(
        expect.objectContaining({
          message: "Access denied",
          statusCode: 403,
        }),
      )
    })
  })

  // ----------------------------------------------------
  // ProjectService.getGanttData
  // ----------------------------------------------------
  describe("getGanttData", () => {
    it("should load gantt chart payload when access is allowed", async () => {
      // Arrange
      const projectId = "proj-1"
      const userId = "admin-id"
      const expectedGantt = { tasks: [], members: [] }

      mockProjectRepository.findById.mockResolvedValue({ id: projectId, teamLeaderId: "tl-1" })
      mockUserPermission(true)
      mockProjectRepository.getGanttData.mockResolvedValue(expectedGantt)

      // Act
      const result = await projectService.getGanttData(projectId, userId)

      // Assert
      expect(result).toEqual(expectedGantt)
      expect(mockProjectRepository.getGanttData).toHaveBeenCalledWith(projectId)
    })

    it("should throw AppError 404 if project is not found", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(projectService.getGanttData("non-existent", "admin-id")).rejects.toThrow(
        expect.objectContaining({
          message: "Project not found",
          statusCode: 404,
        }),
      )
    })

    it("should throw AppError 403 if project access is forbidden for Gantt data", async () => {
      // Arrange
      mockProjectRepository.findById.mockResolvedValue({ id: "proj-1", teamLeaderId: "tl-1" })
      mockUserPermission(false)
      mockProjectRepository.isMember.mockResolvedValue(false)

      // Act & Assert
      await expect(projectService.getGanttData("proj-1", "stranger")).rejects.toThrow(
        expect.objectContaining({
          message: "Access denied",
          statusCode: 403,
        }),
      )
    })
  })
})
