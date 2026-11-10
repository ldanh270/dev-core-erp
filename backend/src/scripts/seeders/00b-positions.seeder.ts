import { prisma } from "@/libs/database.ts"
import { SeedContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

/**
 * Seeder to pre-populate default system positions in the database.
 */
export class PositionsSeeder implements ISeeder {
  readonly name = "Positions"
  readonly order = 0.5

  /**
   * Runs the seeder logic to create standard roles/positions if they do not exist.
   * @param context - The shared seed context database.
   * @returns Updated context object.
   */
  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.log("  Seeding Positions...")
    const positionsData = [
      { name: "Admin", code: "admin", description: "System Administrator" },
      { name: "General Manager", code: "gm", description: "General Manager" },
      { name: "HR Manager", code: "hr", description: "Human Resource Manager" },
      { name: "Project Manager", code: "pm", description: "Project Manager" },
      { name: "Developer", code: "developer", description: "Software Developer" },
      { name: "Tester", code: "tester", description: "QA Tester" },
    ]

    for (const pos of positionsData) {
      const existing = await prisma.position.findFirst({
        where: { code: pos.code, deletedAt: null },
      })
      if (!existing) {
        await prisma.position.create({
          data: pos
        })
      }
    }

    return context
  }
}

registry.register(new PositionsSeeder())
