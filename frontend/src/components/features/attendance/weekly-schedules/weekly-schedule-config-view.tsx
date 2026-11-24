import { SettingsPageLayout } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form-ui"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SchedulePreviewBadge,
  TriggerDayOfWeekField,
  TriggerTimeField,
  WeeklyScheduleConfigContextPanel,
} from "@/components/features/attendance/weekly-schedules/weekly-schedule-config-fields"
import { ROUTES } from "@/config/routes.config"
import {
  type WeeklyScheduleSettingsFormValues,
} from "@/hooks/attendance/use-weekly-schedule-config-form"
import type { UseFormReturn } from "react-hook-form"

/**
 * Skeleton loading presenter for weekly schedule config settings.
 */
export function WeeklyScheduleConfigSkeleton() {
  return (
    <SettingsPageLayout
      title="Cấu hình lịch tuần"
      description="Thiết lập thời điểm hệ thống tự động sinh ca làm việc cho tuần hiện tại."
      backHref={ROUTES.ATTENDANCE.WEEKLY_SCHEDULES}
      contextPanel={
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
      }
    >
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </SettingsPageLayout>
  )
}

interface WeeklyScheduleConfigViewProps {
  form: UseFormReturn<WeeklyScheduleSettingsFormValues>
  isPending: boolean
  isDirty: boolean
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  onCancel: () => void
}

/**
 * Pure UI presenter rendering the entire weekly schedule configuration form layout.
 * Encapsulates form element structure, layout container, action buttons, and pill styling.
 */
export function WeeklyScheduleConfigView({
  form,
  isPending,
  isDirty,
  onSubmit,
  onCancel,
}: WeeklyScheduleConfigViewProps) {
  return (
    <SettingsPageLayout
      title="Cấu hình lịch tuần"
      description="Thiết lập thời điểm hệ thống tự động sinh ca làm việc cho tuần hiện tại."
      backHref={ROUTES.ATTENDANCE.WEEKLY_SCHEDULES}
      contextPanel={<WeeklyScheduleConfigContextPanel />}
    >
      <Form {...form}>
        <form id="weekly-schedule-config-form" onSubmit={onSubmit} className="w-full space-y-6">
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

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-6 font-semibold shadow-xs cursor-pointer"
              onClick={onCancel}
            >
              Huỷ bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-full px-8 font-semibold shadow-xs cursor-pointer"
              disabled={isPending || !isDirty}
            >
              {isPending ? "Đang xử lý..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsPageLayout>
  )
}
