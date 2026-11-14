/// <reference types="jest" />
import * as math from "mathjs"

import { PayrollService } from "../../services/payroll.service"

jest.mock("@/configs/entities/attendance.config.ts", () => ({
  ATTENDANCE_STATUS: {
    ON_TIME: "ON_TIME",
    LATE: "LATE",
    ABSENT: "ABSENT",
    OVERTIME: "OVERTIME",
  },
  EMPLOYEE_SHIFT_STATUS: {
    HOLIDAY_PENDING: "HOLIDAY_PENDING",
  },
  PAID_LEAVE_TYPES: ["annual", "sick"],
}))

jest.mock("@/configs/entities/employee.config.ts", () => ({
  EMPLOYEE_STATUS: {
    ACTIVE: "ACTIVE",
  },
  EMPLOYEE_TYPE: {
    PART_TIME: "PART_TIME",
    FULL_TIME: "FULL_TIME",
  },
  WORK_SCHEDULE_TYPE: {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
  },
}))

jest.mock("@/configs/entities/project.config.ts", () => ({
  SPENT_TIME_WORK_TIME_TYPE: {
    WORKING_DAY: "WORKING_DAY",
    OVERTIME: "OVERTIME",
  },
}))

jest.mock("@/configs/entities/payroll.config.ts", () => ({
  PAYROLL_STATUS: {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },
  SALARY_COMPONENT_TYPES: ["ADDITION", "DEDUCTION"],
  generateDefaultPayrollName: (m: number, y: number): string => `Payroll-${m}-${y}`,
}))

jest.mock("@/configs/rules/project.config.ts", () => ({
  SPENT_TIME_OT_MULTIPLIERS: {
    WORKING_DAY: 1.0,
    OVERTIME: 1.5,
  },
  SPENT_TIME_RULES: {
    ENFORCE_ESTIMATE_CAP: true,
    OVERTIME_MULTIPLIER: 1.5,
    MONTHLY_HOURS_DIVISOR: 176,
  },
}))

jest.mock("@/configs/messages/payroll.message", () => ({
  PAYROLL_MESSAGES: {
    ERRORS: {
      PAYROLL_ALREADY_EXISTS: "PAYROLL_ALREADY_EXISTS",
      PAYROLL_NOT_FOUND: "PAYROLL_NOT_FOUND",
      PAYSLIP_NOT_FOUND: "PAYSLIP_NOT_FOUND",
    },
  },
}))

jest.mock("@/configs/system/error-code.config.ts", () => ({
  ErrorLayer: {
    SERVICE: "SERVICE",
  },
}))

jest.mock("@/configs/system/http.config.ts", () => ({
  HttpStatusCode: {
    CONFLICT: 409,
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
  },
}))

jest.mock("@/utils/error.util.ts", () => ({
  AppError: class AppError extends Error {
    statusCode: number
    layer: string
    constructor(message: string, statusCode: number, layer: string) {
      super(message)
      this.statusCode = statusCode
      this.layer = layer
    }
  },
}))

jest.mock("@prisma/client", () => {
  class Decimal {
    val: number
    constructor(val: any) {
      this.val = Number(val)
    }
    add(x: any): Decimal {
      return new Decimal(this.val + x.val)
    }
    minus(x: any): Decimal {
      return new Decimal(this.val - x.val)
    }
    toFixed(n: number): string {
      return this.val.toFixed(n)
    }
  }
  return {
    PrismaClient: jest.fn(),
    Prisma: { Decimal },
    ApplicationType: { leave: "leave", late_early: "late_early" },
  }
})

jest.mock("mathjs", () => ({
  evaluate: jest.fn(),
}))

