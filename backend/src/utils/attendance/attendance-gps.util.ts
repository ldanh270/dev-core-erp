import { ATTENDANCE_ERROR_MESSAGES } from "@/configs/messages/attendance.message.ts"
import {
  ATTENDANCE_GPS_RULES,
  DEFAULT_ATTENDANCE_LOCATION,
} from "@/configs/rules/attendance.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { ATTENDANCE_LAYERS } from "@/constants/attendance.constants.ts"
import type { IAttendanceShiftDTO } from "@/types/attendance.types.ts"
import { AppError } from "@/utils/error.util.ts"

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / ATTENDANCE_GPS_RULES.DEGREES_TO_RADIANS_DIVISOR
}

function getDistanceMeters(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
): number {
  const latDelta = toRadians(second.lat - first.lat)
  const lngDelta = toRadians(second.lng - first.lng)
  const firstLat = toRadians(first.lat)
  const secondLat = toRadians(second.lat)
  const chord =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2

  return (
    ATTENDANCE_GPS_RULES.EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
  )
}

/** Rejects check-in/out when client GPS is outside the shift geofence. */
export function assertWithinShiftGps(
  location: { lat: number; lng: number },
  shift: IAttendanceShiftDTO | null | undefined,
): void {
  if (!shift) {
    return
  }

  // Legacy/demo shifts may not persist GPS. Keep enforcement deterministic by falling back
  // to the company default location instead of silently disabling geofence validation.
  const gpsLat = shift.gpsLat ?? DEFAULT_ATTENDANCE_LOCATION.LATITUDE
  const gpsLng = shift.gpsLng ?? DEFAULT_ATTENDANCE_LOCATION.LONGITUDE
  const gpsRadiusMeters = shift.gpsRadiusMeters ?? DEFAULT_ATTENDANCE_LOCATION.RADIUS_METERS
  const distanceMeters = getDistanceMeters(location, {
    lat: gpsLat,
    lng: gpsLng,
  })

  if (distanceMeters > gpsRadiusMeters) {
    throw new AppError(
      ATTENDANCE_ERROR_MESSAGES.OUTSIDE_GPS_RADIUS,
      HttpStatusCode.BAD_REQUEST,
      ATTENDANCE_LAYERS.SERVICE,
    )
  }
}
