import { REGEX } from "../configs/auth/auth.config.ts"
import { prisma } from "../libs/database.ts"
import { HashUtil } from "../utils/hash.util.ts"

async function resetAdminPassword(): Promise<void> {
  const password = process.env.SEED_CORE_ACCOUNTS_PASSWORD
  if (!password) {
    throw new Error("Missing required environment variable: SEED_CORE_ACCOUNTS_PASSWORD")
  }
  if (!REGEX.PASSWORD.test(password)) {
    throw new Error(
      "SEED_CORE_ACCOUNTS_PASSWORD must meet the login password requirements before resetting the admin password.",
    )
  }

  const admin = await prisma.employee.findFirst({
    where: { username: "admin", deletedAt: null },
    select: { id: true },
  })
  if (!admin) {
    throw new Error("No active admin account found. Run bun run db:seed:admin first.")
  }

  await prisma.employee.update({
    where: { id: admin.id },
    data: {
      passwordHash: await HashUtil.hash(password),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  })

  console.log("Admin password reset successfully using SEED_CORE_ACCOUNTS_PASSWORD.")
}

try {
  await resetAdminPassword()
} catch (error) {
  console.error("Failed to reset admin password:", error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
