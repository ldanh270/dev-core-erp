import {
  HOLIDAY_TYPE_LABELS,
  type IHolidayType,
  UNKNOWN_HOLIDAY_TYPE_LABEL,
} from "@/config/entities/attendance.config"

/** Resolves a holiday type enum to its display label. */
export function getHolidayTypeLabel(type: IHolidayType): string {
  return HOLIDAY_TYPE_LABELS.get(type) ?? UNKNOWN_HOLIDAY_TYPE_LABEL
}
