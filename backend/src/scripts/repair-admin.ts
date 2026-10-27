import { EMPLOYEE_STATUS } from "../configs/entities/employee.config.ts"
import { prisma } from "../libs/database.ts"
import { getSeedPassword } from "./seeders/seed-password.util.ts"
import { HashUtil } from "../utils/hash.util.ts"

async function runRepair() {
  console.log("Running fallback admin repair script...")

  try {
    // Find or create the dynamic Admin role
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

    // Look for username 'admin'
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
        },
      })
    } else {
      console.log("Creating new fallback admin employee...")
      const passwordHash = await HashUtil.hash(getSeedPassword("SEED_PASSWORD"))
      adminEmployee = await prisma.employee.create({
        data: {
          fullName: "System Administrator",
          username: "admin",
          email: "admin@company.com",
          passwordHash,
          status: EMPLOYEE_STATUS.ACTIVE,
        },
      })
      console.log("Created fallback admin: username 'admin', password from SEED_PASSWORD")
    }

    // Ensure EmployeeRole mapping exists
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

    // Ensure at least one lock record exists in AdminStateLock
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
  } finally {
    await prisma.$disconnect()
  }
}

void runRepair()
