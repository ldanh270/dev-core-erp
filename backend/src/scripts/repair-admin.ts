import { REGEX } from "../configs/auth/auth.config.ts"
import { EMPLOYEE_STATUS } from "../configs/entities/employee.config.ts"
import { prisma } from "../libs/database.ts"
import { HashUtil } from "../utils/hash.util.ts"
import { getSeedPassword } from "./seeders/seed-password.util.ts"

/**
 * Repairs the fallback admin role and account.
 * Pass `--reset-password` to replace an existing admin password with the configured core seed password.
 */
async function runRepair(): Promise<void> {
  console.log("Running fallback admin repair script...")

  try {
    let resetPasswordHash: string | undefined
    if (process.argv.includes("--reset-password")) {
      const password = getSeedPassword("SEED_CORE_ACCOUNTS_PASSWORD")
      if (!REGEX.PASSWORD.test(password)) {
        throw new Error(
          "The configured core seed password must meet the login password requirements.",
        )
      }
      resetPasswordHash = await HashUtil.hash(password)
    }

    let adminRole = await prisma.appRole.findFirst({
      where: {
        name: {
          equals: "Admin",
          mode: "insensitive",
        },
        deletedAt: null,
      },
    })

    if (!adminRole) {
      console.log("Admin role not found. Creating a new dynamic Admin role...")
      adminRole = await prisma.appRole.create({
        data: {
          name: "Admin",
          description: "Full system administration access",
          isSystem: true,
          isActive: true,
          isAdministrative: true,
        },
      })
    } else {
      console.log("Admin role found. Ensuring isAdministrative and isActive are true...")
      adminRole = await prisma.appRole.update({
        where: { id: adminRole.id },
        data: {
          isActive: true,
          isAdministrative: true,
        },
      })
    }

    let adminEmployee = await prisma.employee.findFirst({
      where: {
        username: "admin",
        deletedAt: null,
      },
    })

    if (adminEmployee) {
      console.log(
        `Found existing admin employee: ${adminEmployee.username}. Reactivating and mapping dynamic role...`,
      )
      adminEmployee = await prisma.employee.update({
        where: { id: adminEmployee.id },
        data: {
          status: EMPLOYEE_STATUS.ACTIVE,
          failedLoginCount: 0,
          lockedUntil: null,
          ...(resetPasswordHash ? { passwordHash: resetPasswordHash } : {}),
        },
      })
      if (resetPasswordHash) {
        console.log("Reset the existing admin password from the configured core seed password.")
      }
    } else {
      console.log("Creating new fallback admin employee...")
      const passwordHash =
        resetPasswordHash ?? (await HashUtil.hash(getSeedPassword("SEED_PASSWORD")))
      adminEmployee = await prisma.employee.create({
        data: {
          fullName: "System Administrator",
          username: "admin",
          email: "admin@company.com",
          passwordHash,
          status: EMPLOYEE_STATUS.ACTIVE,
        },
      })
      console.log(
        resetPasswordHash
          ? "Created fallback admin with the configured core seed password."
          : "Created fallback admin: username 'admin', password from SEED_PASSWORD",
      )
    }

    const existingMapping = await prisma.employeeRole.findUnique({
      where: {
        employeeId_roleId: {
          employeeId: adminEmployee.id,
          roleId: adminRole.id,
        },
      },
    })

    if (!existingMapping) {
      console.log("Creating Employee-Role mapping to Admin role...")
      await prisma.employeeRole.create({
        data: {
          employeeId: adminEmployee.id,
          roleId: adminRole.id,
          assignedBy: "SYSTEM_REPAIR",
        },
      })
    }

    const lockCount = await prisma.adminStateLock.count()
    if (lockCount === 0) {
      console.log("Initializing AdminStateLock...")
      await prisma.adminStateLock.create({
        data: { id: 1 },
      })
    }

    console.log("Fallback admin repair completed successfully!")
  } catch (error) {
    console.error("Error during admin repair:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void runRepair()
