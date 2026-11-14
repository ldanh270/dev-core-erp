/**
 * Frontend-only display/input constants for Capacity Copilot.
 * Backend validation remains the source of truth for accepted values.
 */
export const CAPACITY_COPILOT_RULES = {
  DEFAULT_LOOKBACK_WEEKS: 3,
  DAYS_PER_WEEK: 7,
  MIN_HISTORY_WEEKS_FOR_MEDIUM_CONFIDENCE: 2,
  MIN_HISTORY_WEEKS_FOR_HIGH_CONFIDENCE: 3,
  UNKNOWN_ROLE_CODE: "unknown",
  UNKNOWN_ROLE_NAME: "Chưa có role",
  DEAL_TARGET_PERCENT_MIN: 1,
  DEAL_TARGET_PERCENT_MAX: 100,
  DEAL_TARGET_PERCENT_PLACEHOLDER: "Ví dụ: 20",
} as const

/** Mirrors the confidence values returned by the backend forecast contract. */
export const CAPACITY_CONFIDENCE_LEVEL = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type CapacityConfidenceLevel =
  (typeof CAPACITY_CONFIDENCE_LEVEL)[keyof typeof CAPACITY_CONFIDENCE_LEVEL]

/** Risk values returned by the backend forecast contract. */
export const CAPACITY_RISK_LEVEL = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export type CapacityRiskLevel = (typeof CAPACITY_RISK_LEVEL)[keyof typeof CAPACITY_RISK_LEVEL]

/** UI modes distinguish historical backtesting from current/future forecasting. */
export const CAPACITY_WEEK_MODE = {
  HISTORY: "history",
  CURRENT: "current",
  FORECAST: "forecast",
} as const

export type CapacityWeekMode = (typeof CAPACITY_WEEK_MODE)[keyof typeof CAPACITY_WEEK_MODE]
