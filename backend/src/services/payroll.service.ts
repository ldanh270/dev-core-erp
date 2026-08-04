import {
  ATTENDANCE_STATUS,
  EMPLOYEE_SHIFT_STATUS,
  PAID_LEAVE_TYPES,
} from "@/configs/entities/attendance.config.ts"
import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import {
  PAYROLL_STATUS,
  SALARY_COMPONENT_TYPES,
  generateDefaultPayrollName,
} from "@/configs/entities/payroll.config.ts"
import { SPENT_TIME_WORK_TIME_TYPE } from "@/configs/entities/project.config.ts"
import { PAYROLL_MESSAGES } from "@/configs/messages/payroll.message"
import { ATTENDANCE_TIME_RULES } from "@/configs/rules/attendance.config.ts"
import { ErrorLayer } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { IAttendanceRecordDTO, IAttendanceRepository } from "@/types/attendance.types.ts"
import { IEmployeeRepository } from "@/types/employee.types.ts"
import {
  IEmployeeSalaryConfigRepository,
  IMyPayslipSummary,
  IPayrollRepository,
  IPayrollService,
  IPayslipDailyWorkLog,
  IPayslipFeedbackDTO,
  IPayslipRepository,
  PayrollWithPayslips,
  PayslipWithDetails,
} from "@/types/payroll.types.ts"
import { ISpentTimeRepository } from "@/types/spent-time.types.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"
import { AppError } from "@/utils/error.util.ts"
import {
  pickPartTimePayrollContext,
  resolvePartTimePayrollVariables,
} from "@/utils/payroll/resolve-part-time-payroll-variables.util.ts"

import {
  Application,
  ApplicationType,
  ComponentType,
  Payroll,
  PayrollStatus,
  Payslip,
  Prisma,
  PrismaClient,
} from "@prisma/client"
import * as math from "mathjs"

// Payroll settings are read through this narrow port by HTTP routes and cron wiring.
interface IPayrollSettingsRepository {
  findGlobal(): Promise<{ triggerDay: number }>
}

export class PayrollService implements IPayrollService {
  constructor(
    private payrollRepo: IPayrollRepository,
    private payslipRepo: IPayslipRepository,
    private salaryConfigRepo: IEmployeeSalaryConfigRepository,
    private attendanceRepo: IAttendanceRepository,
    private employeeRepo: IEmployeeRepository,
    private spentTimeRepo: ISpentTimeRepository,
    private settingsRepo: IPayrollSettingsRepository,
    private prisma: PrismaClient,
  ) {}

