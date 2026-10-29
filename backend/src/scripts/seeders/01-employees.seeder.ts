import {
  EMPLOYEE_STATUS,
  EMPLOYEE_TYPES,
  EMPLOYEE_TYPE,
  WORK_SCHEDULE_TYPE,
} from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { getSeedPassword } from "@/scripts/seeders/seed-password.util.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"
import { HashUtil } from "@/utils/hash.util.ts"

import { faker } from "@faker-js/faker"

export class EmployeesSeeder implements ISeeder {
  readonly name = "Employees"
  readonly order = 1

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding employees...")

    // Ensure all 5 core role accounts exist (especially since seed-all clears the DB)
    const rolesToSeed = [
      "admin",
      "hr_manager",
      "general_manager",
      "team_leader",
      "employee",
    ]
    let adminId = ""
    const devPos = await prisma.position.findUnique({ where: { code: "developer" } })
    const testerPos = await prisma.position.findUnique({ where: { code: "tester" } })
    const pmPos = await prisma.position.findUnique({ where: { code: "pm" } })
    const hrPos = await prisma.position.findUnique({ where: { code: "hr" } })
    const gmPos = await prisma.position.findUnique({ where: { code: "gm" } })
    const adminPos = await prisma.position.findUnique({ where: { code: "admin" } })

    const passwordHash = await HashUtil.hash(getSeedPassword("SEED_PASSWORD"))

    for (const role of rolesToSeed) {
      const username = role === "admin" ? "admin" : role
      const fullName = role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      let existing = await prisma.employee.findFirst({ where: { username } })

      if (!existing) {
        let phoneSuffix = "0"
        if (role === "admin") phoneSuffix = "1"
        else if (role === "hr_manager") phoneSuffix = "2"
        else if (role === "general_manager") phoneSuffix = "3"
        else if (role === "team_leader") phoneSuffix = "4"
        else if (role === "employee") phoneSuffix = "5"

        let positionId = devPos?.id
        if (role === "admin") positionId = adminPos?.id
        else if (role === "hr_manager") positionId = hrPos?.id
        else if (role === "general_manager") positionId = gmPos?.id
        else if (role === "team_leader") positionId = pmPos?.id

        existing = await prisma.employee.create({
          data: {
            username,
            passwordHash,

            fullName: `${fullName} User`,
            email: `${username}@example.com`,
            phone: `012345678${phoneSuffix}`,
            address: "System Generated",
            position: fullName,
            positionId,
          },
        })
        console.log(`  [!] Core account missing, created default account: ${username}`)
      }

      if (role === "admin") {
        adminId = existing.id
      }
    }

    // Fixed part-time account for PT-by-project flows and E2E tests.
    const partTimeUsername = "part_time"
    let partTimeAccount = await prisma.employee.findFirst({ where: { username: partTimeUsername } })
    if (!partTimeAccount) {
      partTimeAccount = await prisma.employee.create({
        data: {
          username: partTimeUsername,
          passwordHash,
          employeeType: EMPLOYEE_TYPE.FULL_TIME,
          workScheduleType: WORK_SCHEDULE_TYPE.PART_TIME, // PT schedule, not contract type
          fullName: "Part Time User",
          email: "part_time@example.com",
          phone: "0123456786",
          address: "System Generated",
          position: "Part-time Developer",
          positionId: devPos?.id,
        },
      })
      console.log(`  [!] Created part-time account: ${partTimeUsername}`)
    }

    // Seed 6 random employees
    const numEmployeesToCreate = 6
    const employeesData = Array.from({ length: numEmployeesToCreate }).map((_, index) => {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const username =
        faker.internet
          .username({ firstName, lastName })
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") + index

      // Determine role (mostly employees, some team leaders)
      const isTeamLeader = index % 5 === 0

      const type = faker.helpers.arrayElement(EMPLOYEE_TYPES)

      return {
        fullName: `${firstName} ${lastName}`,
        username,
        passwordHash,

        email: faker.internet.email({ firstName, lastName, provider: "example.com" }),
        phone: faker.phone.number({ style: "national" }),
        address: faker.location.streetAddress(),
        position: isTeamLeader ? "Project Manager" : index % 2 === 0 ? "Developer" : "Tester",
        positionId: isTeamLeader ? pmPos?.id : index % 2 === 0 ? devPos?.id : testerPos?.id,
        employeeType: type,
        dateOfBirth: faker.date.birthdate({ min: 22, max: 55, mode: "age" }),
        startDate: faker.date.past({ years: 3 }),
        status: EMPLOYEE_STATUS.ACTIVE,
      }
    })

    const createdEmployees = await prisma.$transaction(
      employeesData.map((data) => prisma.employee.create({ data })),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdEmployees.length} random employees.`)

    // Prepare context updates
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, username: true, position: true },
    })

    return {
      adminId,
      employees: allEmployees,
    }
  }
}

registry.register(new EmployeesSeeder())

// Standalone execution
if (import.meta.main) {
  const seeder = new EmployeesSeeder()
  await seeder.run(createEmptyContext())
  await prisma.$disconnect()
}
