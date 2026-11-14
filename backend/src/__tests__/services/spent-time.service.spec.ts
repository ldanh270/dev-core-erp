/// <reference types="jest" />
import { PROJECT_MEMBER_WORK_MODE, SPENT_TIME_STATUS } from "@/configs/entities/project.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import type {
  CreateSpentTimeDto,
  IProjectRepository,
  ISpentTimeRepository,
  ITaskRepository,
  SpentTime,
  SpentTimeQuery,
  UpdateSpentTimeDto,
} from "@/types"
import type { IAttendanceRepository } from "@/types/attendance.types.ts"

import { jest } from "@jest/globals"

import { SpentTimeService } from "../../services/spent-time.service"

jest.mock("@/configs/entities/project.config.ts", () => ({
  PROJECT_MEMBER_WORK_MODE: {
    ONSITE: "ONSITE",
    REMOTE: "REMOTE",
  },
  SPENT_TIME_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },
}))

jest.mock("@/configs/rules/project.config.ts", () => ({
  SPENT_TIME_RULES: {
    ENFORCE_ESTIMATE_CAP: true,
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    UNPROCESSABLE_ENTITY: 422,
    CONFLICT: 409,
  },
}))

jest.mock("@/services/authorization.service.ts", () => ({
  authorizationService: {
    getAuthorizationContext: jest.fn(),
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
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
}))

type MockedSpentTimeRepository = jest.Mocked<ISpentTimeRepository>
type MockedTaskRepository = jest.Mocked<ITaskRepository>
type MockedProjectRepository = jest.Mocked<IProjectRepository>
type MockedAttendanceRepository = jest.Mocked<IAttendanceRepository>
type MockedGetAuthorizationContext = jest.MockedFunction<
  typeof authorizationService.getAuthorizationContext
>
type AuthorizationContext = Awaited<ReturnType<typeof authorizationService.getAuthorizationContext>>

const mockedGetAuthorizationContext =
  authorizationService.getAuthorizationContext as MockedGetAuthorizationContext

const createSpentTimeRecord = (overrides: Partial<SpentTime> = {}): SpentTime =>
  ({
    id: "st-1",
    taskId: "task-1",
    employeeId: "user-1",
    hours: 2,
    date: new Date("2024-01-01T00:00:00.000Z"),
    status: SPENT_TIME_STATUS.PENDING,
    approvedBy: null,
    rejectedBy: null,
    rejectReason: null,
    approvedAt: null,
    rejectedAt: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  }) as unknown as SpentTime

const createRepositories = (): {
  repository: MockedSpentTimeRepository
  taskRepository: MockedTaskRepository
  projectRepository: MockedProjectRepository
  attendanceRepository: MockedAttendanceRepository
} => {
  const repository = {
    findById: jest.fn(),
    sumTaskHours: jest.fn(),
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    listApprovedForPayroll: jest.fn(),
  } as unknown as MockedSpentTimeRepository

  const taskRepository = {
    findById: jest.fn(),
  } as unknown as MockedTaskRepository

  const projectRepository = {
    findById: jest.fn(),
    getMember: jest.fn(),
    isMember: jest.fn(),
  } as unknown as MockedProjectRepository

  const attendanceRepository = {
    findByEmployeeAndDate: jest.fn(),
  } as unknown as MockedAttendanceRepository

  return {
    repository,
    taskRepository,
    projectRepository,
    attendanceRepository,
  }
}

const createService = () => {
  const deps = createRepositories()

  const service = new SpentTimeService(
    deps.repository,
    deps.taskRepository,
    deps.projectRepository,
    deps.attendanceRepository,
  )

  return { service, ...deps }
}

const mockAuth = (hasPermission: boolean) => {
  mockedGetAuthorizationContext.mockResolvedValue({
    permissions: new Set(hasPermission ? ["project.update"] : []),
  } as AuthorizationContext)
}

describe("SpentTimeService.getSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - returns the record for the owner", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    const record = createSpentTimeRecord()
    repository.findById.mockResolvedValue(record)
    mockAuth(false)

    // Act
    const result = await service.getSpentTime("st-1", "user-1")

    // Assert
    expect(result).toEqual(record)
    expect(repository.findById).toHaveBeenCalledWith("st-1")
    expect(taskRepository.findById).not.toHaveBeenCalled()
    expect(projectRepository.findById).not.toHaveBeenCalled()
  })

  it("UTCID02 - throws not found when record does not exist", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(null)

    // Act
    const act = service.getSpentTime("missing", "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Spent time record not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws forbidden when user is not owner admin or team leader", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        employeeId: "owner-1",
      }),
    )
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "other-lead",
    } as never)
    mockAuth(false)

    // Act
    const act = service.getSpentTime("st-1", "user-2")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied",
      statusCode: 403,
    })
  })
})