  /**
   * Initialize a new payroll for a specific month and year.
   * Uses transaction to ensure atomicity - all or nothing.
   *
   * @param month - The month parameter
   * @param year - The year parameter
   * @param name - The name parameter (optional)
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async generatePayroll(month: number, year: number, name?: string): Promise<Payroll> {
    const finalName = name || generateDefaultPayrollName(month, year)

    // Phase 1: All reads (outside transaction)
    const existing = await this.payrollRepo.findByPeriod(month, year, finalName)
    if (existing) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_ALREADY_EXISTS,
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    const employeeData = await this.employeeRepo.listEmployeesPaginated({
      status: EMPLOYEE_STATUS.ACTIVE,
      limit: 100000,
    })
    const employees = employeeData.data

    // Date range of the month
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0)

    // Fetch all active global salary variables
    const globalVariables = await this.prisma.salaryVariable.findMany({
      where: { isActive: true },
    })
    const variablesContext: Record<string, number> = Object.fromEntries(
      globalVariables.map((variable) => [variable.code, Number(variable.value)]),
    )

    // Fetch all approved applications for the period ONCE
    const allApprovedApps = await this.prisma.application.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        status: "approved",
        type: { in: [ApplicationType.leave, ApplicationType.late_early] },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: { leaveDetail: true, lateEarlyDetail: true },
    })

    // Group by employeeId in memory
    const appsByEmployeeId = new Map<string, typeof allApprovedApps>()
    allApprovedApps.forEach((app) => {
      const existingApps = appsByEmployeeId.get(app.employeeId) ?? []
      existingApps.push(app)
      appsByEmployeeId.set(app.employeeId, existingApps)
    })

    // Pre-fetch configs for all employees
    const configsByEmployeeId = new Map<
      string,
      Awaited<ReturnType<typeof this.salaryConfigRepo.findActiveByEmployee>>
    >()
    for (const employee of employees) {
      const config = await this.salaryConfigRepo.findActiveByEmployee(employee.id, periodStart)
      if (config) {
        configsByEmployeeId.set(employee.id, config)
      }
    }

    // Pre-fetch attendance for all employees
    const attendanceByEmployeeId = new Map<
      string,
      Awaited<ReturnType<typeof this.attendanceRepo.queryRecords>>
    >()
    for (const employee of employees) {
      const records = await this.attendanceRepo.queryRecords({
        employeeId: employee.id,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      })
      attendanceByEmployeeId.set(employee.id, records ?? [])
    }

    // Phase 2: All writes inside transaction
    // C1 FIX: Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // C2 FIX: Check again inside transaction to prevent race condition
      const existingInTx = await tx.payroll.findUnique({
        where: {
          periodYear_periodMonth_name: {
            periodMonth: month,
            periodYear: year,
            name: finalName,
          },
        },
      })

      if (existingInTx) {
        throw new AppError(
          PAYROLL_MESSAGES.ERRORS.PAYROLL_ALREADY_EXISTS,
          HttpStatusCode.CONFLICT,
          ErrorLayer.SERVICE,
        )
      }

      const payroll = await tx.payroll.create({
        data: {
          periodMonth: month,
          periodYear: year,
          name: finalName,
          status: PAYROLL_STATUS.DRAFT,
          totalAmount: 0,
        },
      })

      let totalAmount = new Prisma.Decimal(0)

      for (const employee of employees) {
        const config = configsByEmployeeId.get(employee.id)
        if (!config) {
          console.warn(`[PayrollService] No active config for employee ${employee.id}`)
          continue
        }

        // PT payroll branch
        if (isPartTimeWorkSchedule(employee)) {
          const ptResult = await this.buildPartTimePayslipWithTx(
            tx,
            payroll.id,
            employee.id,
            config.id,
            periodStart,
            periodEnd,
            variablesContext,
          )
          if (ptResult) {
            totalAmount = totalAmount.add(ptResult.netSalary)
          }
          continue
        }

        // Use pre-fetched attendance
        const attendanceRecords = attendanceByEmployeeId.get(employee.id) ?? []

        // Calculate summary
        const attendance = {
          workingDays: 0,
          absentDays: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          totalWorkMinutes: 0,
          holidayDays: 0,
        }
        attendanceRecords.forEach((record) => {
          if (
            record.status === ATTENDANCE_STATUS.ON_TIME ||
            record.status === ATTENDANCE_STATUS.LATE
          )
            attendance.workingDays += 1
          if (record.status === ATTENDANCE_STATUS.ABSENT) {
            if (record.realShift?.isPaidLeave) {
              attendance.workingDays += 1
            } else {
              attendance.absentDays += 1
            }
          }
          if (record.status === ATTENDANCE_STATUS.OVERTIME) attendance.workingDays += 1
          if (record.status === (EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as string))
            attendance.holidayDays += 1

          attendance.overtimeMinutes += record.overtimeMinutes || 0
          attendance.lateMinutes += record.lateMinutes || 0
          attendance.earlyLeaveMinutes += record.earlyLeaveMinutes || 0
          attendance.totalWorkMinutes += this.resolveRecordWorkMinutes(record)
        })

        // Use pre-fetched applications
        const approvedApps = appsByEmployeeId.get(employee.id) ?? []

        let excusedLateMinutes = 0
        let excusedEarlyMinutes = 0

        for (const app of approvedApps) {
          if (app.type === "late_early" && app.lateEarlyDetail) {
            if (app.lateEarlyDetail.isLate) {
              excusedLateMinutes += app.lateEarlyDetail.durationMinutes
            } else {
              excusedEarlyMinutes += app.lateEarlyDetail.durationMinutes
            }
          }
        }

        attendance.lateMinutes = Math.max(0, attendance.lateMinutes - excusedLateMinutes)
        attendance.earlyLeaveMinutes = Math.max(
          0,
          attendance.earlyLeaveMinutes - excusedEarlyMinutes,
        )

        // Build context
        const context: Record<string, unknown> = {
          baseSalary: Number(config.baseSalary),
          workingDays: 22,
          actualWorkingDays: attendance.workingDays,
          absentDays: attendance.absentDays,
          overtimeMinutes: attendance.overtimeMinutes,
          lateMinutes: attendance.lateMinutes,
          earlyLeaveMinutes: attendance.earlyLeaveMinutes,
          holidayDays: attendance.holidayDays,
          totalWorkMinutes: attendance.totalWorkMinutes,
          totalWorkHours: attendance.totalWorkMinutes / ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR,
          MAX: Math.max,
          MIN: Math.min,
          ...variablesContext,
        }

        const details = []
        let totalAdditions = new Prisma.Decimal(0)
        let totalDeductions = new Prisma.Decimal(0)

        const components = config.template.components
        for (const tc of components) {
          context.totalAdditions = Number(totalAdditions)
          context.totalDeductions = Number(totalDeductions)

          const formula = tc.overrideFormula ?? tc.component.formula
          let rawValue = 0
          try {
            rawValue = math.evaluate(formula, context)
          } catch (err) {
            console.error("Error evaluating formula:", formula, "Context:", context)
            throw err
          }
          const value = new Prisma.Decimal(Math.max(0, rawValue))

          details.push({
            componentId: tc.component.id,
            name: tc.component.name,
            type: tc.component.type,
            value: Number(value.toFixed(2)),
          })

          if (tc.component.type === SALARY_COMPONENT_TYPES[0]) {
            totalAdditions = totalAdditions.add(value)
          } else {
            totalDeductions = totalDeductions.add(value)
          }
        }

        const netSalary = totalAdditions.minus(totalDeductions)
        totalAmount = totalAmount.add(netSalary)

        // C1 FIX: Create payslip inside transaction
        await tx.payslip.create({
          data: {
            payrollId: payroll.id,
            employeeId: employee.id,
            salaryConfigId: config.id,
            totalAdditions: Number(totalAdditions.toFixed(2)),
            totalDeductions: Number(totalDeductions.toFixed(2)),
            netSalary: Number(netSalary.toFixed(2)),
            workingDays: attendance.workingDays,
            absentDays: attendance.absentDays,
            overtimeMinutes: attendance.overtimeMinutes,
            details: {
              create: details.map((d) => ({
                componentId: d.componentId,
                name: d.name,
                type: d.type,
                value: d.value,
              })),
            },
          },
        })
      }

      // Update total amount inside transaction
      await tx.payroll.update({
        where: { id: payroll.id },
        data: { totalAmount },
      })

      return { ...payroll, totalAmount }
    })
  }

  /** Builds payslip from approved SpentTime rows; skips employees with no approved hours in period. */
  private async buildPartTimePayslip(
    payrollId: string,
    employeeId: string,
    salaryConfigId: string,
    periodStart: Date,
    periodEnd: Date,
    variablesContext: Record<string, number>,
  ): Promise<{ netSalary: Prisma.Decimal } | null> {
    const ptVariables = resolvePartTimePayrollVariables(
      pickPartTimePayrollContext(variablesContext),
    )
    const rows = await this.spentTimeRepo.listApprovedForPayroll(employeeId, periodStart, periodEnd)
    if (rows.length === 0) {
      console.warn(`[PayrollService] No approved spent time for PT employee ${employeeId}`)
      return null
    }

    let totalHours = 0
    let grossPay = 0
    const details: { componentId: string; name: string; type: ComponentType; value: number }[] = []

    for (const row of rows) {
      // Overtime vs regular Spent Time lines use different SalaryVariable multipliers.
      const multiplier =
        row.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME
          ? ptVariables.overtimeMultiplier
          : ptVariables.workingDayMultiplier
      const hourlyRate = row.hourlyRate ?? ptVariables.defaultHourlyRate
      if (!hourlyRate || hourlyRate <= 0) {
        console.warn(
          `[PayrollService] Skip PT line ${row.id}: missing hourlyRate and no partTimeDefaultHourlyRate`,
        )
        continue
      }
      // gross = hours × rate (project or default variable) × multiplier from SalaryVariable
      const linePay = row.hours * hourlyRate * multiplier
      totalHours += row.hours
      grossPay += linePay
      details.push({
        // PT has no salary-component mapping — each approved Spent Time row becomes one payslip line.
        componentId: row.id,
        name: `Dự án ${row.projectId}`,
        type: SALARY_COMPONENT_TYPES[0] as ComponentType,
        value: Number(linePay.toFixed(2)),
      })
    }

    if (totalHours === 0) {
      console.warn(`[PayrollService] No billable PT hours for employee ${employeeId}`)
      return null
    }

    const netSalary = new Prisma.Decimal(Number(grossPay.toFixed(2)))

    await this.payslipRepo.createWithDetails({
      payrollId,
      employeeId,
      salaryConfigId,
      totalAdditions: Number(grossPay.toFixed(2)),
      totalDeductions: 0,
      netSalary: Number(grossPay.toFixed(2)),
      // PT pay is hour-based from Spent Time — attendance working-day fields stay zero.
      workingDays: 0,
      absentDays: 0,
      overtimeMinutes: Math.round(
        rows
          .filter((r) => r.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME)
          .reduce((sum, r) => sum + r.hours * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR, 0),
      ),
      details,
    })

    return { netSalary }
  }

