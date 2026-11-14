/// <reference types="jest" />
import { WEEKLY_SCHEDULE_MESSAGES } from "@/configs/messages/weekly-schedule.message.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import type { IEmployeeRepository } from "@/types/employee.types.ts"
import type { IEmployeeShiftRepository, IShiftScheduleRepository } from "@/types/shift.types.ts"
import type {
  IApplyWeeklyScheduleTemplateDTO,
  ICreateWeeklyScheduleTemplateDTO,
  IUpdateWeeklyScheduleTemplateDTO,
  IWeeklyScheduleTemplateRepository,
  IWeeklyScheduleTemplateWithWeeks,
} from "@/types/weekly-schedule-template.types.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { getCycleWeekIndex, normalizeScheduleDate } from "@/utils/schedule.util.ts"

import { jest } from "@jest/globals"

import { WeeklyScheduleTemplateService } from "../../services/weekly-schedule-template.service"

jest.mock("@/utils/employee/is-part-time-work-schedule.util.ts", () => ({
  isPartTimeWorkSchedule: jest.fn(),
}))

jest.mock("@/configs/messages/weekly-schedule.message.ts", () => ({
  WEEKLY_SCHEDULE_MESSAGES: {
    PART_TIME_NOT_APPLICABLE: "PART_TIME_NOT_APPLICABLE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },
}))

jest.mock("@/types/shift.types.ts", () => ({}))
jest.mock("@/types/employee.types.ts", () => ({}))
jest.mock("@/types/weekly-schedule-template.types.ts", () => ({}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    source: string

    constructor(message: string, statusCode: number, source: string) {
      super(message)
      this.name = "AppError"
      this.statusCode = statusCode
      this.source = source
    }
  },
}))

jest.mock("@/utils/schedule.util.ts", () => ({
  getCycleWeekIndex: jest.fn(),
  normalizeScheduleDate: jest.fn(),
}))

type TemplateRepoMock = {
  create: jest.MockedFunction<IWeeklyScheduleTemplateRepository["create"]>
  update: jest.MockedFunction<IWeeklyScheduleTemplateRepository["update"]>
  findById: jest.MockedFunction<IWeeklyScheduleTemplateRepository["findById"]>
  delete: jest.MockedFunction<IWeeklyScheduleTemplateRepository["delete"]>
  listAll: jest.MockedFunction<IWeeklyScheduleTemplateRepository["listAll"]>
}

type ScheduleRepoMock = {
  assignSchedule: jest.MockedFunction<IShiftScheduleRepository["assignSchedule"]>
}

type EmployeeShiftRepoMock = {
  ensureShiftForEmployeeDate: jest.MockedFunction<
    IEmployeeShiftRepository["ensureShiftForEmployeeDate"]
  >
}

type EmployeeRepoMock = {
  findById: jest.MockedFunction<IEmployeeRepository["findById"]>
}

type TemplateLike = {
  id: string
  name: string
  isActive: boolean
  cycleWeeks: number
  weeks: Array<{
    weekIndex: number
    days: Array<{
      dayOfWeek: number
      shiftId: string | null
    }>
  }>
}

