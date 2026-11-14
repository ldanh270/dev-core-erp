import { CONNECTION_STRING, DB_POOL_CONFIG } from "@/configs/system/db.config.ts"
import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Creates and configures a new PrismaClient instance.
 * @returns A new PrismaClient instance configured with a PostgreSQL adapter.
 */
function createPrismaClient() {
  const isProduction = ENV_ENVIRONMENT === ENVIRONMENT.PRODUCTION
  let cleanConnectionString = CONNECTION_STRING
  let hasSSL = isProduction

  if (CONNECTION_STRING) {
    try {
      const url = new URL(CONNECTION_STRING)
      const sslMode = url.searchParams.get("sslmode")
      if (sslMode === "require" || sslMode === "prefer" || sslMode === "allow") {
        hasSSL = true
        url.searchParams.delete("sslmode")
        cleanConnectionString = url.toString()
      }
    } catch (e) {
      hasSSL =
        CONNECTION_STRING.includes("sslmode=require") ||
        CONNECTION_STRING.includes("sslmode=prefer")
      if (hasSSL) {
        cleanConnectionString = CONNECTION_STRING.replace(/[?&]sslmode=[^&]*/g, "")
      }
    }
  }

  const pool = new Pool({
    connectionString: cleanConnectionString,
    max: DB_POOL_CONFIG.MAX,
    idleTimeoutMillis: DB_POOL_CONFIG.IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DB_POOL_CONFIG.CONNECTION_TIMEOUT_MS,
    statement_timeout: DB_POOL_CONFIG.STATEMENT_TIMEOUT_MS,
    ssl: hasSSL ? { rejectUnauthorized: false } : undefined,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

if (globalForPrisma.prisma && !("weeklyScheduleSettings" in globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined as unknown as PrismaClient
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
  globalForPrisma.prisma = prisma
}

/**
 * Establishes a connection to the PostgreSQL database using Prisma.
 * Exits the process if the connection fails.
 */
export const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log("Connect to PostgreSQL database successfully via Prisma")
  } catch (error) {
    console.error("Connect to database error:", error)
    process.exit(1)
  }
}
