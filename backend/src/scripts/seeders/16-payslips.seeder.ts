import { prisma } from "@/libs/database.ts"
import { PAYROLL_DEMO } from "@/scripts/seeders/payroll-demo.config.ts"
import {
  createPayrollDemoPayslipValues,
  payrollDemoSalaryConfigInclude,
  summarizePayrollDemoAttendance,
} from "@/scripts/seeders/payroll-demo-payslip.util.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

function isDetailedEmployee(username: string): boolean {
  return PAYROLL_DEMO.DETAILED_EMPLOYEE_USERNAMES.includes(username as never)
}

export class PayslipsSeeder implements ISeeder {
  readonly name = "Payslips"
  readonly order = 16

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payslips...")
    if (context.employees.length === 0 || context.payrollIds.length === 0)
      throw new Error("Missing required context (employees or payrolls).")

    const variables = Object.fromEntries(
      (await prisma.salaryVariable.findMany({ where: { isActive: true } })).map((variable) => [
        variable.code,
        Number(variable.value),
      ]),
    )
    let totalPayslipsSeeded = 0

    for (const payrollId of context.payrollIds) {
      const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } })
      if (!payroll) continue

      const periodStart = new Date(payroll.periodYear, payroll.periodMonth - 1, 1)
      const periodEnd = new Date(payroll.periodYear, payroll.periodMonth, 0)
      const configs = await prisma.employeeSalaryConfig.findMany({
        where: {
          employeeId: { in: context.employees.map((employee) => employee.id) },
          effectiveFrom: { lte: periodStart },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: periodStart } }],
        },
        include: payrollDemoSalaryConfigInclude,
        orderBy: { effectiveFrom: "desc" },
      })
      const configsByEmployee = new Map<string, (typeof configs)[number]>()
      configs.forEach((config) => {
        if (!configsByEmployee.has(config.employeeId)) configsByEmployee.set(config.employeeId, config)
      })

      let payrollTotal = 0
      for (const employee of context.employees) {
        const config = configsByEmployee.get(employee.id)
        if (!config) continue

        const attendance = isDetailedEmployee(employee.username)
          ? summarizePayrollDemoAttendance(
              await prisma.attendanceRecord.findMany({
                where: { employeeId: employee.id, date: { gte: periodStart, lte: periodEnd } },
                include: { realShift: true },
              }),
            )
          : {
              workingDays: PAYROLL_DEMO.SYMBOLIC_WORKING_DAYS,
              absentDays: 0,
              overtimeMinutes: 0,
              lateMinutes: 0,
              earlyLeaveMinutes: 0,
              totalWorkMinutes: 0,
              holidayDays: 0,
            }
        const values = createPayrollDemoPayslipValues(config, attendance, variables)
        payrollTotal += values.netSalary

        await prisma.payslip.upsert({
          where: { payrollId_employeeId: { payrollId: payroll.id, employeeId: employee.id } },
          update: {
            salaryConfigId: config.id,
            totalAdditions: values.totalAdditions,
            totalDeductions: values.totalDeductions,
            netSalary: values.netSalary,
            workingDays: values.workingDays,
            absentDays: values.absentDays,
            overtimeMinutes: values.overtimeMinutes,
            details: { deleteMany: {}, create: values.details },
          },
          create: {
            payrollId: payroll.id,
            employeeId: employee.id,
            salaryConfigId: config.id,
            totalAdditions: values.totalAdditions,
            totalDeductions: values.totalDeductions,
            netSalary: values.netSalary,
            workingDays: values.workingDays,
            absentDays: values.absentDays,
            overtimeMinutes: values.overtimeMinutes,
            details: { create: values.details },
          },
        })
        totalPayslipsSeeded += 1
      }
      await prisma.payroll.update({ where: { id: payroll.id }, data: { totalAmount: payrollTotal } })
    }

    console.log(`  Seeded ${totalPayslipsSeeded} payslips.`)
    return {}
  }
}

registry.register(new PayslipsSeeder())

if (import.meta.main) {
  const seeder = new PayslipsSeeder()
  const ctx = createEmptyContext()
  ctx.employees = await prisma.employee.findMany({ select: { id: true, position: true, username: true } })
  ctx.payrollIds = (await prisma.payroll.findMany()).map((payroll) => payroll.id)
  await seeder.run(ctx)
  await prisma.$disconnect()
}