  /** Builds payslip from approved SpentTime rows inside transaction */
  private async buildPartTimePayslipWithTx(
    tx: Prisma.TransactionClient,
    payrollId: string,
    employeeId: string,
    salaryConfigId: string,
    periodStart: Date,
    periodEnd: Date,
    variablesContext: Record<string, number>,
  ): Promise<{ netSalary: Prisma.Decimal } | null> {
    const ptVariables = resolvePartTimePayrollVariables(
      pickPartTimePayrollContext(variablesContext),
    )
    const rows = await this.spentTimeRepo.listApprovedForPayroll(employeeId, periodStart, periodEnd)
    if (rows.length === 0) {
      console.warn(`[PayrollService] No approved spent time for PT employee ${employeeId}`)
      return null
    }

    let totalHours = 0
    let grossPay = 0
    const details: { componentId: string; name: string; type: ComponentType; value: number }[] = []

    for (const row of rows) {
      const multiplier =
        row.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME
          ? ptVariables.overtimeMultiplier
          : ptVariables.workingDayMultiplier
      const hourlyRate = row.hourlyRate ?? ptVariables.defaultHourlyRate
      if (!hourlyRate || hourlyRate <= 0) {
        console.warn(
          `[PayrollService] Skip PT line ${row.id}: missing hourlyRate and no partTimeDefaultHourlyRate`,
        )
        continue
      }
      const linePay = row.hours * hourlyRate * multiplier
      totalHours += row.hours
      grossPay += linePay
      details.push({
        componentId: row.id,
        name: `Dự án ${row.projectId}`,
        type: SALARY_COMPONENT_TYPES[0] as ComponentType,
        value: Number(linePay.toFixed(2)),
      })
    }

    if (totalHours === 0) {
      console.warn(`[PayrollService] No billable PT hours for employee ${employeeId}`)
      return null
    }

    const netSalary = new Prisma.Decimal(Number(grossPay.toFixed(2)))

    await tx.payslip.create({
      data: {
        payrollId,
        employeeId,
        salaryConfigId,
        totalAdditions: Number(grossPay.toFixed(2)),
        totalDeductions: 0,
        netSalary: Number(grossPay.toFixed(2)),
        workingDays: 0,
        absentDays: 0,
        overtimeMinutes: Math.round(
          rows
            .filter((r) => r.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME)
            .reduce((sum, r) => sum + r.hours * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR, 0),
        ),
        details: {
          create: details.map((d) => ({
            componentId: d.componentId,
            name: d.name,
            type: d.type,
            value: d.value,
          })),
        },
      },
    })

    return { netSalary }
  }

  /**
   * Process business logic for getPayroll.
   *
   * @param month - The month parameter
   * @param year - The year parameter
   * @param name - The name parameter (optional)
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayroll(month: number, year: number, name?: string): Promise<Payroll> {
    const finalName = name || generateDefaultPayrollName(month, year)
    const payroll = await this.payrollRepo.findByPeriod(month, year, finalName)
    if (!payroll)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return payroll
  }

  /**
   * Process business logic for getPayrollById.
   *
   * @param id - The id parameter
   * @returns Returns the result of type Promise<any>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayrollById(id: string): Promise<PayrollWithPayslips> {
    const payroll = await this.payrollRepo.findById(id)
    if (!payroll)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )

    const payslips = await this.payslipRepo.findByPayroll(id)

    return {
      ...payroll,
      payslips,
    }
  }

  /**
   * Process business logic for listPayrolls.
   *
   * @param filter - The filter parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }[]>
   */
  async listPayrolls(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]> {
    return this.payrollRepo.findAll(filter)
  }

  /**
   * Approve a payroll, changing its status to approved.
   * C3 FIX: Validates status before approval to prevent invalid state transitions.
   *
   * @param payrollId - The payrollId parameter
   * @param approverId - The approverId parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if payroll not found or invalid status transition
   */
  async approvePayroll(payrollId: string, approverId: string): Promise<Payroll> {
    // C3 FIX: Fetch payroll first to validate status
    const payroll = await this.payrollRepo.findById(payrollId)
    if (!payroll) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    // Validate status transitions
    if (payroll.status === PAYROLL_STATUS.APPROVED) {
      throw new AppError(
        "Bảng lương đã được phê duyệt trước đó",
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    if (payroll.status === PAYROLL_STATUS.PAID) {
      throw new AppError(
        "Không thể phê duyệt bảng lương đã thanh toán",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    if (payroll.status === PAYROLL_STATUS.REJECTED) {
      throw new AppError(
        "Không thể phê duyệt bảng lương đã bị từ chối",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Optional: Require PENDING_APPROVAL status (uncomment if workflow requires it)
    // if (payroll.status !== PAYROLL_STATUS.PENDING_APPROVAL) {
    //   throw new AppError(
    //     "Bảng lương cần được gửi phê duyệt trước",
    //     HttpStatusCode.BAD_REQUEST,
    //     ErrorLayer.SERVICE,
    //   )
    // }

    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.APPROVED,
      approvedById: approverId,
      approvedAt: new Date(),
    })
  }

  /**
   * Reject a payroll and record the rejection reason.
   * C4 FIX: Validates status before rejection to prevent invalid state transitions.
   *
   * @param payrollId - The payrollId parameter
   * @param approverId - The approverId parameter
   * @param reason - The reason parameter
   * @returns Returns the result of type Promise<{ name: string; id: string; periodMonth: number; periodYear: number; status: $Enums.PayrollStatus; totalAmount: Decimal; approvedById: string | null; approvedAt: Date | null; rejectReason: string | null; createdAt: Date; updatedAt: Date; }>
   * @throws AppError if payroll not found or invalid status transition
   */
  async rejectPayroll(payrollId: string, approverId: string, reason: string): Promise<Payroll> {
    // C4 FIX: Fetch payroll first to validate status
    const payroll = await this.payrollRepo.findById(payrollId)
    if (!payroll) {
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYROLL_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    }

    // Validate status transitions
    if (payroll.status === PAYROLL_STATUS.APPROVED) {
      throw new AppError(
        "Không thể từ chối bảng lương đã được phê duyệt",
        HttpStatusCode.CONFLICT,
        ErrorLayer.SERVICE,
      )
    }

    if (payroll.status === PAYROLL_STATUS.PAID) {
      throw new AppError(
        "Không thể từ chối bảng lương đã thanh toán",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    // Only DRAFT or PENDING_APPROVAL can be rejected
    if (
      payroll.status !== PAYROLL_STATUS.DRAFT &&
      payroll.status !== PAYROLL_STATUS.PENDING_APPROVAL
    ) {
      throw new AppError(
        "Chỉ có thể từ chối bảng lương ở trạng thái nháp hoặc chờ phê duyệt",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.SERVICE,
      )
    }

    return this.payrollRepo.updateStatus(payrollId, {
      status: PAYROLL_STATUS.REJECTED,
      approvedById: approverId,
      approvedAt: new Date(),
      rejectReason: reason,
    })
  }

  /**
   * Handle the request to retrieve detailed payslip information for an employee.
   *
   * @param payrollId - The payrollId parameter
   * @param employeeId - The employeeId parameter
   * @returns Returns the result of type Promise<PayslipWithDetails>
   * @throws AppError if a business logic error occurs or data is not found
   */
  async getPayslip(payrollId: string, employeeId: string): Promise<PayslipWithDetails> {
    const payslip = await this.payslipRepo.findOne(payrollId, employeeId)
    if (!payslip)
      throw new AppError(
        PAYROLL_MESSAGES.ERRORS.PAYSLIP_NOT_FOUND,
        HttpStatusCode.NOT_FOUND,
        ErrorLayer.SERVICE,
      )
    return payslip
  }

  /**
   * Process business logic for getMyPayslips.
   *
   * @param employeeId - The employeeId parameter
   * @returns Returns the result of type Promise<any[]>
   */
  async getMyPayslips(employeeId: string): Promise<IMyPayslipSummary[]> {
    type PayslipWithPayrollRelation = Payslip & {
      payroll?: Pick<Payroll, "periodMonth" | "periodYear" | "status"> | null
    }

    const rawPayslips = (await this.payslipRepo.findByEmployee(
      employeeId,
    )) as PayslipWithPayrollRelation[]

    const summaries = await Promise.all(
      rawPayslips.map(async (payslip) => ({
        ...payslip,
        periodMonth: payslip.payroll?.periodMonth,
        periodYear: payslip.payroll?.periodYear,
        status: payslip.payroll?.status,
        receiptStatus: this.resolveReceiptStatus(payslip.payroll?.status),
        isPreview: false,
        canFeedback: payslip.payroll?.status !== PAYROLL_STATUS.PAID,
        dailyWorkLogs:
          payslip.payroll?.periodMonth && payslip.payroll?.periodYear
            ? await this.buildDailyWorkLogs(
                employeeId,
                payslip.payroll.periodMonth,
                payslip.payroll.periodYear,
              )
            : [],
      })),
    )

    // Surface an in-memory current-month preview before payroll generation so employees can flag attendance issues early.
    const preview = await this.buildCurrentPreviewPayslip(employeeId, summaries)
    return preview ? [preview, ...summaries] : summaries
  }

  async submitMyPayslipFeedback(employeeId: string, data: IPayslipFeedbackDTO): Promise<unknown> {
    const reason = data.reason.trim()
    if (!reason) {
      throw new AppError(
        "Vui lòng nhập nội dung feedback",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.VALIDATION,
      )
    }

    const targetDate = new Date(data.date)
    if (Number.isNaN(targetDate.getTime())) {
      throw new AppError(
        "Ngày feedback không hợp lệ",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.VALIDATION,
      )
    }

    const day = new Date(targetDate)
    day.setHours(0, 0, 0, 0)
    const employeeShift = await this.prisma.employeeShift.findFirst({
      where: { employeeId, assignedDate: day },
      include: { shift: true },
      orderBy: { createdAt: "desc" },
    })

    if (!employeeShift) {
      throw new AppError(
        "Không tìm thấy ca làm cho ngày đã chọn",
        HttpStatusCode.BAD_REQUEST,
        ErrorLayer.VALIDATION,
      )
    }

    const checkInAt = data.checkInAt
      ? this.combineDateAndTime(day, data.checkInAt, employeeShift.shift, "checkin")
      : null
    const checkOutAt = data.checkOutAt
      ? this.combineDateAndTime(day, data.checkOutAt, employeeShift.shift, "checkout")
      : null

    // Payroll feedback reuses the forgot-card workflow so HR validates one attendance correction pipeline.
    return this.prisma.application.create({
      data: {
        employeeId,
        type: ApplicationType.forgot_card,
        startDate: day,
        endDate: day,
        reason,
        note: `Payroll feedback for ${data.payslipId}`,
        forgotCardDetail: {
          create: {
            employeeShiftId: employeeShift.id,
            checkInAt,
            checkOutAt,
          },
        },
      },
      include: { forgotCardDetail: true },
    })
  }

  private resolveReceiptStatus(status?: PayrollStatus | null): "not_received" | "received" {
    return status === PAYROLL_STATUS.PAID ? "received" : "not_received"
  }

  private async buildCurrentPreviewPayslip(
    employeeId: string,
    existingPayslips: IMyPayslipSummary[],
  ): Promise<IMyPayslipSummary | null> {
    const settings = await this.settingsRepo.findGlobal()
    const today = new Date()
    const triggerDay = Number(settings.triggerDay)
    const previewStartDay = Math.max(1, triggerDay - 5)
    if (today.getDate() < previewStartDay) return null

    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const alreadyHasPeriod = existingPayslips.some(
      (payslip) => payslip.periodMonth === month && payslip.periodYear === year,
    )
    if (alreadyHasPeriod) return null

    const snapshot = await this.buildEmployeePayslipSnapshot(employeeId, month, year)
    if (!snapshot) return null

    const now = new Date()
    // Synthetic IDs keep preview rows distinguishable from persisted payslips on the client.
    return {
      id: `preview-${year}-${String(month).padStart(2, "0")}-${employeeId}`,
      payrollId: `preview-${year}-${String(month).padStart(2, "0")}`,
      employeeId,
      salaryConfigId: snapshot.salaryConfigId,
      totalAdditions: snapshot.totalAdditions,
      totalDeductions: snapshot.totalDeductions,
      netSalary: snapshot.netSalary,
      workingDays: snapshot.workingDays,
      absentDays: snapshot.absentDays,
      overtimeMinutes: snapshot.overtimeMinutes,
      details: snapshot.details,
      periodMonth: month,
      periodYear: year,
      status: PAYROLL_STATUS.PENDING_APPROVAL,
      receiptStatus: "not_received",
      isPreview: true,
      canFeedback: true,
      dailyWorkLogs: snapshot.dailyWorkLogs,
      createdAt: now,
      updatedAt: now,
    } as unknown as IMyPayslipSummary
  }

  private async buildEmployeePayslipSnapshot(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<{
    salaryConfigId: string
    totalAdditions: number
    totalDeductions: number
    netSalary: number
    workingDays: number
    absentDays: number
    overtimeMinutes: number
    details: Array<{ componentId: string; name: string; type: ComponentType; value: number }>
    dailyWorkLogs: IPayslipDailyWorkLog[]
  } | null> {
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0)
    const config = await this.salaryConfigRepo.findActiveByEmployee(employeeId, periodStart)
    if (!config) return null

    const globalVariables = await this.prisma.salaryVariable.findMany({ where: { isActive: true } })
    const variablesContext: Record<string, number> = Object.fromEntries(
      globalVariables.map((variable) => [variable.code, Number(variable.value)]),
    )

    const employee = await this.employeeRepo.findById(employeeId)
    if (employee && isPartTimeWorkSchedule(employee)) {
      return this.buildPartTimePayslipSnapshot(
        employeeId,
        config.id,
        periodStart,
        periodEnd,
        variablesContext,
        month,
        year,
      )
    }

    const attendanceRecords =
      (await this.attendanceRepo.queryRecords({
        employeeId,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      })) ?? []
    const attendance = this.summarizeAttendance(attendanceRecords)
    const details: Array<{
      componentId: string
      name: string
      type: ComponentType
      value: number
    }> = []
    const context: Record<string, unknown> = {
      baseSalary: Number(config.baseSalary),
      workingDays: 22,
      actualWorkingDays: attendance.workingDays,
      absentDays: attendance.absentDays,
      overtimeMinutes: attendance.overtimeMinutes,
      lateMinutes: attendance.lateMinutes,
      earlyLeaveMinutes: attendance.earlyLeaveMinutes,
      holidayDays: attendance.holidayDays,
      totalWorkMinutes: attendance.totalWorkMinutes,
      totalWorkHours: attendance.totalWorkMinutes / ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR,
      MAX: Math.max,
      MIN: Math.min,
      ...variablesContext,
    }
    let totalAdditions = new Prisma.Decimal(0)
    let totalDeductions = new Prisma.Decimal(0)

    for (const tc of config.template.components) {
      context.totalAdditions = Number(totalAdditions)
      context.totalDeductions = Number(totalDeductions)
      const value = new Prisma.Decimal(
        Math.max(0, math.evaluate(tc.overrideFormula ?? tc.component.formula, context)),
      )
      details.push({
        componentId: tc.component.id,
        name: tc.component.name,
        type: tc.component.type,
        value: Number(value.toFixed(2)),
      })
      if (tc.component.type === SALARY_COMPONENT_TYPES[0])
        totalAdditions = totalAdditions.add(value)
      else totalDeductions = totalDeductions.add(value)
    }

    const netSalary = totalAdditions.minus(totalDeductions)
    return {
      salaryConfigId: config.id,
      totalAdditions: Number(totalAdditions.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      workingDays: attendance.workingDays,
      absentDays: attendance.absentDays,
      overtimeMinutes: attendance.overtimeMinutes,
      details,
      dailyWorkLogs: this.mapDailyWorkLogs(month, year, attendanceRecords),
    }
  }

  private async buildPartTimePayslipSnapshot(
    employeeId: string,
    salaryConfigId: string,
    periodStart: Date,
    periodEnd: Date,
    variablesContext: Record<string, number>,
    month: number,
    year: number,
  ): Promise<{
    salaryConfigId: string
    totalAdditions: number
    totalDeductions: number
    netSalary: number
    workingDays: number
    absentDays: number
    overtimeMinutes: number
    details: Array<{ componentId: string; name: string; type: ComponentType; value: number }>
    dailyWorkLogs: IPayslipDailyWorkLog[]
  } | null> {
    const ptVariables = resolvePartTimePayrollVariables(
      pickPartTimePayrollContext(variablesContext),
    )
    const rows = await this.spentTimeRepo.listApprovedForPayroll(employeeId, periodStart, periodEnd)
    if (rows.length === 0) return null

    let totalHours = 0
    let grossPay = 0
    const details: Array<{
      componentId: string
      name: string
      type: ComponentType
      value: number
    }> = []

    for (const row of rows) {
      const multiplier =
        row.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME
          ? ptVariables.overtimeMultiplier
          : ptVariables.workingDayMultiplier
      const hourlyRate = row.hourlyRate ?? ptVariables.defaultHourlyRate
      if (!hourlyRate || hourlyRate <= 0) continue

      const linePay = row.hours * hourlyRate * multiplier
      totalHours += row.hours
      grossPay += linePay
      details.push({
        componentId: row.id,
        name: `Dự án ${row.projectId}`,
        type: SALARY_COMPONENT_TYPES[0] as ComponentType,
        value: Number(linePay.toFixed(2)),
      })
    }

    if (totalHours === 0) return null

    const attendanceRecords =
      (await this.attendanceRepo.queryRecords({
        employeeId,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      })) ?? []
    const overtimeMinutes = Math.round(
      rows
        .filter((row) => row.workTimeType === SPENT_TIME_WORK_TIME_TYPE.OVERTIME)
        .reduce((sum, row) => sum + row.hours * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR, 0),
    )
    const amount = Number(grossPay.toFixed(2))

    return {
      salaryConfigId,
      totalAdditions: amount,
      totalDeductions: 0,
      netSalary: amount,
      workingDays: 0,
      absentDays: 0,
      overtimeMinutes,
      details,
      dailyWorkLogs: this.mapDailyWorkLogs(month, year, attendanceRecords),
    }
  }

  private summarizeAttendance(records: IAttendanceRecordDTO[]) {
    const attendance = {
      workingDays: 0,
      absentDays: 0,
      overtimeMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      totalWorkMinutes: 0,
      holidayDays: 0,
    }
    records.forEach((record) => {
      if (record.status === ATTENDANCE_STATUS.ON_TIME || record.status === ATTENDANCE_STATUS.LATE)
        attendance.workingDays += 1
      if (record.status === ATTENDANCE_STATUS.ABSENT) {
        if (record.realShift?.isPaidLeave) attendance.workingDays += 1
        else attendance.absentDays += 1
      }
      if (record.status === ATTENDANCE_STATUS.OVERTIME) attendance.workingDays += 1
      if (record.status === (EMPLOYEE_SHIFT_STATUS.HOLIDAY_PENDING as string))
        attendance.holidayDays += 1
      attendance.overtimeMinutes += record.overtimeMinutes || 0
      attendance.lateMinutes += record.lateMinutes || 0
      attendance.earlyLeaveMinutes += record.earlyLeaveMinutes || 0
      attendance.totalWorkMinutes += this.resolveRecordWorkMinutes(record)
    })
    return attendance
  }

  private async buildDailyWorkLogs(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<IPayslipDailyWorkLog[]> {
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0)
    const records =
      (await this.attendanceRepo.queryRecords({
        employeeId,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      })) ?? []
    return this.mapDailyWorkLogs(month, year, records)
  }

  private mapDailyWorkLogs(
    month: number,
    year: number,
    records: IAttendanceRecordDTO[],
  ): IPayslipDailyWorkLog[] {
    // Multiple records can exist for a day, so the payslip view collapses them into one daily row.
    const byDate = new Map<string, IAttendanceRecordDTO[]>()
    records.forEach((record) => {
      const key = this.formatDateKey(new Date(record.date))
      const bucket = byDate.get(key) ?? []
      bucket.push(record)
      byDate.set(key, bucket)
    })

    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayOfMonth = index + 1
      const date = new Date(year, month - 1, dayOfMonth)
      const key = this.formatDateKey(date)
      const dayRecords = byDate.get(key) ?? []
      const firstRecord = dayRecords[0]
      const workMinutes = dayRecords.reduce(
        (total, record) => total + this.resolveRecordWorkMinutes(record),
        0,
      )
      return {
        date: key,
        dayOfMonth,
        employeeShiftId: firstRecord?.employeeShiftId ?? null,
        shiftName: this.resolveDailyShiftName(dayRecords),
        status: this.resolveDailyStatus(dayRecords),
        workMinutes,
        workHours: Number((workMinutes / ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR).toFixed(2)),
        overtimeMinutes: dayRecords.reduce(
          (total, record) => total + (record.overtimeMinutes ?? 0),
          0,
        ),
        lateMinutes: dayRecords.reduce((total, record) => total + (record.lateMinutes ?? 0), 0),
        earlyLeaveMinutes: dayRecords.reduce(
          (total, record) => total + (record.earlyLeaveMinutes ?? 0),
          0,
        ),
        checkInAt: this.resolveEarliestDate(dayRecords.map((record) => record.checkInAt)),
        checkOutAt: this.resolveLatestDate(dayRecords.map((record) => record.checkOutAt)),
        note: this.resolveDailyNote(dayRecords),
      }
    })
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  private resolveRecordWorkMinutes(record: IAttendanceRecordDTO): number {
    const storedMinutes = Number(record.totalWorkMinutes ?? 0)
    if (storedMinutes >= 0) return storedMinutes
    if (!record.checkInAt || !record.checkOutAt) return 0

    const checkInAt = new Date(record.checkInAt)
    const checkOutAt = new Date(record.checkOutAt)
    const elapsedMinutes = Math.round(
      (checkOutAt.getTime() - checkInAt.getTime()) / ATTENDANCE_TIME_RULES.MILLISECONDS_PER_MINUTE,
    )
    return Math.max(0, elapsedMinutes)
  }

  private resolveDailyStatus(records: IAttendanceRecordDTO[]): string {
    if (records.length === 0) return "no_record"
    const priorities = [
      ATTENDANCE_STATUS.ABSENT,
      ATTENDANCE_STATUS.LATE,
      ATTENDANCE_STATUS.EARLY_LEAVE,
      ATTENDANCE_STATUS.OVERTIME,
      ATTENDANCE_STATUS.ON_TIME,
    ]
    return (
      priorities.find((status) => records.some((record) => record.status === status)) ??
      records[0].status
    )
  }

  private resolveDailyShiftName(records: IAttendanceRecordDTO[]): string | null {
    const names = Array.from(
      new Set(records.map((record) => record.employeeShift?.shift?.name).filter(Boolean)),
    )
    return names.length > 0 ? names.join(", ") : null
  }

  private resolveDailyNote(records: IAttendanceRecordDTO[]): string | null {
    const notes = records.map((record) => record.note).filter(Boolean)
    return notes.length > 0 ? notes.join("; ") : null
  }

  private resolveEarliestDate(values: Array<string | Date | null | undefined>): string | null {
    const dates = values
      .filter(Boolean)
      .map((value) => new Date(value as string | Date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    return dates[0]?.toISOString() ?? null
  }

  private resolveLatestDate(values: Array<string | Date | null | undefined>): string | null {
    const dates = values
      .filter(Boolean)
      .map((value) => new Date(value as string | Date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())
    return dates[0]?.toISOString() ?? null
  }

  private combineDateAndTime(
    date: Date,
    time: string,
    shift?: { startTime: number; endTime: number } | null,
    kind: "checkin" | "checkout" = "checkin",
  ): Date {
    const [hours, minutes] = time.split(":").map(Number)
    const result = new Date(date)
    result.setHours(
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
      0,
      0,
    )
    const minutesFromMidnight =
      (Number.isFinite(hours) ? hours : 0) * ATTENDANCE_TIME_RULES.MINUTES_PER_HOUR +
      (Number.isFinite(minutes) ? minutes : 0)
    if (
      kind === "checkout" &&
      shift &&
      shift.endTime < shift.startTime &&
      minutesFromMidnight <= shift.endTime
    ) {
      // Overnight shifts store checkout after midnight on the following calendar day.
      result.setDate(result.getDate() + 1)
    }
    return result
  }
}
