export const SYSTEM_CONFIG = {
  STORAGE_KEYS: {
    AUTH_TOKEN: "auth_token",
    LOCATION_CACHE: "userLocation",
  },
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    SMALL_LIMIT: 10,
    MAX_VISIBLE_PAGES: 5,
    /** Bulk fetch for admin dropdowns and schedule grids. */
    BULK_LIMIT: 1000,
  },
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: "image/jpeg,image/png,image/webp,image/gif,application/pdf",
  },
} as const

/**
 * Standard sorting directions
 */
export const SORT_ORDER = {
  ASC: "asc",
  DESC: "desc",
} as const

/**
 * Array of valid sorting directions
 */
export const SORT_ORDER_VALUES = [SORT_ORDER.ASC, SORT_ORDER.DESC] as const

export const COMMON_TEXTS = {
  NOT_AVAILABLE: "N/A",
  SYSTEM: "Hệ thống",
} as const

export * from "./branding.config"
