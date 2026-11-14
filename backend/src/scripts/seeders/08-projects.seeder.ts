import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { faker } from "@faker-js/faker"

export class ProjectsSeeder implements ISeeder {
  readonly name = "Projects"
  readonly order = 8

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding projects...")

    const adminId = context.adminId
    const employees = context.employees

    if (!adminId || employees.length === 0) {
      throw new Error("Missing required context (admin or employees).")
    }

    // Find some team leaders
    let teamLeaders = employees.filter(
      (e) => e.position === "Team Leader" || e.username === "admin" || e.username === "team_leader",
    )
    if (teamLeaders.length === 0) {
      teamLeaders = employees
    }

    const projectsData = [
      {
        name: "HR Management System Migration",
        description: "Migrate legacy HR system to modern stack",
        techStack: ["React", "Node.js", "PostgreSQL", "Prisma"],
        status: "active" as any,
        teamLeaderId: faker.helpers.arrayElement(teamLeaders).id,
        createdById: adminId,
        startDate: faker.date.past({ years: 1 }),
      },
      {
        name: "E-Commerce Mobile App",
        description: "Build native mobile app for existing e-commerce platform",
        techStack: ["React Native", "Firebase"],
        status: "planning" as any,
        teamLeaderId: faker.helpers.arrayElement(teamLeaders).id,
        createdById: adminId,
        startDate: faker.date.future(),
      },
      {
        name: "Data Warehouse Integration",
        description: "Set up Snowflake and ETL pipelines",
        techStack: ["Python", "Snowflake", "dbt"],
        status: "completed" as any,
        teamLeaderId: faker.helpers.arrayElement(teamLeaders).id,
        createdById: adminId,
        startDate: faker.date.past({ years: 2 }),
        actualEndDate: faker.date.recent(),
      },
    ]

    const createdProjects = await prisma.$transaction(
      projectsData.map((data) =>
        prisma.project.upsert({
          where: { name: data.name },
          update: data,
          create: data,
        }),
      ),
      { timeout: 120000 },
    )

    console.log(`  Seeded ${createdProjects.length} projects.`)

    return {
      projectIds: createdProjects.map((p) => p.id),
    }
  }
}

registry.register(new ProjectsSeeder())

if (import.meta.main) {
  const seeder = new ProjectsSeeder()
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
