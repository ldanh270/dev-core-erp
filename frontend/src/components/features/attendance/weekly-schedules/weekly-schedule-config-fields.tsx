import { Badge } from "@/components/ui/badge"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DAY_OF_WEEK_FULL_LABELS,
  DAY_OF_WEEK_VALUES,
  getDayOfWeekFullLabel,
} from "@/config/entities/attendance.config"
import type { WeeklyScheduleSettingsFormValues } from "@/hooks/attendance/use-weekly-schedule-config-form"

import { CalendarClock, Info, Settings2 } from "lucide-react"
import { type Control, useWatch } from "react-hook-form"

/**
 * Context explanatory panel for weekly schedule automated run settings.
 */
export function WeeklyScheduleConfigContextPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings2 className="size-4 text-primary" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-medium tracking-tight">Cấu hình hệ thống</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Thiết lập thời điểm hệ thống tự động sinh ca làm việc cho tuần hiện tại. Nhân viên đã được
          gán template lịch tuần sẽ được xử lý tự động.
        </p>
      </div>

      <Separator className="bg-border/50" />

      <div className="flex items-start gap-3">
        <CalendarClock className="size-4 text-muted-foreground mt-0.5" strokeWidth={2} />
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="text-sm font-medium text-foreground">Tự động hóa</h4>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  Job chạy nền mỗi phút. Khi đúng thứ và giờ đã cấu hình, hệ thống sinh ca từ thứ đó
                  đến hết tuần (7 ngày).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gán template cho từng nhân viên trong hồ sơ nhân sự. Trang này chỉ cấu hình lịch chạy tự
            động.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Select field for day-of-week automated generation trigger.
 */
export function TriggerDayOfWeekField({
  control,
}: {
  control: Control<WeeklyScheduleSettingsFormValues>
}) {
  return (
    <FormField
      control={control}
      name="triggerDayOfWeek"
      render={({ field }) => (
        <FormItem className="space-y-4">
          <div className="space-y-1">
            <FormLabel className="text-sm font-medium text-foreground">Ngày kích hoạt</FormLabel>
            <FormDescription className="text-xs leading-relaxed max-w-md">
              Thứ trong tuần hệ thống tự sinh ca. Đúng giờ đã chọn sẽ tự động tạo lịch cả tuần.
            </FormDescription>
          </div>
          <Select
            onValueChange={(val) => {
              field.onChange(Number(val))
            }}
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger className="w-full max-w-xs rounded-full border-border h-10 shadow-xs">
                <SelectValue placeholder="Chọn thứ trong tuần" />
              </SelectTrigger>
            </FormControl>
            <SelectContent position="popper" className="max-h-64 rounded-xl">
              {DAY_OF_WEEK_VALUES.map((day) => (
                <SelectItem key={day} value={day.toString()} className="rounded-lg">
                  {DAY_OF_WEEK_FULL_LABELS.get(day)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/**
 * Time selection fields for exact automated schedule generation hour & minute.
 */
export function TriggerTimeField({
  control,
}: {
  control: Control<WeeklyScheduleSettingsFormValues>
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <FormLabel className="text-sm font-medium text-foreground block">
          Thời gian chính xác
        </FormLabel>
        <FormDescription className="text-xs max-w-sm leading-relaxed">
          Nên chọn thời điểm ngoài giờ hành chính (ví dụ 07:00 sáng Thứ Hai) để sinh lịch trước ca
          làm việc.
        </FormDescription>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <FormField
          control={control}
          name="triggerHour"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-28 rounded-full border-border h-10 shadow-xs">
                    <SelectValue placeholder="Giờ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg">
                      {i.toString().padStart(2, "0")} Giờ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <span className="text-muted-foreground font-medium pb-2">:</span>
        <FormField
          control={control}
          name="triggerMinute"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={(val) => {
                  field.onChange(Number(val))
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger className="w-28 rounded-full border-border h-10 shadow-xs">
                    <SelectValue placeholder="Phút" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent position="popper" className="max-h-64 rounded-xl">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} className="rounded-lg">
                      {i.toString().padStart(2, "0")} Phút
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

/**
 * Preview badge reflecting the live trigger schedule human-readable label.
 */
export function SchedulePreviewBadge({
  control,
}: {
  control: Control<WeeklyScheduleSettingsFormValues>
}) {
  const triggerDayOfWeek = useWatch({ control, name: "triggerDayOfWeek" })
  const triggerHour = useWatch({ control, name: "triggerHour" })
  const triggerMinute = useWatch({ control, name: "triggerMinute" })

  const dayLabel = triggerDayOfWeek !== undefined ? getDayOfWeekFullLabel(triggerDayOfWeek) : "..."

  return (
    <Badge
      variant="secondary"
      className="font-normal text-xs px-3.5 py-1 bg-primary/5 text-primary border-primary/10 rounded-full"
    >
      Kích hoạt {dayLabel} hàng tuần lúc {triggerHour?.toString().padStart(2, "0") || "00"}:
      {triggerMinute?.toString().padStart(2, "0") || "00"}
    </Badge>
  )
}
