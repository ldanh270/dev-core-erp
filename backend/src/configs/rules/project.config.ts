import { SPENT_TIME_WORK_TIME_TYPE } from "@/configs/entities/project.config.ts"

/** Business rules for project-based part-time time tracking (not weekly shift templates). */
export const SPENT_TIME_RULES = {
  /** Block new logs when task spent hours exceed estimatedTime */
  ENFORCE_ESTIMATE_CAP: true,
  /** Multiplier applied to overtime hour type for payroll */
  OVERTIME_MULTIPLIER: 1.5,
  /** Default hourly rate divisor when deriving from monthly base salary */
  MONTHLY_HOURS_DIVISOR: 176,
} as const

export const SPENT_TIME_OT_MULTIPLIERS: Record<string, number> = {
  [SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY]: 1,
  [SPENT_TIME_WORK_TIME_TYPE.OVERTIME]: SPENT_TIME_RULES.OVERTIME_MULTIPLIER,
}
