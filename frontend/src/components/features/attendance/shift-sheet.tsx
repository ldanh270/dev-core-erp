import { FormActionFooter } from "@/components/common/form-action-footer"
import { TimePicker } from "@/components/common"
import { GpsMapPicker } from "@/components/features/attendance/gps-map-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { MAP_INITIAL_CENTER } from "@/config/map.config"
import { ATTENDANCE_GPS_RULES, WORKING_SHIFT_FORM_RULES } from "@/config/rules/attendance.config"
import { useCreateShift, useUpdateShift } from "@/hooks/attendance/use-shifts"
import { minutesToTime } from "@/lib/utils"
import type { IGpsConfig, IWorkingShift } from "@/types/attendance.types"

import { useCallback, useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { isAxiosError } from "axios"
import { Clock, Info, MapPin } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

// Min radius synced with backend ATTENDANCE_GPS_RULES — used by full-time + onsite PT geofence.
const { MIN_GEOFENCE_RADIUS_METERS } = ATTENDANCE_GPS_RULES
const {
  DEFAULT_BREAK_END_TIME,
  DEFAULT_BREAK_START_TIME,
  DEFAULT_END_TIME,
  DEFAULT_GRACE_PERIOD_MINUTES,
  DEFAULT_START_TIME,
  MAX_GRACE_PERIOD_MINUTES,
  MIN_GRACE_PERIOD_MINUTES,
  TIME_INPUT_PATTERN,
} = WORKING_SHIFT_FORM_RULES
const { SHIFT_FORM } = ATTENDANCE_MESSAGES

const formSchema = z
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
    // Empty/empty means this shift has no unpaid break; half-filled input is invalid.
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

type FormValues = z.infer<typeof formSchema>

/** Extracts API error message for shift create/update toasts. */
function getShiftMutationError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  return error.response?.data?.error?.message ?? error.response?.data?.message ?? fallback
}

/** Builds GPS payload — null clears geofence on update; undefined leaves it unchanged. */
function buildGpsPayload(
  values: FormValues,
  options: { isUpdate: boolean; hadGps: boolean },
): IGpsConfig | null | undefined {
  const { gpsLat, gpsLng, gpsRadiusMeters } = values
  if (gpsLat != null && gpsLng != null && gpsRadiusMeters != null) {
    return { lat: gpsLat, lng: gpsLng, radiusMeters: gpsRadiusMeters }
  }
  if (options.isUpdate && options.hadGps) return null
  return undefined
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IWorkingShift | null
}

/**
 * Component that displays a dialog to create or update working shift information.
 * @param props - Component properties including open state, onOpenChange handler, and initial data (if any).
 */
export function ShiftDialog({ open, onOpenChange, initialData }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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

  const onSubmit = (values: FormValues) => {
    const hadGps = initialData?.gpsLat != null && initialData?.gpsLng != null
    const gps = buildGpsPayload(values, { isUpdate: Boolean(initialData), hadGps })

    // API uses null/null to explicitly represent a shift without an unpaid break.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto bg-popover rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData ? "Update Working Shift" : "Create New Shift"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Edit shift details and apply system changes."
              : "Define a new working shift with timing and GPS rules."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <Info size={16} />
                <span>Basic Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="breakStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bắt đầu nghỉ</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} className="h-11" placeholder="--:--" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breakEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kết thúc nghỉ</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} className="h-11" placeholder="--:--" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Shift Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Morning Shift, Office Hours..."
                        className="h-11 rounded-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        Start Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} className="h-11" placeholder="--:--" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock size={14} className="text-muted-foreground" />
                        End Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} className="h-11" placeholder="--:--" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="gracePeriodMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grace Period (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={MIN_GRACE_PERIOD_MINUTES}
                          max={MAX_GRACE_PERIOD_MINUTES}
                          className="h-11 rounded-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50 h-11">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Activate Shift</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* GPS Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <MapPin size={16} />
                <span>GPS Configuration (Optional)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gpsLat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="10.7769"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gpsLng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="106.7009"
                          className="h-11"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <GpsMapPicker
                lat={gpsLat}
                lng={gpsLng}
                radiusMeters={gpsRadiusMeters}
                onChange={handleMapLocationChange}
              />

              <FormField
                control={form.control}
                name="gpsRadiusMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed Radius (meters)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={MIN_GEOFENCE_RADIUS_METERS}
                        placeholder="e.g., 100, 200..."
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormActionFooter
              onCancel={() => {
                onOpenChange(false)
              }}
              submitLabel={initialData ? "Save Changes" : "Create Shift"}
              isPending={isPending}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftDialog
