/**
 * Database seeder entry point — invoked via `bun run seed`.
 *
 * Default script: `bun run seed` passes --incremental, so existing DB data is not wiped.
 * Incremental: `bun run seed -- --incremental` — no wipe; skips seeders that already have data.
 * Fresh: `bun run seed:fresh` passes --force-clear, wipes DB, then runs all seeders.
 * Prerequisite for incremental: `bun run seed:admin` must have been run first.
 */
import { prisma } from "../libs/database.ts"
import { clearDatabase } from "./clear-db.ts"
import { runIncrementalSeed } from "./seed-incremental.util.ts"
import { SeedContext, createEmptyContext, registry } from "./seeders/index.ts"

const isIncremental = process.argv.includes("--incremental")
const isFreshSeedConfirmed = process.argv.includes("--force-clear")

/** Wipe DB then run every registered seeder — default first-time / reset flow. */
async function runFreshSeed(): Promise<void> {
  console.log("Starting full database seed (clear + seed)...")
  let context: SeedContext = createEmptyContext()

  const sortedSeeders = registry.getSorted()
  if (sortedSeeders.length === 0) {
    console.log("No seeders registered.")
    return
  }

  await clearDatabase({ force: isFreshSeedConfirmed })

  for (const seeder of sortedSeeders) {
    console.log(`\n[→] Running: ${seeder.name}`)
    const result = await seeder.run(context)
    context = { ...context, ...result }
    console.log(`[✓] Done: ${seeder.name}`)
  }

  console.log("\nAll seeders completed successfully.")
}

/** Route to fresh or incremental seed based on --incremental CLI flag. */
async function main(): Promise<void> {
  try {
    if (isIncremental) {
      await runIncrementalSeed()
    } else {
      await runFreshSeed()
    }
  } catch (error) {
    console.error("Error during seeding:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
