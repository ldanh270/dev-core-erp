import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PayrollController } from "@/controllers/payroll.controller.ts"
import { prisma } from "@/libs/database.ts"
import { authenticate } from "@/middlewares/auth.middleware.ts"
import { requireAnyPermission, requirePermission } from "@/middlewares/permission.middleware.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPayrollRepository } from "@/repositories/payroll.repository.ts"
import { PrismaPayslipRepository } from "@/repositories/payslip.repository.ts"
import { PrismaSpentTimeRepository } from "@/repositories/spent-time.repository.ts"
import { PayrollService } from "@/services/payroll.service.ts"
import { AppError } from "@/utils/error.util.ts"

import express from "express"

const payrollRoutes = express.Router()

const payrollRepo = new PrismaPayrollRepository(prisma)
const payslipRepo = new PrismaPayslipRepository(prisma)
const configRepo = new PrismaEmployeeSalaryConfigRepository(prisma)
const attendanceRepo = new PrismaAttendanceRepository(prisma)
// PT payroll lines come from approved Spent Time × project member hourlyRate, not attendance.
const spentTimeRepo = new PrismaSpentTimeRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const DEFAULT_PAYROLL_SETTINGS = {
  triggerDay: 1,
  triggerHour: 0,
  triggerMinute: 0,
  approvalDay: 10,
  approvalHour: 0,
  approvalMinute: 0,
}
const settingsRepo = {
  findGlobal: async () => {
    const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
    // Routes and cron share the same defaults until the GLOBAL settings row exists.
    return s || DEFAULT_PAYROLL_SETTINGS
  },
}

const service = new PayrollService(
  payrollRepo,
  payslipRepo,
  configRepo,
  attendanceRepo,
  employeeRepo,
  spentTimeRepo,
  settingsRepo,
  prisma,
)
const controller = new PayrollController(service)

payrollRoutes.use(authenticate)

// Self / Employee routes
payrollRoutes.get("/my/payslips", controller.getMyPayslips)
payrollRoutes.post("/my/payslips/:payslipId/feedback", controller.submitMyPayslipFeedback)

// HR / GM / Admin routes — require payroll.read as baseline
payrollRoutes.use(requirePermission("payroll.read"))

// Payroll Settings
payrollRoutes.get("/settings", requirePermission("payroll.update"), async (req, res, next) => {
  try {
    const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
    res.json({ data: s || DEFAULT_PAYROLL_SETTINGS })
  } catch (error) {
    next(error)
  }
})

payrollRoutes.put("/settings", requirePermission("payroll.update"), async (req, res, next) => {
  try {
    const { triggerDay, triggerHour, triggerMinute, approvalDay, approvalHour, approvalMinute } =
      req.body
    const updatedById = (req as any).user?.empId
    if (!updatedById)
      throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, ErrorLayer.UNKNOWN)

    const validateDay = (value: unknown, fieldName: string) => {
      if (value !== undefined && (Number(value) < 1 || Number(value) > 28)) {
        throw new AppError(
          `${fieldName} must be between 1 and 28`,
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.VALIDATION,
        )
      }
    }

    validateDay(triggerDay, "Trigger day")
    validateDay(approvalDay, "Approval day")

    const validateTime = (value: unknown, max: number, fieldName: string) => {
      if (value !== undefined && (Number(value) < 0 || Number(value) > max)) {
        throw new AppError(
          `${fieldName} is invalid`,
          HttpStatusCode.BAD_REQUEST,
          ErrorLayer.VALIDATION,
        )
      }
    }

    validateTime(triggerHour, 23, "Trigger hour")
    validateTime(approvalHour, 23, "Approval hour")
    validateTime(triggerMinute, 59, "Trigger minute")
    validateTime(approvalMinute, 59, "Approval minute")

    if (triggerDay === undefined || approvalDay === undefined) {
      throw new AppError(
        "Payroll creation and approval days are required",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.VALIDATION,
      )
    }

    // Approval must happen after preview/generation so employees still have a feedback window.
    if (Number(approvalDay) < Number(triggerDay)) {
      throw new AppError(
        "Approval day must be greater than or equal to payroll creation day",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.VALIDATION,
      )
    }

    const s = await prisma.payrollSettings.upsert({
      where: { id: "GLOBAL" },
      create: {
        id: "GLOBAL",
        triggerDay: Number(triggerDay),
        triggerHour: triggerHour !== undefined ? Number(triggerHour) : 0,
        triggerMinute: triggerMinute !== undefined ? Number(triggerMinute) : 0,
        approvalDay: Number(approvalDay),
        approvalHour: approvalHour !== undefined ? Number(approvalHour) : 0,
        approvalMinute: approvalMinute !== undefined ? Number(approvalMinute) : 0,
        updatedById,
      },
      update: {
        triggerDay: Number(triggerDay),
        triggerHour: triggerHour !== undefined ? Number(triggerHour) : undefined,
        triggerMinute: triggerMinute !== undefined ? Number(triggerMinute) : undefined,
        approvalDay: Number(approvalDay),
        approvalHour: approvalHour !== undefined ? Number(approvalHour) : undefined,
        approvalMinute: approvalMinute !== undefined ? Number(approvalMinute) : undefined,
        updatedById,
      },
    })
    res.json({ data: s })
  } catch (error) {
    next(error)
  }
})

payrollRoutes.get("/", controller.listPayrolls)
payrollRoutes.get("/:id", controller.getPayroll)
payrollRoutes.get("/:id/payslips/:empId", controller.getPayslip)
payrollRoutes.get(
  "/employee/:empId/payslips",
  requirePermission("payroll.read"),
  controller.getEmployeePayslips,
)

// Modifying routes for HR / Admin
payrollRoutes.post("/generate", requirePermission("payroll.create"), controller.generatePayroll)

// Modifying routes for GM / Admin
payrollRoutes.post("/:id/approve", requirePermission("payroll.approve"), controller.approvePayroll)
payrollRoutes.post("/:id/reject", requirePermission("payroll.approve"), controller.rejectPayroll)

export default payrollRoutes
