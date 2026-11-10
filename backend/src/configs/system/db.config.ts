import "dotenv/config"

/** Database connection string from environment */
export const CONNECTION_STRING = process.env.DATABASE_URL

/**
 * Common Database Error Codes
 * Maps database-specific error codes (Prisma, MongoDB, etc.) to standardized definitions
 */
export const DB_ERROR_CODES = {
  /** Prisma Unique Constraint Violation or MongoDB Duplicate Key Error */
  UNIQUE_CONSTRAINT: ["P2002", 11000],

  /** Prisma Record Not Found */
  RECORD_NOT_FOUND: ["P2025"],

  /** Prisma Foreign Key Constraint Violation */
  FOREIGN_KEY_CONSTRAINT: ["P2003"],
} as const

/**
 * Standard database sorting directions
 */
export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
} as const

/**
 * Array of valid sorting directions for schema validation
 */
export const SORT_ORDER_VALUES = [SORT_ORDER.ASC, SORT_ORDER.DESC] as const

/** Prisma interactive transaction limits for multi-step writes (e.g. availability upsert). */
export const PRISMA_INTERACTIVE_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 15_000,
} as const

/** PostgreSQL connection pool bounds tuned for pooled/Supabase deployments. */
export const DB_POOL_CONFIG = {
  MAX: Number(process.env.DB_POOL_MAX) || 10,
  IDLE_TIMEOUT_MS: 30_000,
  CONNECTION_TIMEOUT_MS: 5_000,
  STATEMENT_TIMEOUT_MS: Number(process.env.DB_STATEMENT_TIMEOUT_MS) || 30_000,
} as const
