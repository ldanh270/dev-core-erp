import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class SalaryConfigsSeeder implements ISeeder {
  readonly name = "SalaryConfigs"
  readonly order = 10

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding salary configs...")

    const adminId = context.adminId
    const employees = context.employees
    const payslipTemplateIds = context.payslipTemplateIds

    if (!adminId || employees.length === 0 || payslipTemplateIds.length === 0) {
      throw new Error("Missing required context (admin, employees, or payslip templates).")
    }

    const templateId = payslipTemplateIds[0] // Use standard template
    const salaryConfigMap: Record<string, string> = {}

    const configs = []
    for (const emp of employees) {
      // Base salary based on role
      let baseSalary = 10000000 // default 10M
      if (emp.username === "admin" || emp.username === "general_manager") baseSalary = 40000000
      else if (emp.username === "hr_manager") baseSalary = 30000000
      else if (emp.position === "Team Leader" || emp.username === "team_leader")
        baseSalary = 25000000

      // Add some randomness
      baseSalary += faker.number.int({ min: 0, max: 10 }) * 1000000

      const config = await prisma.employeeSalaryConfig.create({
        data: {
          employeeId: emp.id,
          templateId,
          baseSalary,
          effectiveFrom: new Date(2025, 0, 1),
          note: "Seeded initial config",
          createdById: adminId,
        },
      })

      salaryConfigMap[emp.id] = config.id
      configs.push(config)
    }

    console.log(`  Seeded ${configs.length} salary configs.`)

    return { salaryConfigMap }
  }
}

registry.register(new SalaryConfigsSeeder())

if (import.meta.main) {
  const seeder = new SalaryConfigsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const templates = await prisma.payslipTemplate.findMany()

  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.employees = emps
  ctx.payslipTemplateIds = templates.map((t) => t.id)

  await seeder.run(ctx)
  await prisma.$disconnect()
}
