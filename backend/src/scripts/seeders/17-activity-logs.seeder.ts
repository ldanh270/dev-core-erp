import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class ActivityLogsSeeder implements ISeeder {
  readonly name = "ActivityLogs"
  readonly order = 17

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding activity logs...")

    const employees = context.employees

    if (employees.length === 0) {
      throw new Error("Missing required context (employees).")
    }

    const logsToCreate = []

    for (const emp of employees) {
      const numLogs = faker.number.int({ min: 5, max: 20 })

      for (let i = 0; i < numLogs; i++) {
        const isLogin = Math.random() > 0.2 // 80% login, 20% something else (like logout or failed)
        const actionType = isLogin
          ? "login"
          : faker.helpers.arrayElement(["logout", "failed_login"])

        const createdAt = faker.date.recent({ days: 14 })
        const expiresAt = new Date(createdAt)
        expiresAt.setDate(expiresAt.getDate() + 30) // logs kept for 30 days

        logsToCreate.push({
          employeeId: emp.id,
          actionType: actionType as any,
          ipAddress: faker.internet.ipv4(),
          details: {
            userAgent: faker.internet.userAgent(),
            browser: "Chrome",
            os: "Windows",
          },
          createdAt,
          expiresAt,
        })
      }
    }

    const chunkSize = 200
    for (let i = 0; i < logsToCreate.length; i += chunkSize) {
      const chunk = logsToCreate.slice(i, i + chunkSize)
      await prisma.activityLog.createMany({
        data: chunk,
      })
    }

    console.log(`  Seeded ${logsToCreate.length} activity logs.`)

    return {}
  }
}

registry.register(new ActivityLogsSeeder())

if (import.meta.main) {
  const seeder = new ActivityLogsSeeder()
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const ctx = createEmptyContext()
  ctx.employees = emps
  await seeder.run(ctx)
  await prisma.$disconnect()
}
