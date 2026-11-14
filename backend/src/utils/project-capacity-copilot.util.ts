/**
 * Pure Capacity Copilot formulas.
 * Kept database-free so forecast math is testable and explainable in demo.
 */
import {
  CAPACITY_CONFIDENCE_LEVEL,
  CAPACITY_COPILOT_RULES,
  CapacityConfidenceLevel,
} from "@/configs/rules/capacity-copilot.config.ts"

export const CAPACITY_VELOCITY = {
  DEFAULT: 1,
  MIN: 0.5,
  MAX: 2,
} as const

export const CAPACITY_RISK = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const

export interface CapacityMemberInput {
  employeeId: string
  fullName: string
  roleCode: string
  roleName: string
  availableHours: number
  estimatedHours: number
  spentHours: number
  skillMatchFactor?: number
}

export interface CapacityMemberForecast {
  employeeId: string
  fullName: string
  roleCode: string
  roleName: string
  availableHours: number
  velocity: number
  skillMatchFactor: number
  effectiveHours: number
}

export interface CapacityRoleForecast {
  roleCode: string
  roleName: string
  effectiveHours: number
}

export interface CapacityForecastResult {
  targetPercent: number
  predictedPercent: number
  percentGap: number
  confidenceLevel: CapacityConfidenceLevel
  confidenceReasons: string[]
  productivityRate: number
  requiredEffectiveHours: number
  totalEffectiveHours: number
  neededEffectiveHours: number
  riskLevel: string
  members: CapacityMemberForecast[]
  roles: CapacityRoleForecast[]
  history: Array<{
    weekStart: string
    spentHours: number
    completedPercent: number
  }>
  recommendations: string[]
}

/** Bounds personal velocity so a single abnormal history sample cannot dominate the forecast. */
export const clampVelocity = (value: number): number =>
  Math.max(CAPACITY_VELOCITY.MIN, Math.min(CAPACITY_VELOCITY.MAX, value))

/**
 * Calculates delivery velocity as estimated hours divided by accepted spent hours.
 * Missing history deliberately returns the neutral factor `1`, which is surfaced by confidence.
 */
export const calculateVelocity = (estimatedHours: number, spentHours: number): number => {
  if (estimatedHours <= 0 || spentHours <= 0) return CAPACITY_VELOCITY.DEFAULT
  // Velocity > 1 means the employee historically finishes estimated work faster than logged time.
  // Clamp avoids one abnormal week making the forecast unrealistically optimistic or pessimistic.
  return clampVelocity(estimatedHours / spentHours)
}

/**
 * Main explainable forecast formula:
 * effective hours = available hours × velocity × skill-match factor;
 * predicted delivery = total effective hours × historical productivity (% per hour).
 */
export const buildCapacityForecast = (
  members: CapacityMemberInput[],
  targetPercent: number,
  history: CapacityForecastResult["history"],
): CapacityForecastResult => {
  const memberForecasts = members.map((member) => {
    const velocity = calculateVelocity(member.estimatedHours, member.spentHours)
    const skillMatchFactor =
      member.skillMatchFactor ?? CAPACITY_COPILOT_RULES.DEFAULT_SKILL_MATCH_FACTOR
    // Effective hours convert raw availability into delivery capacity using observed velocity.
    const effectiveHours = member.availableHours * velocity * skillMatchFactor

    return {
      employeeId: member.employeeId,
      fullName: member.fullName,
      roleCode: member.roleCode,
      roleName: member.roleName,
      availableHours: roundOne(member.availableHours),
      velocity: roundTwo(velocity),
      skillMatchFactor: roundTwo(skillMatchFactor),
      effectiveHours: roundOne(effectiveHours),
    }
  })

  const roleCodes = Array.from(new Set(memberForecasts.map((member) => member.roleCode)))
  const roles = roleCodes.map((roleCode) => {
    const firstMember = memberForecasts.find((member) => member.roleCode === roleCode)
    // Role summary is what lets PM/Admin spot "developer thiếu, tester dư" across projects.
    const effectiveHours = memberForecasts
      .filter((member) => member.roleCode === roleCode)
      .reduce((sum, member) => sum + member.effectiveHours, 0)

    return {
      roleCode,
      roleName: firstMember?.roleName ?? roleCode,
      effectiveHours: roundOne(effectiveHours),
    }
  })

  const totalEffectiveHours = memberForecasts.reduce(
    (sum, member) => sum + member.effectiveHours,
    0,
  )
  // Historical productivity links delivery history (% completed) to this week's effective hours.
  const productivityRate = calculateProductivityRate(history)
  const confidence = buildConfidenceSignal(history, memberForecasts)
  const predictedPercent = totalEffectiveHours * productivityRate
  const percentGap = targetPercent - predictedPercent
  const requiredEffectiveHours = productivityRate > 0 ? targetPercent / productivityRate : 0
  const neededEffectiveHours = productivityRate > 0 ? Math.max(0, percentGap / productivityRate) : 0

  return {
    targetPercent: roundOne(targetPercent),
    predictedPercent: roundOne(predictedPercent),
    percentGap: roundOne(percentGap),
    confidenceLevel: confidence.level,
    confidenceReasons: confidence.reasons,
    productivityRate: roundTwo(productivityRate),
    requiredEffectiveHours: roundOne(requiredEffectiveHours),
    totalEffectiveHours: roundOne(totalEffectiveHours),
    neededEffectiveHours: roundOne(neededEffectiveHours),
    riskLevel: getPercentRisk(percentGap, targetPercent),
    members: memberForecasts,
    roles,
    history,
    recommendations: buildRecommendations(
      productivityRate,
      percentGap,
      neededEffectiveHours,
      roles,
    ),
  }
}