describe("SpentTimeService.listSpentTimes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - returns records and scopes query to current user for non-admin without filters", async () => {
    // Arrange
    const { service, repository } = createService()
    const query = {} as SpentTimeQuery
    const records = [createSpentTimeRecord({ hours: 1 })]
    mockAuth(false)
    repository.list.mockResolvedValue(records)

    // Act
    const result = await service.listSpentTimes(query, "user-1")

    // Assert
    expect(result).toEqual(records)
    expect(query).toEqual({ employeeId: "user-1" })
    expect(repository.list).toHaveBeenCalledWith({ employeeId: "user-1" })
  })

  it("UTCID02 - throws not found when project filter references missing project", async () => {
    // Arrange
    const { service, projectRepository } = createService()
    const query = { projectId: "project-1" } as SpentTimeQuery
    mockAuth(false)
    projectRepository.findById.mockResolvedValue(null)

    // Act
    const act = service.listSpentTimes(query, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Project not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws forbidden when user has no access to project logs", async () => {
    // Arrange
    const { service, projectRepository } = createService()
    const query = { projectId: "project-1" } as SpentTimeQuery
    mockAuth(false)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    projectRepository.isMember.mockResolvedValue(false)

    // Act
    const act = service.listSpentTimes(query, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied to this project's logs",
      statusCode: 403,
    })
  })
})

describe("SpentTimeService.createSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - creates spent time for a project member", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository, attendanceRepository } =
      createService()
    const data = {
      taskId: "task-1",
      hours: 2,
      date: "2024-01-01",
      employeeId: null,
    } as unknown as CreateSpentTimeDto
    const created = createSpentTimeRecord()
    mockAuth(false)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    projectRepository.isMember.mockResolvedValue(true)
    repository.sumTaskHours.mockResolvedValue(3)
    projectRepository.getMember.mockResolvedValue({
      employeeId: "user-1",
      workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
    } as never)
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null)
    repository.create.mockResolvedValue(created)

    // Act
    const result = await service.createSpentTime(data, "user-1")

    // Assert
    expect(result).toEqual(created)
    expect((data as { employeeId: string | null }).employeeId).toBe("user-1")
    expect(repository.create).toHaveBeenCalledWith({
      taskId: "task-1",
      hours: 2,
      date: "2024-01-01",
      employeeId: "user-1",
    })
  })

  it("UTCID02 - throws not found when task does not exist", async () => {
    // Arrange
    const { service, taskRepository } = createService()
    const data = {
      taskId: "missing-task",
      hours: 2,
      date: "2024-01-01",
      employeeId: null,
    } as unknown as CreateSpentTimeDto
    mockAuth(false)
    taskRepository.findById.mockResolvedValue(null)

    // Act
    const act = service.createSpentTime(data, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Task not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws forbidden when non-admin user is not a team leader or project member", async () => {
    // Arrange
    const { service, taskRepository, projectRepository } = createService()
    const data = {
      taskId: "task-1",
      hours: 2,
      date: "2024-01-01",
      employeeId: null,
    } as unknown as CreateSpentTimeDto
    mockAuth(false)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    projectRepository.isMember.mockResolvedValue(false)

    // Act
    const act = service.createSpentTime(data, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied to log time for this project",
      statusCode: 403,
    })
  })

  it("UTCID04 - throws unprocessable entity when onsite member has no check-in", async () => {
    // Arrange
    const { service, taskRepository, projectRepository, repository, attendanceRepository } =
      createService()
    const data = {
      taskId: "task-1",
      hours: 2,
      date: "2024-01-01",
      employeeId: null,
    } as unknown as CreateSpentTimeDto
    mockAuth(false)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    projectRepository.isMember.mockResolvedValue(true)
    repository.sumTaskHours.mockResolvedValue(1)
    projectRepository.getMember.mockResolvedValue({
      employeeId: "user-1",
      workMode: PROJECT_MEMBER_WORK_MODE.ONSITE,
    } as never)
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
      id: "att-1",
      checkInAt: null,
    } as never)

    // Act
    const act = service.createSpentTime(data, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Nhân viên onsite phải check-in trước khi ghi Spent Time",
      statusCode: 422,
    })
  })
})

describe("SpentTimeService.updateSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - updates a pending spent time record owned by the user", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository, attendanceRepository } =
      createService()
    const record = createSpentTimeRecord()
    const updateData = {
      hours: 3,
      date: new Date("2024-01-02T00:00:00.000Z"),
    } as unknown as UpdateSpentTimeDto
    const updated = createSpentTimeRecord({
      hours: 3,
      date: new Date("2024-01-02T00:00:00.000Z"),
    })
    repository.findById.mockResolvedValue(record)
    mockAuth(false)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    repository.sumTaskHours.mockResolvedValue(2)
    projectRepository.getMember.mockResolvedValue({
      employeeId: "user-1",
      workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
    } as never)
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null)
    repository.update.mockResolvedValue(updated)

    // Act
    const result = await service.updateSpentTime("st-1", updateData, "user-1")

    // Assert
    expect(result).toEqual(updated)
    expect(repository.update).toHaveBeenCalledWith("st-1", updateData)
    expect(repository.sumTaskHours).toHaveBeenCalledWith("task-1", "st-1")
  })

  it("UTCID02 - throws not found when record does not exist", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(null)

    // Act
    const act = service.updateSpentTime("missing", { hours: 3 } as UpdateSpentTimeDto, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Spent time record not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws conflict when record is not pending", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        status: SPENT_TIME_STATUS.APPROVED,
      }),
    )

    // Act
    const act = service.updateSpentTime("st-1", { hours: 3 } as UpdateSpentTimeDto, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Chỉ có thể sửa log đang chờ duyệt",
      statusCode: 409,
    })
  })

  it("UTCID04 - throws forbidden when non-admin user does not own the record", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        employeeId: "owner-1",
      }),
    )
    mockAuth(false)

    // Act
    const act = service.updateSpentTime("st-1", { hours: 3 } as UpdateSpentTimeDto, "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied to update this log",
      statusCode: 403,
    })
  })
})

describe("SpentTimeService.deleteSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - deletes a pending spent time record owned by the user", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(createSpentTimeRecord())
    mockAuth(false)
    repository.delete.mockResolvedValue(true)

    // Act
    const result = await service.deleteSpentTime("st-1", "user-1")

    // Assert
    expect(result).toBe(true)
    expect(repository.delete).toHaveBeenCalledWith("st-1")
  })

  it("UTCID02 - throws not found when record does not exist", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(null)

    // Act
    const act = service.deleteSpentTime("missing", "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Spent time record not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws conflict when record is not pending", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        status: SPENT_TIME_STATUS.APPROVED,
      }),
    )

    // Act
    const act = service.deleteSpentTime("st-1", "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Chỉ có thể xóa log đang chờ duyệt",
      statusCode: 409,
    })
  })

  it("UTCID04 - throws forbidden when non-admin user does not own the record", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        employeeId: "owner-1",
      }),
    )
    mockAuth(false)

    // Act
    const act = service.deleteSpentTime("st-1", "user-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied to delete this log",
      statusCode: 403,
    })
  })
})

