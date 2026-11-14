import { PageContainer, PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DAY_OF_WEEK_FULL_LABELS,
  DAY_OF_WEEK_VALUES,
  getDayOfWeekFullLabel,
} from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import {
  type WeeklyScheduleSettingsFormValues,
  useWeeklyScheduleConfigForm,
} from "@/hooks/attendance/use-weekly-schedule-config-form"
import { useWeeklyScheduleSettings } from "@/hooks/attendance/use-weekly-schedule-settings"
import { routerNavigate } from "@/lib/router-navigator"
import type { IWeeklyScheduleSettings } from "@/types/attendance.types"

import { CalendarClock, Info, Settings2 } from "lucide-react"
import { type Control, useWatch } from "react-hook-form"

function ConfigContextPanel() {
  return (
    <div className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-6 md:p-8 flex flex-col gap-6">
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

function SchedulePreviewBadge({ control }: { control: Control<WeeklyScheduleSettingsFormValues> }) {
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

function TriggerTimeField({ control }: { control: Control<WeeklyScheduleSettingsFormValues> }) {
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

function TriggerDayOfWeekField({
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

function WeeklyScheduleConfigSkeleton() {
  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Cấu hình lịch tuần"
        description="Thiết lập thời điểm hệ thống tự động sinh ca làm việc cho tuần hiện tại."
        backHref={ROUTES.ATTENDANCE.WEEKLY_SCHEDULES}
        backLabel="Lịch hàng tuần"
      />
      <Card className="w-full rounded-xl border-border overflow-hidden p-0">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-6 md:p-8">
            <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
            <Skeleton className="h-4 w-full mb-2 rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </div>
          <div className="flex-1 p-6 md:p-8 lg:p-10">
            <Skeleton className="h-8 w-1/3 mb-8 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}

function WeeklyScheduleConfigForm({ settings }: { settings: IWeeklyScheduleSettings }) {
  const { form, isPending, onSubmit } = useWeeklyScheduleConfigForm({
    initialData: settings,
  })

  const isDirty = form.formState.isDirty

  const handleCancel = () => {
    form.reset({
      triggerDayOfWeek: settings.triggerDayOfWeek,
      triggerHour: settings.triggerHour,
      triggerMinute: settings.triggerMinute,
    })
    routerNavigate(ROUTES.ATTENDANCE.WEEKLY_SCHEDULES)
  }

  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Cấu hình lịch tuần"
        description="Thiết lập thời điểm hệ thống tự động sinh ca làm việc cho tuần hiện tại."
        backHref={ROUTES.ATTENDANCE.WEEKLY_SCHEDULES}
        backLabel="Lịch hàng tuần"
      />

      <Form {...form}>
        <form id="weekly-schedule-config-form" onSubmit={onSubmit} className="w-full">
          <Card className="w-full rounded-xl shadow-xs border-border overflow-hidden p-0">
            <div className="flex flex-col lg:flex-row">
              <ConfigContextPanel />

              <div className="flex-1 bg-background p-6 md:p-8 lg:p-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-lg font-medium tracking-tight">Chi tiết lịch trình</h3>
                    <SchedulePreviewBadge control={form.control} />
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TriggerDayOfWeekField control={form.control} />
                    <TriggerTimeField control={form.control} />
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Card Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/10 px-6 md:px-8 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-6 font-semibold shadow-xs"
                onClick={handleCancel}
              >
                Huỷ bỏ
              </Button>
              <Button
                type="submit"
                className="rounded-full px-8 font-semibold shadow-xs"
                disabled={isPending || !isDirty}
              >
                {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </PageContainer>
  )
}

export default function WeeklyScheduleConfig() {
  const { data: settings, isLoading } = useWeeklyScheduleSettings()

  if (isLoading || !settings) {
    return <WeeklyScheduleConfigSkeleton />
  }

  return <WeeklyScheduleConfigForm settings={settings} />
}
