import { PROJECT_MEMBER_WORK_MODE } from "@/configs/entities/project.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util.ts"

import { faker } from "@faker-js/faker"

export class ProjectMembersSeeder implements ISeeder {
  readonly name = "ProjectMembers"
  readonly order = 11

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding project members...")

    const employees = context.employees
    const projectIds = context.projectIds

    if (employees.length === 0 || projectIds.length === 0) {
      throw new Error("Missing required context (employees or projects).")
    }

    const employeeDetails = await prisma.employee.findMany({
      where: { id: { in: employees.map((e) => e.id) } },
      select: { id: true, employeeType: true, workScheduleType: true, username: true },
    })
    const employeeScheduleById = new Map(
      employeeDetails.map((e) => [
        e.id,
        { employeeType: e.employeeType, workScheduleType: e.workScheduleType },
      ]),
    )

    const partTimeUser = employeeDetails.find((e) => e.username === "part_time")
    const membersToCreate = []

    for (const [projectIndex, projectId] of projectIds.entries()) {
      const numMembers = faker.number.int({ min: 3, max: 6 })
      const shuffledEmployees = [...employees].sort(() => 0.5 - Math.random())
      const selectedEmployees = shuffledEmployees.slice(0, numMembers)

      if (
        projectIndex === 0 &&
        partTimeUser &&
        !selectedEmployees.some((e) => e.id === partTimeUser.id)
      ) {
        // Ensure demo PT user is on first project for spent-time / payroll samples.
        selectedEmployees[0] = { id: partTimeUser.id, position: null, username: "part_time" }
      }

      for (const emp of selectedEmployees) {
        const scheduleFields = employeeScheduleById.get(emp.id)
        // PT members get onsite work mode; detected via workScheduleType, not employeeType.
        const isPartTime = scheduleFields ? isPartTimeWorkSchedule(scheduleFields) : false

        membersToCreate.push({
          projectId,
          employeeId: emp.id,
          joinedAt: faker.date.past({ years: 1 }),
          hourlyRate: isPartTime ? faker.number.int({ min: 40000, max: 80000 }) : null,
          workMode: isPartTime
            ? faker.helpers.arrayElement([
                PROJECT_MEMBER_WORK_MODE.REMOTE,
                PROJECT_MEMBER_WORK_MODE.ONSITE,
              ])
            : PROJECT_MEMBER_WORK_MODE.REMOTE,
        })
      }
    }

    const result = await prisma.projectMember.createMany({
      data: membersToCreate,
      skipDuplicates: true,
    })

    console.log(`  Seeded ${result.count} project members.`)

    return {}
  }
}

registry.register(new ProjectMembersSeeder())

if (import.meta.main) {
  const seeder = new ProjectMembersSeeder()
  const emps = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const projects = await prisma.project.findMany()

  const ctx = createEmptyContext()
  ctx.employees = emps
  ctx.projectIds = projects.map((p) => p.id)

  await seeder.run(ctx)
  await prisma.$disconnect()
}
