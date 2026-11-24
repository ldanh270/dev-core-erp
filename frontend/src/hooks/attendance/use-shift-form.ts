import { MAP_INITIAL_CENTER } from "@/config/map.config"
import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { ATTENDANCE_GPS_RULES, WORKING_SHIFT_FORM_RULES } from "@/config/rules/attendance.config"
import { useCreateShift, useUpdateShift } from "@/hooks/attendance/use-shifts"
import { minutesToTime } from "@/lib/utils"
import {
  buildGpsPayload,
  getShiftMutationError,
  shiftFormSchema,
  type ShiftFormValues,
} from "@/schemas/attendance.schema"
import type { IWorkingShift } from "@/types/attendance.types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

const {
  DEFAULT_BREAK_END_TIME,
  DEFAULT_BREAK_START_TIME,
  DEFAULT_END_TIME,
  DEFAULT_GRACE_PERIOD_MINUTES,
  DEFAULT_START_TIME,
} = WORKING_SHIFT_FORM_RULES
const { SHIFT_FORM } = ATTENDANCE_MESSAGES

interface UseShiftFormOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IWorkingShift | null
}

/**
 * Manages working shift form validation, GPS coordinate bindings, and create/update mutations.
 * Encapsulates time conversion between minutes and HH:mm representation.
 */
export function useShiftForm({ open, onOpenChange, initialData }: UseShiftFormOptions) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      name: "",
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
      breakStartTime: DEFAULT_BREAK_START_TIME,
      breakEndTime: DEFAULT_BREAK_END_TIME,
      gracePeriodMinutes: String(DEFAULT_GRACE_PERIOD_MINUTES),
      gpsLat: MAP_INITIAL_CENTER.lat,
      gpsLng: MAP_INITIAL_CENTER.lng,
      gpsRadiusMeters: ATTENDANCE_GPS_RULES.DEFAULT_RADIUS_METERS,
      isActive: true,
    },
  })

  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const isPending = createMutation.isPending || updateMutation.isPending
  const gpsLat = useWatch({ control: form.control, name: "gpsLat" })
  const gpsLng = useWatch({ control: form.control, name: "gpsLng" })
  const gpsRadiusMeters = useWatch({ control: form.control, name: "gpsRadiusMeters" })

  const handleMapLocationChange = useCallback(
    (location: { lat: number; lng: number }) => {
      form.setValue("gpsLat", location.lat, { shouldDirty: true, shouldValidate: true })
      form.setValue("gpsLng", location.lng, { shouldDirty: true, shouldValidate: true })
    },
    [form],
  )

  useEffect(() => {
    if (!open) return
    if (initialData) {
      form.reset({
        name: initialData.name,
        startTime: minutesToTime(initialData.startTime),
        endTime: minutesToTime(initialData.endTime),
        breakStartTime:
          initialData.breakStartTime == null ? "" : minutesToTime(initialData.breakStartTime),
        breakEndTime:
          initialData.breakEndTime == null ? "" : minutesToTime(initialData.breakEndTime),
        gracePeriodMinutes: String(initialData.gracePeriodMinutes),
        gpsLat: initialData.gpsLat ?? undefined,
        gpsLng: initialData.gpsLng ?? undefined,
        gpsRadiusMeters: initialData.gpsRadiusMeters ?? undefined,
        isActive: initialData.isActive,
      })
    } else {
      form.reset({
        name: "",
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
        breakStartTime: DEFAULT_BREAK_START_TIME,
        breakEndTime: DEFAULT_BREAK_END_TIME,
        gracePeriodMinutes: String(DEFAULT_GRACE_PERIOD_MINUTES),
        gpsLat: MAP_INITIAL_CENTER.lat,
        gpsLng: MAP_INITIAL_CENTER.lng,
        gpsRadiusMeters: ATTENDANCE_GPS_RULES.DEFAULT_RADIUS_METERS,
        isActive: true,
      })
    }
  }, [open, initialData, form])

  const onSubmit = (values: ShiftFormValues) => {
    const hadGps = initialData?.gpsLat != null && initialData?.gpsLng != null
    const gps = buildGpsPayload(values, { isUpdate: Boolean(initialData), hadGps })

    const payload = {
      name: values.name,
      startTime: values.startTime,
      endTime: values.endTime,
      breakStartTime: values.breakStartTime || null,
      breakEndTime: values.breakEndTime || null,
      gracePeriodMinutes: parseInt(values.gracePeriodMinutes, 10) || 0,
      isActive: values.isActive,
      ...(gps !== undefined ? { gps } : {}),
    }

    const mutationOptions = {
      onSuccess: () => {
        toast.success(initialData ? SHIFT_FORM.UPDATE_SUCCESS : SHIFT_FORM.CREATE_SUCCESS)
        onOpenChange(false)
      },
      onError: (error: unknown) => {
        toast.error(
          getShiftMutationError(
            error,
            initialData ? SHIFT_FORM.UPDATE_ERROR : SHIFT_FORM.CREATE_ERROR,
          ),
        )
      },
    }

    if (initialData) {
      updateMutation.mutate({ id: initialData.id, ...payload }, mutationOptions)
    } else {
      createMutation.mutate(payload, mutationOptions)
    }
  }

  return {
    form,
    isPending,
    gpsLat,
    gpsLng,
    gpsRadiusMeters,
    handleMapLocationChange,
    onSubmit,
  }
}
