import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class ApplicationsSeeder implements ISeeder {
  readonly name = "Applications"
  readonly order = 13

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding applications...")

    const adminId = context.adminId
    const employees = context.employees

    if (!adminId || employees.length === 0) {
      throw new Error("Missing required context (admin or employees).")
    }

    const applicationsToCreate = []

    // Create a few random applications (leave, overtime, wfh)
    for (let i = 0; i < 15; i++) {
      const emp = faker.helpers.arrayElement(employees)
      const isApproved = Math.random() > 0.3 // 70% approved
      const types = ["leave", "overtime", "work_from_home"]
      const type = faker.helpers.arrayElement(types)

      const startDate = faker.date.recent({ days: 30 })
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + faker.number.int({ min: 0, max: 2 }))

      applicationsToCreate.push({
        employeeId: emp.id,
        type: type as any,
        status: isApproved ? ("approved" as any) : ("pending" as any),
        startDate,
        endDate,
        reason: faker.lorem.sentence(),
        approvedById: isApproved ? adminId : null,
        approvedAt: isApproved ? new Date() : null,
      })
    }

    const createdApps = await prisma.$transaction(
      applicationsToCreate.map((data) => prisma.application.create({ data })),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdApps.length} applications.`)

    return {}
  }
}

registry.register(new ApplicationsSeeder())

if (import.meta.main) {
  const seeder = new ApplicationsSeeder()
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const ctx = createEmptyContext()
  if (admin) ctx.adminId = admin.id
  ctx.employees = emps
  await seeder.run(ctx)
  await prisma.$disconnect()
}
