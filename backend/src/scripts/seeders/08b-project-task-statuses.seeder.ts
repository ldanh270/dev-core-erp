import { DEFAULT_PROJECT_TASK_STATUSES } from "@/configs/entities/project.config.ts"
import { SEEDER_CONFIGS } from "@/configs/system/seeder.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

export class ProjectTaskStatusesSeeder implements ISeeder {
  readonly name = SEEDER_CONFIGS.PROJECT_TASK_STATUSES.NAME
  readonly order = SEEDER_CONFIGS.PROJECT_TASK_STATUSES.ORDER

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding project task statuses...")

    const projectIds = context.projectIds || []
    if (projectIds.length === 0) {
      console.log("  No projects found to seed statuses.")
      return {}
    }

    let seededCount = 0

    for (const projectId of projectIds) {
      // Check if statuses already exist for this project
      const existingCount = await prisma.projectTaskStatus.count({
        where: { projectId },
      })

      if (existingCount === 0) {
        for (const item of DEFAULT_PROJECT_TASK_STATUSES) {
          await prisma.projectTaskStatus.create({
            data: {
              projectId,
              name: item.name,
              color: item.color,
              order: item.order,
              isDefault: item.isDefault,
              isCompleted: item.isCompleted,
            },
          })
          seededCount++
        }
      }
    }

    console.log(
      `  Seeded ${seededCount} project task statuses across ${projectIds.length} projects.`,
    )
    return {}
  }
}

registry.register(new ProjectTaskStatusesSeeder())
