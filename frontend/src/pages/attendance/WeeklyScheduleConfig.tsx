import {
  WeeklyScheduleConfigSkeleton,
  WeeklyScheduleConfigView,
} from "@/components/features/attendance/weekly-schedules/weekly-schedule-config-view"
import { ROUTES } from "@/config/routes.config"
import { useWeeklyScheduleConfigForm } from "@/hooks/attendance/use-weekly-schedule-config-form"
import { useWeeklyScheduleSettings } from "@/hooks/attendance/use-weekly-schedule-settings"
import { routerNavigate } from "@/lib/router-navigator"

/**
 * WeeklyScheduleConfig Page Orchestrator.
 * Pure composition shell connecting hooks with WeeklyScheduleConfigView presenter.
 */
export default function WeeklyScheduleConfig() {
  const { data: settings, isLoading } = useWeeklyScheduleSettings()

  if (isLoading || !settings) {
    return <WeeklyScheduleConfigSkeleton />
  }

  return <WeeklyScheduleConfigContent settings={settings} />
}

function WeeklyScheduleConfigContent({
  settings,
}: {
  settings: NonNullable<ReturnType<typeof useWeeklyScheduleSettings>["data"]>
}) {
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
    <WeeklyScheduleConfigView
      form={form}
      isPending={isPending}
      isDirty={isDirty}
      onSubmit={onSubmit}
      onCancel={handleCancel}
    />
  )
}
