import { prisma } from "@/libs/database.ts"
import { PrismaAttendanceRepository } from "@/repositories/attendance.repository.ts"
import { PrismaEmployeeSalaryConfigRepository } from "@/repositories/employee-salary-config.repository.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { PrismaPayrollRepository } from "@/repositories/payroll.repository.ts"
import { PrismaPayslipRepository } from "@/repositories/payslip.repository.ts"
import { PrismaSpentTimeRepository } from "@/repositories/spent-time.repository.ts"
import { PayrollService } from "@/services/payroll.service.ts"

import cron from "node-cron"

const payrollRepo = new PrismaPayrollRepository(prisma)
const payslipRepo = new PrismaPayslipRepository(prisma)
const configRepo = new PrismaEmployeeSalaryConfigRepository(prisma)
const attendanceRepo = new PrismaAttendanceRepository(prisma)
// Monthly cron includes PT employees via approved spent-time rows (see PayrollService).
const spentTimeRepo = new PrismaSpentTimeRepository(prisma)
const employeeRepo = new PrismaEmployeeRepository(prisma)
const DEFAULT_PAYROLL_SETTINGS = {
  triggerDay: 1,
  triggerHour: 0,
  triggerMinute: 0,
  approvalDay: 10,
  approvalHour: 0,
  approvalMinute: 0,
  standardWorkingDays: 22,
}
const settingsRepo = {
  findGlobal: async () => {
    const s = await prisma.payrollSettings.findUnique({ where: { id: "GLOBAL" } })
    // Keep automation bootable before the singleton settings row is seeded.
    return s || DEFAULT_PAYROLL_SETTINGS
  },
}

const payrollService = new PayrollService(
  payrollRepo,
  payslipRepo,
  configRepo,
  attendanceRepo,
  employeeRepo,
  spentTimeRepo,
  settingsRepo,
  prisma,
)

export const initCronJobs = () => {
  // Run every minute to check if current time matches payroll automation settings.
  cron.schedule("* * * * *", async () => {
    try {
      const settings = await settingsRepo.findGlobal()
      const today = new Date()
      const month = today.getMonth() + 1
      const year = today.getFullYear()
      const { generateDefaultPayrollName, PAYROLL_STATUS } =
        await import("@/configs/entities/payroll.config.ts")
      const name = generateDefaultPayrollName(month, year)

      if (
        today.getDate() === settings.triggerDay &&
        today.getHours() === settings.triggerHour &&
        today.getMinutes() === settings.triggerMinute
      ) {
        // The period/name guard makes the every-minute scheduler idempotent for a month.
        const existing = await payrollRepo.findByPeriod(month, year, name)
        if (!existing) {
          console.log(`[CRON] Generating Payroll for ${month}/${year}...`)
          await payrollService.generatePayroll(month, year)
          console.log(`[CRON] Payroll ${month}/${year} generated successfully.`)
        }
      }

      if (
        today.getDate() !== settings.approvalDay ||
        today.getHours() !== settings.approvalHour ||
        today.getMinutes() !== settings.approvalMinute
      ) {
        return
      }

      const payroll = await payrollRepo.findByPeriod(month, year, name)
      if (
        !payroll ||
        payroll.status === PAYROLL_STATUS.APPROVED ||
        payroll.status === PAYROLL_STATUS.PAID
      ) {
        return
      }
      // Rejected payrolls require human correction; cron must not silently approve them later.
      if (payroll.status === PAYROLL_STATUS.REJECTED) return

      console.log(`[CRON] Approving Payroll ${month}/${year}...`)
      await payrollRepo.updateStatus(payroll.id, {
        status: PAYROLL_STATUS.APPROVED,
        approvedById: "updatedById" in settings ? settings.updatedById : undefined,
        approvedAt: new Date(),
      })
      console.log(`[CRON] Payroll ${month}/${year} approved successfully.`)
    } catch (error) {
      console.error("[CRON] Error processing payroll automation:", error)
    }
  })

  console.log("[CRON] Payroll auto-create/approve job scheduled.")
}
