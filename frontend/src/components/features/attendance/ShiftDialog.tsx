import { TimePicker } from "@/components/common"
import { FormActionFooter } from "@/components/common/form-action-footer"
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
import { ATTENDANCE_GPS_RULES, WORKING_SHIFT_FORM_RULES } from "@/config/rules/attendance.config"
import { useShiftForm } from "@/hooks/attendance/use-shift-form"
import type { ShiftFormValues } from "@/schemas/attendance.schema"
import type { IWorkingShift } from "@/types/attendance.types"

import { Clock, Info, MapPin } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

const { MAX_GRACE_PERIOD_MINUTES, MIN_GRACE_PERIOD_MINUTES } = WORKING_SHIFT_FORM_RULES
const { MIN_GEOFENCE_RADIUS_METERS } = ATTENDANCE_GPS_RULES

function ShiftBasicInfoSection({ form }: { form: UseFormReturn<ShiftFormValues> }) {
  return (
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
                <TimePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="h-11"
                  placeholder="--:--"
                />
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
                <TimePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="h-11"
                  placeholder="--:--"
                />
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
                <TimePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="h-11"
                  placeholder="--:--"
                />
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
                <TimePicker
                  value={field.value}
                  onChange={field.onChange}
                  className="h-11"
                  placeholder="--:--"
                />
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
  )
}

function ShiftGpsSection({
  form,
  gpsLat,
  gpsLng,
  gpsRadiusMeters,
  onMapLocationChange,
}: {
  form: UseFormReturn<ShiftFormValues>
  gpsLat?: number
  gpsLng?: number
  gpsRadiusMeters?: number
  onMapLocationChange: (location: { lat: number; lng: number }) => void
}) {
  return (
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
                  onChange={(e) => {
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }}
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
                  onChange={(e) => {
                    field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                  }}
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
        onChange={onMapLocationChange}
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
                onChange={(e) => {
                  field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export interface ShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IWorkingShift | null
}

/**
 * Modal dialog presenter for creating and editing company working shift definitions.
 * Coordinates basic timing inputs, break schedules, and interactive GPS geofencing configuration.
 */
export function ShiftDialog({ open, onOpenChange, initialData }: ShiftDialogProps) {
  const { form, isPending, gpsLat, gpsLng, gpsRadiusMeters, handleMapLocationChange, onSubmit } =
    useShiftForm({ open, onOpenChange, initialData })

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
            <ShiftBasicInfoSection form={form} />
            <Separator />
            <ShiftGpsSection
              form={form}
              gpsLat={gpsLat}
              gpsLng={gpsLng}
              gpsRadiusMeters={gpsRadiusMeters}
              onMapLocationChange={handleMapLocationChange}
            />
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
