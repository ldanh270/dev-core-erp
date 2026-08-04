import {
  PAYROLL_STATUS,
  generateDefaultPayrollName,
} from "@/configs/entities/payroll.config.ts"
import { prisma } from "@/libs/database.ts"
import { PAYROLL_DEMO } from "@/scripts/seeders/payroll-demo.config.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class PayrollsSeeder implements ISeeder {
  readonly name = "Payrolls"
  readonly order = 14

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding payrolls...")

    const adminId = context.adminId

    if (!adminId) {
      throw new Error("Missing required context (admin).")
    }

    const payrollsToCreate = PAYROLL_DEMO.PAYROLL_MONTHS.map((month) => ({
      name: generateDefaultPayrollName(month, PAYROLL_DEMO.YEAR),
      periodMonth: month,
      periodYear: PAYROLL_DEMO.YEAR,
      status: PAYROLL_STATUS.APPROVED,
      totalAmount: 0, // Will be updated by Payslips seeder
      approvedById: adminId,
      approvedAt: new Date(),
    }))

    const createdPayrolls = await prisma.$transaction(
      payrollsToCreate.map((data) =>
        prisma.payroll.upsert({
          where: {
            periodYear_periodMonth_name: {
              periodYear: data.periodYear,
              periodMonth: data.periodMonth,
              name: data.name,
            },
          },
          update: data,
          create: data,
        }),
      ),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdPayrolls.length} payrolls.`)

    return {
      payrollIds: createdPayrolls.map((p) => p.id),
    }
  }
}

registry.register(new PayrollsSeeder())

if (import.meta.main) {
  const seeder = new PayrollsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  await seeder.run(ctx)
  await prisma.$disconnect()
}
