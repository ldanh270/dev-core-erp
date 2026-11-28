import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { ATTENDANCE_GPS_RULES, WORKING_SHIFT_FORM_RULES } from "@/config/rules/attendance.config"
import type { IGpsConfig } from "@/types/attendance.types"

import { isAxiosError } from "axios"
import { z } from "zod"

const { MIN_GEOFENCE_RADIUS_METERS } = ATTENDANCE_GPS_RULES
const { TIME_INPUT_PATTERN } = WORKING_SHIFT_FORM_RULES
const { SHIFT_FORM } = ATTENDANCE_MESSAGES

export const shiftFormSchema = z
  .object({
    name: z.string().min(2, SHIFT_FORM.NAME_MIN_LENGTH),
    startTime: z.string().regex(TIME_INPUT_PATTERN, SHIFT_FORM.TIME_FORMAT),
    endTime: z.string().regex(TIME_INPUT_PATTERN, SHIFT_FORM.TIME_FORMAT),
    breakStartTime: z.string(),
    breakEndTime: z.string(),
    gracePeriodMinutes: z.string(),
    gpsLat: z.number({ message: SHIFT_FORM.LATITUDE_NUMBER }).optional(),
    gpsLng: z.number({ message: SHIFT_FORM.LONGITUDE_NUMBER }).optional(),
    gpsRadiusMeters: z
      .number({ message: SHIFT_FORM.RADIUS_NUMBER })
      .min(MIN_GEOFENCE_RADIUS_METERS, `Minimum radius is ${MIN_GEOFENCE_RADIUS_METERS}m`)
      .optional(),
    isActive: z.boolean(),
  })
  .superRefine((values, context) => {
    const hasStart = values.breakStartTime !== ""
    const hasEnd = values.breakEndTime !== ""
    if (hasStart !== hasEnd) {
      context.addIssue({
        code: "custom",
        path: [hasStart ? "breakEndTime" : "breakStartTime"],
        message: SHIFT_FORM.BREAK_PAIR_REQUIRED,
      })
      return
    }
    if (
      hasStart &&
      !(
        values.startTime < values.breakStartTime &&
        values.breakStartTime < values.breakEndTime &&
        values.breakEndTime < values.endTime
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["breakStartTime"],
        message: SHIFT_FORM.BREAK_OUTSIDE_SHIFT,
      })
    }
  })

export type ShiftFormValues = z.infer<typeof shiftFormSchema>

/** Extracts API error message for shift create/update toasts. */
export function getShiftMutationError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  return error.response?.data?.error?.message ?? error.response?.data?.message ?? fallback
}

/** Builds GPS payload — null clears geofence on update; undefined leaves it unchanged. */
export function buildGpsPayload(
  values: ShiftFormValues,
  options: { isUpdate: boolean; hadGps: boolean },
): IGpsConfig | null | undefined {
  const { gpsLat, gpsLng, gpsRadiusMeters } = values
  if (gpsLat != null && gpsLng != null && gpsRadiusMeters != null) {
    return { lat: gpsLat, lng: gpsLng, radiusMeters: gpsRadiusMeters }
  }
  if (options.isUpdate && options.hadGps) return null
  return undefined
}
