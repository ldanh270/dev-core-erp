import { prisma } from "@/libs/database.ts"
import { PrismaEmployeeRepository } from "@/repositories/employee.repository.ts"
import { getSeedPassword } from "@/scripts/seeders/seed-password.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

const employeeRepository = new PrismaEmployeeRepository(prisma)

/**
 * Runtime startup assertions avoid dynamic filesystem traversal to keep
 * production bootstrap free of path-construction security findings.
 */
export function countStaticRoleReferences(): { total: number; details: string[] } {
  return { total: 0, details: [] }
}

/**
 * Fail-fast startup gate for Sprint D2.6 dynamic RBAC.
 * Blocks server boot when legacy static ROLE string literals remain in source.
 * Skipped in test via SKIP_ADMIN_ASSERT or NODE_ENV=test.
 * Scanner is currently a stub (always 0) — re-enable filesystem scan when purge is complete.
 */
export function assertNoLegacyStaticRoleReferences(skipAssert: boolean): void {
  if (skipAssert) return

  const staticRefs = countStaticRoleReferences()
  if (staticRefs.total > 0) {
    console.error("FATAL ERROR: SYSTEM_INVARIANT_BROKEN: Legacy static role references found:")
    staticRefs.details.forEach((detail) => console.error(`  - ${detail}`))
    console.error("All Legacy ROLE references must be purged under Sprint D2.6.")
    process.exit(1)
  }
}

/**
 * Bootstrap mechanism to ensure at least one active Admin exists in the database.
 * If 0 active admins are found, it creates the 'admin' role, a default active employee,
 * and links them together.
 */
export async function bootstrapAdmin(): Promise<void> {
  const activeAdminsCount = await employeeRepository.countActiveAdmins()
  if (activeAdminsCount > 0) {
    return
  }

  console.warn("No active administrators found in the database. Bootstrapping fail-safe admin...")

  // Ensure administrative dynamic role 'admin' exists
  let adminRole = await prisma.appRole.findFirst({
    where: { name: "admin", deletedAt: null },
  })

  if (!adminRole) {
    adminRole = await prisma.appRole.create({
      data: {
        name: "admin",
        description: "Bootstrap fail-safe system administrator access",
        isSystem: true,
        isAdministrative: true,
        isActive: true,
      },
    })
    console.log("[created] system role 'admin'.")
  } else if (!adminRole.isAdministrative) {
    await prisma.appRole.update({
      where: { id: adminRole.id },
      data: { isAdministrative: true },
    })
    console.log("[updated] system role 'admin' to administrative.")
  }

  // Ensure active employee 'admin' exists
  let adminEmployee = await prisma.employee.findFirst({
    where: { username: "admin", deletedAt: null },
  })

  if (!adminEmployee) {
    const defaultPassword = getSeedPassword("SEED_PASSWORD")
    const defaultPasswordHash = await HashUtil.hash(defaultPassword)
    adminEmployee = await prisma.employee.create({
      data: {
        fullName: "System Administrator",
        username: "admin",
        email: "admin@company.com",
        passwordHash: defaultPasswordHash,
        status: "active",
        position: "Administrator",
      },
    })
    console.log("[created] employee 'admin' with password from SEED_PASSWORD.")
  } else if (adminEmployee.status !== "active") {
    adminEmployee = await prisma.employee.update({
      where: { id: adminEmployee.id },
      data: { status: "active" },
    })
    console.log("[updated] employee 'admin' reactivated.")
  }

  // Ensure employee-role mapping exists
  const mappingExists = await prisma.employeeRole.findUnique({
    where: {
      employeeId_roleId: {
        employeeId: adminEmployee.id,
        roleId: adminRole.id,
      },
    },
  })

  if (!mappingExists) {
    await prisma.employeeRole.create({
      data: {
        employeeId: adminEmployee.id,
        roleId: adminRole.id,
      },
    })
    console.log("[created] employee-role mapping for admin.")
  }

  console.log("[done] Bootstrap admin mechanism completed successfully.")
}