describe("SpentTimeService.approveSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - approves a pending spent time record as team leader", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    const record = createSpentTimeRecord()
    const approved = createSpentTimeRecord({
      status: SPENT_TIME_STATUS.APPROVED,
      approvedBy: {
        id: "lead-1",
        fullName: "Lead One",
      },
    } as unknown as Partial<SpentTime>)
    repository.findById.mockResolvedValue(record)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(false)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    repository.approve.mockResolvedValue(approved)

    // Act
    const result = await service.approveSpentTime("st-1", "lead-1")

    // Assert
    expect(result).toEqual(approved)
    expect(repository.approve).toHaveBeenCalledWith("st-1", "lead-1")
  })

  it("UTCID02 - throws not found when record does not exist", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(null)

    // Act
    const act = service.approveSpentTime("missing", "lead-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Spent time record not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws forbidden when user is not admin and not project team leader", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    repository.findById.mockResolvedValue(createSpentTimeRecord())
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(false)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)

    // Act
    const act = service.approveSpentTime("st-1", "user-2")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied",
      statusCode: 403,
    })
  })

  it("UTCID04 - throws conflict when record is already processed", async () => {
    // Arrange
    const { service, repository, taskRepository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        status: SPENT_TIME_STATUS.APPROVED,
      }),
    )
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(true)

    // Act
    const act = service.approveSpentTime("st-1", "admin-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Log đã được xử lý",
      statusCode: 409,
    })
  })
})

describe("SpentTimeService.rejectSpentTime", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("UTCID01 - rejects a pending spent time record as team leader", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    const record = createSpentTimeRecord()
    const rejected = createSpentTimeRecord({
      status: SPENT_TIME_STATUS.REJECTED,
      rejectedBy: {
        id: "lead-1",
        fullName: "Lead One",
      },
      rejectReason: "Invalid log",
    } as unknown as Partial<SpentTime>)
    repository.findById.mockResolvedValue(record)
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(false)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)
    repository.reject.mockResolvedValue(rejected)

    // Act
    const result = await service.rejectSpentTime("st-1", "Invalid log", "lead-1")

    // Assert
    expect(result).toEqual(rejected)
    expect(repository.reject).toHaveBeenCalledWith("st-1", "lead-1", "Invalid log")
  })

  it("UTCID02 - throws not found when record does not exist", async () => {
    // Arrange
    const { service, repository } = createService()
    repository.findById.mockResolvedValue(null)

    // Act
    const act = service.rejectSpentTime("missing", "Invalid", "lead-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Spent time record not found",
      statusCode: 404,
    })
  })

  it("UTCID03 - throws forbidden when user is not admin and not project team leader", async () => {
    // Arrange
    const { service, repository, taskRepository, projectRepository } = createService()
    repository.findById.mockResolvedValue(createSpentTimeRecord())
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(false)
    projectRepository.findById.mockResolvedValue({
      id: "project-1",
      teamLeaderId: "lead-1",
    } as never)

    // Act
    const act = service.rejectSpentTime("st-1", "Invalid", "user-2")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Access denied",
      statusCode: 403,
    })
  })

  it("UTCID04 - throws conflict when record is already processed", async () => {
    // Arrange
    const { service, repository, taskRepository } = createService()
    repository.findById.mockResolvedValue(
      createSpentTimeRecord({
        status: SPENT_TIME_STATUS.REJECTED,
      }),
    )
    taskRepository.findById.mockResolvedValue({
      id: "task-1",
      projectId: "project-1",
      estimatedTime: 8,
    } as never)
    mockAuth(true)

    // Act
    const act = service.rejectSpentTime("st-1", "Invalid", "admin-1")

    // Assert
    await expect(act).rejects.toMatchObject({
      message: "Log đã được xử lý",
      statusCode: 409,
    })
  })
})