describe("WeeklyScheduleTemplateService", () => {
  let templateRepo: TemplateRepoMock
  let scheduleRepo: ScheduleRepoMock
  let employeeShiftRepo: EmployeeShiftRepoMock
  let employeeRepo: EmployeeRepoMock
  let service: WeeklyScheduleTemplateService

  const mockedIsPartTimeWorkSchedule = jest.mocked(isPartTimeWorkSchedule)
  const mockedGetCycleWeekIndex = jest.mocked(getCycleWeekIndex)
  const mockedNormalizeScheduleDate = jest.mocked(normalizeScheduleDate)

  const createTemplateRecord = (
    overrides: Partial<TemplateLike> = {},
  ): IWeeklyScheduleTemplateWithWeeks =>
    ({
      id: "template-1",
      name: "Template A",
      isActive: true,
      cycleWeeks: 2,
      weeks: [
        {
          weekIndex: 0,
          days: [
            { dayOfWeek: 1, shiftId: "shift-1" },
            { dayOfWeek: 2, shiftId: null },
          ],
        },
        {
          weekIndex: 1,
          days: [{ dayOfWeek: 3, shiftId: "shift-2" }],
        },
      ],
      ...overrides,
    }) as unknown as IWeeklyScheduleTemplateWithWeeks

  const createEmployeeShiftAssignmentRecord = () =>
    ({
      id: "employee-shift-1",
      employeeId: "emp-1",
      shiftId: "shift-mon",
      date: new Date("2024-01-01T00:00:00.000Z"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      createdById: "admin-1",
      shift: {
        id: "shift-mon",
        name: "Morning Shift",
        startTime: 8,
        endTime: 17,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        gracePeriodMinutes: 15,
        gpsLat: null,
        gpsLng: null,
        gpsRadiusMeters: 100,
        isActive: true,
        createdById: "admin-1",
      },
    }) as never

  beforeEach(() => {
    templateRepo = {
      create: jest.fn<IWeeklyScheduleTemplateRepository["create"]>(),
      update: jest.fn<IWeeklyScheduleTemplateRepository["update"]>(),
      findById: jest.fn<IWeeklyScheduleTemplateRepository["findById"]>(),
      delete: jest.fn<IWeeklyScheduleTemplateRepository["delete"]>(),
      listAll: jest.fn<IWeeklyScheduleTemplateRepository["listAll"]>(),
    }

    scheduleRepo = {
      assignSchedule: jest.fn<IShiftScheduleRepository["assignSchedule"]>(),
    }

    employeeShiftRepo = {
      ensureShiftForEmployeeDate: jest.fn<IEmployeeShiftRepository["ensureShiftForEmployeeDate"]>(),
    }

    employeeRepo = {
      findById: jest.fn<IEmployeeRepository["findById"]>(),
    }

    service = new WeeklyScheduleTemplateService(
      templateRepo as unknown as IWeeklyScheduleTemplateRepository,
      scheduleRepo as unknown as IShiftScheduleRepository,
      employeeShiftRepo as unknown as IEmployeeShiftRepository,
      employeeRepo as unknown as IEmployeeRepository,
    )

    jest.clearAllMocks()
  })

  describe("createTemplate", () => {
    it("UTCID01 - creates a template successfully", async () => {
      // Arrange
      const payload = {
        name: "Template A",
        cycleWeeks: 2,
        weeks: [],
      } as unknown as ICreateWeeklyScheduleTemplateDTO
      const created = createTemplateRecord()
      templateRepo.create.mockResolvedValue(created)

      // Act
      const result = await service.createTemplate(payload)

      // Assert
      expect(templateRepo.create).toHaveBeenCalledTimes(1)
      expect(templateRepo.create).toHaveBeenCalledWith(payload)
      expect(result).toEqual(created)
    })

    it("UTCID02 - propagates repository create failure", async () => {
      // Arrange
      const payload = {
        name: "Template A",
        cycleWeeks: 2,
        weeks: [],
      } as unknown as ICreateWeeklyScheduleTemplateDTO
      const error = new Error("create failed")
      templateRepo.create.mockRejectedValue(error)

      // Act
      const act = service.createTemplate(payload)

      // Assert
      await expect(act).rejects.toThrow("create failed")
      expect(templateRepo.create).toHaveBeenCalledWith(payload)
    })

    it("UTCID03 - propagates AppError from repository create", async () => {
      // Arrange
      const payload = {
        name: "Template A",
        cycleWeeks: 2,
        weeks: [],
      } as unknown as ICreateWeeklyScheduleTemplateDTO
      const error = new AppError("invalid create", HttpStatusCode.BAD_REQUEST, "service")
      templateRepo.create.mockRejectedValue(error)

      // Act
      const act = service.createTemplate(payload)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "invalid create",
        statusCode: HttpStatusCode.BAD_REQUEST,
        source: "service",
      })
      expect(templateRepo.create).toHaveBeenCalledWith(payload)
    })
  })

  describe("updateTemplate", () => {
    it("UTCID01 - updates a template successfully", async () => {
      // Arrange
      const id = "template-1"
      const payload = { name: "Updated Template" } as unknown as IUpdateWeeklyScheduleTemplateDTO
      const updated = createTemplateRecord({ name: "Updated Template" })
      templateRepo.update.mockResolvedValue(updated)

      // Act
      const result = await service.updateTemplate(id, payload)

      // Assert
      expect(templateRepo.update).toHaveBeenCalledTimes(1)
      expect(templateRepo.update).toHaveBeenCalledWith(id, payload)
      expect(result).toEqual(updated)
    })

    it("UTCID02 - propagates repository update failure", async () => {
      // Arrange
      const id = "template-1"
      const payload = { name: "Updated Template" } as unknown as IUpdateWeeklyScheduleTemplateDTO
      const error = new Error("update failed")
      templateRepo.update.mockRejectedValue(error)

      // Act
      const act = service.updateTemplate(id, payload)

      // Assert
      await expect(act).rejects.toThrow("update failed")
      expect(templateRepo.update).toHaveBeenCalledWith(id, payload)
    })

    it("UTCID03 - propagates AppError from repository update", async () => {
      // Arrange
      const id = "template-1"
      const payload = { name: "Updated Template" } as unknown as IUpdateWeeklyScheduleTemplateDTO
      const error = new AppError("template not found", HttpStatusCode.NOT_FOUND, "service")
      templateRepo.update.mockRejectedValue(error)

      // Act
      const act = service.updateTemplate(id, payload)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "template not found",
        statusCode: HttpStatusCode.NOT_FOUND,
        source: "service",
      })
      expect(templateRepo.update).toHaveBeenCalledWith(id, payload)
    })
  })

  describe("deleteTemplate", () => {
    it("UTCID01 - deletes an existing template successfully", async () => {
      // Arrange
      const id = "template-1"
      const existing = createTemplateRecord()
      templateRepo.findById.mockResolvedValue(existing)
      templateRepo.delete.mockResolvedValue(undefined)

      // Act
      await service.deleteTemplate(id)

      // Assert
      expect(templateRepo.findById).toHaveBeenCalledTimes(1)
      expect(templateRepo.findById).toHaveBeenCalledWith(id)
      expect(templateRepo.delete).toHaveBeenCalledTimes(1)
      expect(templateRepo.delete).toHaveBeenCalledWith(id)
    })

    it("UTCID02 - throws not found when template does not exist", async () => {
      // Arrange
      const id = "missing-template"
      templateRepo.findById.mockResolvedValue(null)

      // Act
      const act = service.deleteTemplate(id)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Không tìm thấy template lịch hàng tuần",
        statusCode: HttpStatusCode.NOT_FOUND,
        source: "service",
      })
      expect(templateRepo.delete).not.toHaveBeenCalled()
    })

    it("UTCID03 - propagates repository delete failure", async () => {
      // Arrange
      const id = "template-1"
      const existing = createTemplateRecord()
      const error = new Error("delete failed")
      templateRepo.findById.mockResolvedValue(existing)
      templateRepo.delete.mockRejectedValue(error)

      // Act
      const act = service.deleteTemplate(id)

      // Assert
      await expect(act).rejects.toThrow("delete failed")
      expect(templateRepo.findById).toHaveBeenCalledWith(id)
      expect(templateRepo.delete).toHaveBeenCalledWith(id)
    })
  })

  describe("getTemplate", () => {
    it("UTCID01 - returns a template successfully", async () => {
      // Arrange
      const id = "template-1"
      const existing = createTemplateRecord()
      templateRepo.findById.mockResolvedValue(existing)

      // Act
      const result = await service.getTemplate(id)

      // Assert
      expect(templateRepo.findById).toHaveBeenCalledTimes(1)
      expect(templateRepo.findById).toHaveBeenCalledWith(id)
      expect(result).toEqual(existing)
    })

    it("UTCID02 - throws not found when template is missing", async () => {
      // Arrange
      const id = "missing-template"
      templateRepo.findById.mockResolvedValue(null)

      // Act
      const act = service.getTemplate(id)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Không tìm thấy template lịch hàng tuần",
        statusCode: HttpStatusCode.NOT_FOUND,
        source: "service",
      })
    })

    it("UTCID03 - propagates repository find failure", async () => {
      // Arrange
      const id = "template-1"
      const error = new Error("find failed")
      templateRepo.findById.mockRejectedValue(error)

      // Act
      const act = service.getTemplate(id)

      // Assert
      await expect(act).rejects.toThrow("find failed")
      expect(templateRepo.findById).toHaveBeenCalledWith(id)
    })
  })

  describe("listTemplates", () => {
    it("UTCID01 - lists templates successfully", async () => {
      // Arrange
      const templates = [createTemplateRecord(), createTemplateRecord({ id: "template-2" })]
      templateRepo.listAll.mockResolvedValue(templates)

      // Act
      const result = await service.listTemplates()

      // Assert
      expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual(templates)
    })

    it("UTCID02 - propagates repository list failure", async () => {
      // Arrange
      const error = new Error("list failed")
      templateRepo.listAll.mockRejectedValue(error)

      // Act
      const act = service.listTemplates()

      // Assert
      await expect(act).rejects.toThrow("list failed")
      expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
    })

    it("UTCID03 - propagates AppError from repository list", async () => {
      // Arrange
      const error = new AppError("forbidden list", 500, "service")
      templateRepo.listAll.mockRejectedValue(error)

      // Act
      const act = service.listTemplates()

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "forbidden list",
        statusCode: 500,
        source: "service",
      })
      expect(templateRepo.listAll).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyTemplate", () => {
    it("UTCID01 - applies an active template and generates employee shifts successfully", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1", "emp-2"],
        validFrom: "2024-01-01",
        validTo: "2024-01-03",
        createdById: "admin-1",
        generateShifts: true,
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      const template = createTemplateRecord({
        cycleWeeks: 2,
        weeks: [
          {
            weekIndex: 0,
            days: [
              { dayOfWeek: 1, shiftId: "shift-mon" },
              { dayOfWeek: 2, shiftId: "shift-tue" },
            ],
          },
        ],
      })

      const normalizedFrom = new Date("2024-01-01T00:00:00.000Z")
      const normalizedTo = new Date("2024-01-03T00:00:00.000Z")

      templateRepo.findById.mockResolvedValue(template)
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(normalizedFrom)
        .mockReturnValueOnce(normalizedTo)

      employeeRepo.findById
        .mockResolvedValueOnce({ id: "emp-1", workScheduleType: "FULL_TIME" } as never)
        .mockResolvedValueOnce({ id: "emp-2", workScheduleType: "FULL_TIME" } as never)

      mockedIsPartTimeWorkSchedule.mockReturnValue(false)

      scheduleRepo.assignSchedule
        .mockResolvedValueOnce({ id: "schedule-1" } as never)
        .mockResolvedValueOnce({ id: "schedule-2" } as never)

      mockedGetCycleWeekIndex
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)

      employeeShiftRepo.ensureShiftForEmployeeDate.mockResolvedValue(
        createEmployeeShiftAssignmentRecord(),
      )

      // Act
      const result = await service.applyTemplate(data)

      // Assert
      expect(templateRepo.findById).toHaveBeenCalledWith("template-1")
      expect(mockedNormalizeScheduleDate).toHaveBeenNthCalledWith(1, new Date("2024-01-01"))
      expect(mockedNormalizeScheduleDate).toHaveBeenNthCalledWith(2, new Date("2024-01-03"))
      expect(employeeRepo.findById).toHaveBeenNthCalledWith(1, "emp-1")
      expect(employeeRepo.findById).toHaveBeenNthCalledWith(2, "emp-2")
      expect(mockedIsPartTimeWorkSchedule).toHaveBeenCalledTimes(2)

      expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(2)
      expect(scheduleRepo.assignSchedule).toHaveBeenNthCalledWith(1, {
        employeeId: "emp-1",
        validFrom: normalizedFrom,
        validTo: normalizedTo,
        createdById: "admin-1",
        templateId: "template-1",
        cycleWeeks: 2,
        days: [
          { weekIndex: 0, dayOfWeek: 1, shiftId: "shift-mon" },
          { weekIndex: 0, dayOfWeek: 2, shiftId: "shift-tue" },
        ],
      })
      expect(scheduleRepo.assignSchedule).toHaveBeenNthCalledWith(2, {
        employeeId: "emp-2",
        validFrom: normalizedFrom,
        validTo: normalizedTo,
        createdById: "admin-1",
        templateId: "template-1",
        cycleWeeks: 2,
        days: [
          { weekIndex: 0, dayOfWeek: 1, shiftId: "shift-mon" },
          { weekIndex: 0, dayOfWeek: 2, shiftId: "shift-tue" },
        ],
      })

      expect(mockedGetCycleWeekIndex).toHaveBeenCalledTimes(6)
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenCalledTimes(4)
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenNthCalledWith(
        1,
        "emp-1",
        expect.any(Date),
        "shift-mon",
        "admin-1",
      )
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenNthCalledWith(
        2,
        "emp-2",
        expect.any(Date),
        "shift-mon",
        "admin-1",
      )
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenNthCalledWith(
        3,
        "emp-1",
        expect.any(Date),
        "shift-tue",
        "admin-1",
      )
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenNthCalledWith(
        4,
        "emp-2",
        expect.any(Date),
        "shift-tue",
        "admin-1",
      )

      expect(result).toEqual([{ id: "schedule-1" }, { id: "schedule-2" }])
    })

    it("UTCID02 - throws not found when template does not exist", async () => {
      // Arrange
      const data = {
        templateId: "missing-template",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-03",
        createdById: "admin-1",
        generateShifts: true,
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(null)

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Không tìm thấy template lịch hàng tuần",
        statusCode: HttpStatusCode.NOT_FOUND,
        source: "service",
      })
      expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
    })

    it("UTCID03 - throws bad request when template is inactive", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-03",
        createdById: "admin-1",
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(createTemplateRecord({ isActive: false }))

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Template đang tắt, không thể áp dụng",
        statusCode: HttpStatusCode.BAD_REQUEST,
        source: "service",
      })
      expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
    })

    it("UTCID04 - throws bad request when validTo is before validFrom", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-05",
        validTo: "2024-01-01",
        createdById: "admin-1",
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(createTemplateRecord())
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(new Date("2024-01-05T00:00:00.000Z"))
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "validTo phải sau validFrom",
        statusCode: HttpStatusCode.BAD_REQUEST,
        source: "service",
      })
      expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
    })

    it("UTCID05 - throws bad request when template has no scheduled shift days", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-07",
        createdById: "admin-1",
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(
        createTemplateRecord({
          weeks: [
            {
              weekIndex: 0,
              days: [
                { dayOfWeek: 1, shiftId: null },
                { dayOfWeek: 2, shiftId: null },
              ],
            },
          ],
        }),
      )
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
        .mockReturnValueOnce(new Date("2024-01-07T00:00:00.000Z"))

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: "Template không có ca làm việc nào để áp dụng",
        statusCode: HttpStatusCode.BAD_REQUEST,
        source: "service",
      })
      expect(employeeRepo.findById).not.toHaveBeenCalled()
      expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
    })

    it("UTCID06 - throws unprocessable entity when an employee is part time", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-07",
        createdById: "admin-1",
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(createTemplateRecord())
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
        .mockReturnValueOnce(new Date("2024-01-07T00:00:00.000Z"))
      employeeRepo.findById.mockResolvedValue({
        id: "emp-1",
        workScheduleType: "PART_TIME",
      } as never)
      mockedIsPartTimeWorkSchedule.mockReturnValue(true)

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toMatchObject({
        message: WEEKLY_SCHEDULE_MESSAGES.PART_TIME_NOT_APPLICABLE,
        statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
        source: "service",
      })
      expect(scheduleRepo.assignSchedule).not.toHaveBeenCalled()
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
    })

    it("UTCID07 - propagates repository assignSchedule failure", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-07",
        createdById: "admin-1",
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(createTemplateRecord())
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
        .mockReturnValueOnce(new Date("2024-01-07T00:00:00.000Z"))
      employeeRepo.findById.mockResolvedValue({
        id: "emp-1",
        workScheduleType: "FULL_TIME",
      } as never)
      mockedIsPartTimeWorkSchedule.mockReturnValue(false)
      scheduleRepo.assignSchedule.mockRejectedValue(new Error("assign failed"))

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toThrow("assign failed")
      expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
    })

    it("UTCID08 - propagates employee shift generation failure", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: "2024-01-01",
        createdById: "admin-1",
        generateShifts: true,
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      templateRepo.findById.mockResolvedValue(
        createTemplateRecord({
          weeks: [
            {
              weekIndex: 0,
              days: [{ dayOfWeek: 1, shiftId: "shift-mon" }],
            },
          ],
        }),
      )
      mockedNormalizeScheduleDate
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
        .mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
      employeeRepo.findById.mockResolvedValue({
        id: "emp-1",
        workScheduleType: "FULL_TIME",
      } as never)
      mockedIsPartTimeWorkSchedule.mockReturnValue(false)
      scheduleRepo.assignSchedule.mockResolvedValue({ id: "schedule-1" } as never)
      mockedGetCycleWeekIndex.mockReturnValue(0)
      employeeShiftRepo.ensureShiftForEmployeeDate.mockRejectedValue(
        new Error("shift generation failed"),
      )

      // Act
      const act = service.applyTemplate(data)

      // Assert
      await expect(act).rejects.toThrow("shift generation failed")
      expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).toHaveBeenCalledTimes(1)
    })

    it("UTCID09 - applies template without generating shifts when generateShifts is false", async () => {
      // Arrange
      const data = {
        templateId: "template-1",
        employeeIds: ["emp-1"],
        validFrom: "2024-01-01",
        validTo: null,
        createdById: "admin-1",
        generateShifts: false,
      } as unknown as IApplyWeeklyScheduleTemplateDTO

      const template = createTemplateRecord({
        weeks: [
          {
            weekIndex: 0,
            days: [{ dayOfWeek: 1, shiftId: "shift-mon" }],
          },
        ],
      })

      templateRepo.findById.mockResolvedValue(template)
      mockedNormalizeScheduleDate.mockReturnValueOnce(new Date("2024-01-01T00:00:00.000Z"))
      employeeRepo.findById.mockResolvedValue({
        id: "emp-1",
        workScheduleType: "FULL_TIME",
      } as never)
      mockedIsPartTimeWorkSchedule.mockReturnValue(false)
      scheduleRepo.assignSchedule.mockResolvedValue({ id: "schedule-1" } as never)

      // Act
      const result = await service.applyTemplate(data)

      // Assert
      expect(scheduleRepo.assignSchedule).toHaveBeenCalledTimes(1)
      expect(employeeShiftRepo.ensureShiftForEmployeeDate).not.toHaveBeenCalled()
      expect(result).toEqual([{ id: "schedule-1" }])
    })
  })
})