describe("PayrollService", () => {
  let service: PayrollService
  let mockPayrollRepo: any
  let mockPayslipRepo: any
  let mockSalaryConfigRepo: any
  let mockAttendanceRepo: any
  let mockEmployeeRepo: any
  let mockSpentTimeRepo: any
  let mockSettingsRepo: any
  let mockPrismaClient: any

  beforeEach(() => {
    mockPayrollRepo = {
      findByPeriod: jest.fn(),
      create: jest.fn(),
      updateTotalAmount: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
    }
    mockPayslipRepo = {
      createWithDetails: jest.fn(),
      findByPayroll: jest.fn(),
      findOne: jest.fn(),
      findByEmployee: jest.fn(),
    }
    mockSalaryConfigRepo = {
      findActiveByEmployee: jest.fn(),
    }
    mockAttendanceRepo = {
      queryRecords: jest.fn(),
    }
    mockEmployeeRepo = {
      listEmployeesPaginated: jest.fn(),
    }
    mockSpentTimeRepo = {
      listApprovedForPayroll: jest.fn(),
    }
    mockSettingsRepo = {
      findGlobal: jest.fn(),
    }
    mockSettingsRepo.findGlobal.mockResolvedValue({ triggerDay: 25 })
    mockPrismaClient = {
      salaryVariable: { findMany: jest.fn() },
      application: { findMany: jest.fn() },
    }

    service = new PayrollService(
      mockPayrollRepo,
      mockPayslipRepo,
      mockSalaryConfigRepo,
      mockAttendanceRepo,
      mockEmployeeRepo,
      mockSpentTimeRepo,
      mockSettingsRepo,
      mockPrismaClient,
    )
  })

  describe("generatePayroll", () => {
    it("UTCID01 - should generate payroll successfully for full time employee", async () => {
      // Arrange
      const month = 10
      const year = 2023
      mockPayrollRepo.findByPeriod.mockResolvedValue(null)
      mockSettingsRepo.findGlobal.mockResolvedValue({ triggerDay: 25 })
      mockEmployeeRepo.listEmployeesPaginated.mockResolvedValue({
        data: [{ id: "emp-1", employeeType: "FULL_TIME" }],
      })
      mockPayrollRepo.create.mockResolvedValue({
        id: "pay-1",
        periodMonth: month,
        periodYear: year,
      })
      mockPrismaClient.salaryVariable.findMany.mockResolvedValue([
        { code: "TAX_RATE", value: "0.1" },
      ])
      mockPrismaClient.application.findMany.mockResolvedValue([])
      mockSalaryConfigRepo.findActiveByEmployee.mockResolvedValue({
        id: "cfg-1",
        baseSalary: 1000,
        template: {
          components: [
            {
              component: { id: "c-1", name: "Base", type: "ADDITION", formula: "baseSalary" },
            },
          ],
        },
      })
      mockAttendanceRepo.queryRecords.mockResolvedValue([
        { status: "ON_TIME", overtimeMinutes: 0, lateMinutes: 0, earlyLeaveMinutes: 0 },
      ])
      ;(math.evaluate as any).mockReturnValue(1000)

      // Act
      const result = await service.generatePayroll(month, year)

      // Assert
      expect(result).toBeDefined()
      expect(mockPayrollRepo.create).toHaveBeenCalled()
      expect(mockPayslipRepo.createWithDetails).toHaveBeenCalled()
    })

    it("UTCID02 - should throw conflict error if payroll already exists", async () => {
      // Arrange
      mockPayrollRepo.findByPeriod.mockResolvedValue({ id: "existing-1" })

      // Act & Assert
      await expect(service.generatePayroll(10, 2023)).rejects.toThrow("PAYROLL_ALREADY_EXISTS")
    })

    it("UTCID03 - should throw error if formula evaluation fails", async () => {
      // Arrange
      mockPayrollRepo.findByPeriod.mockResolvedValue(null)
      mockSettingsRepo.findGlobal.mockResolvedValue({ triggerDay: 25 })
      mockEmployeeRepo.listEmployeesPaginated.mockResolvedValue({
        data: [{ id: "emp-1", employeeType: "FULL_TIME" }],
      })
      mockPayrollRepo.create.mockResolvedValue({ id: "pay-1" })
      mockPrismaClient.salaryVariable.findMany.mockResolvedValue([])
      mockPrismaClient.application.findMany.mockResolvedValue([])
      mockSalaryConfigRepo.findActiveByEmployee.mockResolvedValue({
        id: "cfg-1",
        baseSalary: 1000,
        template: {
          components: [
            {
              component: { id: "c-1", name: "Base", type: "ADDITION", formula: "invalidFormula" },
            },
          ],
        },
      })
      mockAttendanceRepo.queryRecords.mockResolvedValue([])
      ;(math.evaluate as any).mockImplementation(() => {
        throw new Error("Math error")
      })

      // Act & Assert
      await expect(service.generatePayroll(10, 2023)).rejects.toThrow("Math error")
    })
  })

  describe("getPayroll", () => {
    it("UTCID01 - should return payroll if found", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1" }
      mockPayrollRepo.findByPeriod.mockResolvedValue(mockPayroll)

      // Act
      const result = await service.getPayroll(10, 2023)

      // Assert
      expect(result).toEqual(mockPayroll)
    })

    it("UTCID02 - should throw not found error if payroll does not exist", async () => {
      // Arrange
      mockPayrollRepo.findByPeriod.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getPayroll(10, 2023)).rejects.toThrow("PAYROLL_NOT_FOUND")
    })

    it("UTCID03 - should throw repository error if database fails", async () => {
      // Arrange
      mockPayrollRepo.findByPeriod.mockRejectedValue(new Error("DB connection lost"))

      // Act & Assert
      await expect(service.getPayroll(10, 2023)).rejects.toThrow("DB connection lost")
    })
  })

  describe("getPayrollById", () => {
    it("UTCID01 - should return payroll with details", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1" }
      mockPayrollRepo.findById.mockResolvedValue(mockPayroll)
      mockPayslipRepo.findByPayroll.mockResolvedValue([{ id: "slip-1" }])

      // Act
      const result = await service.getPayrollById("pay-1")

      // Assert
      expect(result).toEqual({ ...mockPayroll, payslips: [{ id: "slip-1" }] })
    })

    it("UTCID02 - should throw not found error if payroll by ID does not exist", async () => {
      // Arrange
      mockPayrollRepo.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getPayrollById("pay-1")).rejects.toThrow("PAYROLL_NOT_FOUND")
    })

    it("UTCID03 - should throw repository error when query fails", async () => {
      // Arrange
      mockPayrollRepo.findById.mockRejectedValue(new Error("Query timeout"))

      // Act & Assert
      await expect(service.getPayrollById("pay-1")).rejects.toThrow("Query timeout")
    })
  })

  describe("listPayrolls", () => {
    it("UTCID01 - should return list of payrolls", async () => {
      // Arrange
      const list = [{ id: "pay-1" }, { id: "pay-2" }]
      mockPayrollRepo.findAll.mockResolvedValue(list)

      // Act
      const result = await service.listPayrolls({})

      // Assert
      expect(result).toEqual(list)
    })

    it("UTCID02 - should throw database error when retrieval fails", async () => {
      // Arrange
      mockPayrollRepo.findAll.mockRejectedValue(new Error("Connection failed"))

      // Act & Assert
      await expect(service.listPayrolls({})).rejects.toThrow("Connection failed")
    })

    it("UTCID03 - should process correct filters in repository call", async () => {
      // Arrange
      const filter = { status: "APPROVED" as any, year: 2023 }
      mockPayrollRepo.findAll.mockResolvedValue([])

      // Act
      await service.listPayrolls(filter)

      // Assert
      expect(mockPayrollRepo.findAll).toHaveBeenCalledWith(filter)
    })
  })

  describe("approvePayroll", () => {
    it("UTCID01 - should approve payroll successfully", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1", status: "APPROVED" }
      mockPayrollRepo.updateStatus.mockResolvedValue(mockPayroll)

      // Act
      const result = await service.approvePayroll("pay-1", "app-1")

      // Assert
      expect(result).toEqual(mockPayroll)
      expect(mockPayrollRepo.updateStatus).toHaveBeenCalledWith("pay-1", {
        status: "APPROVED",
        approvedById: "app-1",
        approvedAt: expect.any(Date),
      })
    })

    it("UTCID02 - should throw repository error when update fails", async () => {
      // Arrange
      mockPayrollRepo.updateStatus.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(service.approvePayroll("pay-1", "app-1")).rejects.toThrow("Update failed")
    })

    it("UTCID03 - should proceed even if approverId is null", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1", status: "APPROVED" }
      mockPayrollRepo.updateStatus.mockResolvedValue(mockPayroll)

      // Act
      const result = await service.approvePayroll("pay-1", null as any)

      // Assert
      expect(result).toEqual(mockPayroll)
    })
  })

  describe("rejectPayroll", () => {
    it("UTCID01 - should reject payroll successfully with reason", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1", status: "REJECTED", rejectReason: "Wrong computation" }
      mockPayrollRepo.updateStatus.mockResolvedValue(mockPayroll)

      // Act
      const result = await service.rejectPayroll("pay-1", "app-1", "Wrong computation")

      // Assert
      expect(result).toEqual(mockPayroll)
      expect(mockPayrollRepo.updateStatus).toHaveBeenCalledWith("pay-1", {
        status: "REJECTED",
        approvedById: "app-1",
        approvedAt: expect.any(Date),
        rejectReason: "Wrong computation",
      })
    })

    it("UTCID02 - should throw repository error when update fails", async () => {
      // Arrange
      mockPayrollRepo.updateStatus.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(service.rejectPayroll("pay-1", "app-1", "Wrong")).rejects.toThrow(
        "Update failed",
      )
    })

    it("UTCID03 - should accept empty reason string", async () => {
      // Arrange
      const mockPayroll = { id: "pay-1", status: "REJECTED", rejectReason: "" }
      mockPayrollRepo.updateStatus.mockResolvedValue(mockPayroll)

      // Act
      const result = await service.rejectPayroll("pay-1", "app-1", "")

      // Assert
      expect(result).toEqual(mockPayroll)
    })
  })

  describe("getPayslip", () => {
    it("UTCID01 - should return payslip if found", async () => {
      // Arrange
      const mockPayslip = { payrollId: "pay-1", employeeId: "emp-1" }
      mockPayslipRepo.findOne.mockResolvedValue(mockPayslip)

      // Act
      const result = await service.getPayslip("pay-1", "emp-1")

      // Assert
      expect(result).toEqual(mockPayslip)
    })

    it("UTCID02 - should throw not found error if payslip does not exist", async () => {
      // Arrange
      mockPayslipRepo.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(service.getPayslip("pay-1", "emp-1")).rejects.toThrow("PAYSLIP_NOT_FOUND")
    })

    it("UTCID03 - should throw repository error if database fails", async () => {
      // Arrange
      mockPayslipRepo.findOne.mockRejectedValue(new Error("Query error"))

      // Act & Assert
      await expect(service.getPayslip("pay-1", "emp-1")).rejects.toThrow("Query error")
    })
  })

  describe("getMyPayslips", () => {
    it("UTCID01 - should return mapped payslips", async () => {
      // Arrange
      const mockPayslips = [
        {
          id: "slip-1",
          payroll: { periodMonth: 10, periodYear: 2023, status: "APPROVED" },
        },
      ]
      mockPayslipRepo.findByEmployee.mockResolvedValue(mockPayslips)

      // Act
      const result = await service.getMyPayslips("emp-1")

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "slip-1",
          payroll: { periodMonth: 10, periodYear: 2023, status: "APPROVED" },
          periodMonth: 10,
          periodYear: 2023,
          status: "APPROVED",
          receiptStatus: "not_received",
          isPreview: false,
          canFeedback: true,
        }),
      )
      expect(result[0].dailyWorkLogs).toHaveLength(31)
    })

    it("UTCID02 - should return empty list if employee has no payslips", async () => {
      // Arrange
      mockPayslipRepo.findByEmployee.mockResolvedValue([])

      // Act
      const result = await service.getMyPayslips("emp-1")

      // Assert
      expect(result).toEqual([])
    })

    it("UTCID03 - should throw repository error if database fails", async () => {
      // Arrange
      mockPayslipRepo.findByEmployee.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(service.getMyPayslips("emp-1")).rejects.toThrow("Database error")
    })
  })
})