/** Grades forecast confidence from usable history depth and personal-velocity coverage. */
const buildConfidenceSignal = (
  history: CapacityForecastResult["history"],
  members: CapacityMemberForecast[],
): { level: CapacityConfidenceLevel; reasons: string[] } => {
  const usableHistoryWeeks = history.filter(
    (week) => week.spentHours > 0 && week.completedPercent > 0,
  )
  const membersWithoutPersonalVelocity = members.filter(
    (member) => member.velocity === CAPACITY_VELOCITY.DEFAULT,
  )
  const reasons: string[] = []

  if (members.length === 0) {
    reasons.push("Project chưa có member active nên forecast chưa phản ánh capacity thật.")
  }
  if (usableHistoryWeeks.length < CAPACITY_COPILOT_RULES.MIN_HISTORY_WEEKS_FOR_MEDIUM_CONFIDENCE) {
    reasons.push("Ít dữ liệu delivery history nên forecast chỉ mang tính tham khảo.")
  }
  if (membersWithoutPersonalVelocity.length > 0) {
    reasons.push("Một số member chưa có velocity cá nhân, hệ thống đang dùng velocity mặc định.")
  }

  if (
    usableHistoryWeeks.length >= CAPACITY_COPILOT_RULES.MIN_HISTORY_WEEKS_FOR_HIGH_CONFIDENCE &&
    reasons.length === 0
  ) {
    return {
      level: CAPACITY_CONFIDENCE_LEVEL.HIGH,
      reasons: ["Có đủ dữ liệu lịch sử và velocity để forecast ổn định hơn."],
    }
  }

  if (usableHistoryWeeks.length >= CAPACITY_COPILOT_RULES.MIN_HISTORY_WEEKS_FOR_MEDIUM_CONFIDENCE) {
    return {
      level: CAPACITY_CONFIDENCE_LEVEL.MEDIUM,
      reasons: reasons.length > 0 ? reasons : ["Có dữ liệu lịch sử ở mức vừa đủ."],
    }
  }

  return { level: CAPACITY_CONFIDENCE_LEVEL.LOW, reasons }
}

/** Converts historical completed percentage and logged time into delivery percentage per hour. */
const calculateProductivityRate = (history: CapacityForecastResult["history"]): number => {
  // Productivity rate converts historical delivery into "% completed per effective hour".
  // If there is no spent-time + done-task history, the UI must show "not enough data" instead of guessing.
  const totals = history.reduce(
    (sum, week) => ({
      completedPercent: sum.completedPercent + week.completedPercent,
      spentHours: sum.spentHours + week.spentHours,
    }),
    { completedPercent: 0, spentHours: 0 },
  )
  if (totals.spentHours <= 0 || totals.completedPercent <= 0) return 0
  return totals.completedPercent / totals.spentHours
}

/** Classifies shortage severity relative to the project's committed target percentage. */
const getPercentRisk = (percentGap: number, targetPercent: number): string => {
  if (percentGap <= 0) return CAPACITY_RISK.LOW
  if (targetPercent <= 0) return CAPACITY_RISK.LOW
  return percentGap / targetPercent >= CAPACITY_COPILOT_RULES.HIGH_RISK_GAP_RATIO
    ? CAPACITY_RISK.HIGH
    : CAPACITY_RISK.MEDIUM
}

/** Produces staffing guidance while leaving the final transfer/scope decision to Admin/PM. */
const buildRecommendations = (
  productivityRate: number,
  percentGap: number,
  neededEffectiveHours: number,
  roles: CapacityRoleForecast[],
): string[] => {
  if (productivityRate <= 0) {
    return [
      "Chưa đủ dữ liệu lịch sử để dự đoán % hoàn thành. Cần có spent time và task done ở các tuần trước, hoặc PM nhập baseline tạm cho tuần đầu.",
    ]
  }

  if (percentGap <= 0) {
    return [
      "Dự đoán tuần này đạt hoặc vượt cam kết (deal). Có thể giữ plan hiện tại hoặc chuyển bớt người sang project khác đang thiếu capacity.",
    ]
  }

  const roleHint =
    roles.length > 0
      ? ` Ưu tiên bổ sung role ${
          [...roles].sort((a, b) => a.effectiveHours - b.effectiveHours)[0].roleName
        }.`
      : ""
  return [
    `Dự đoán tuần này thiếu ${percentGap.toFixed(1)}% so với cam kết. Cần thêm khoảng ${neededEffectiveHours.toFixed(1)} effective hours.${roleHint}`,
    "Admin/PM có thể điều thêm nhân viên phù hợp, xin thêm availability từ part-time/intern, hoặc giảm scope tuần này.",
  ]
}

const roundOne = (value: number): number => Math.round(value * 10) / 10
const roundTwo = (value: number): number => Math.round(value * 100) / 100
