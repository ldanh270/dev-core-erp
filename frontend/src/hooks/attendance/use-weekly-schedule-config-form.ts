import { DAY_OF_WEEK_VALUES } from "@/config/entities/attendance.config"
import { ATTENDANCE_MESSAGES } from "@/config/messages/attendance.message"
import { useUpdateWeeklyScheduleSettings } from "@/hooks/attendance/use-weekly-schedule-settings"
import type { IWeeklyScheduleSettings } from "@/types/attendance.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const { WEEKLY_SCHEDULES: WEEKLY_SCHEDULE_MSGS } = ATTENDANCE_MESSAGES

export const weeklyScheduleSettingsSchema = z.object({
  triggerDayOfWeek: z.number().min(0).max(6),
  triggerHour: z.number().min(0).max(23),
  triggerMinute: z.number().min(0).max(59),
})

export type WeeklyScheduleSettingsFormValues = z.infer<typeof weeklyScheduleSettingsSchema>

/**
 * Manages automated weekly schedule generator settings form, day-of-week validation, and persistence.
 * Synchronizes trigger schedule parameters with backend recurring cron tasks.
 */
export function useWeeklyScheduleConfigForm({
  initialData,
  onSuccess,
}: {
  initialData: IWeeklyScheduleSettings
  onSuccess?: () => void
}) {
  const { mutateAsync: updateSettings, isPending } = useUpdateWeeklyScheduleSettings()

  const form = useForm<WeeklyScheduleSettingsFormValues>({
    resolver: zodResolver(weeklyScheduleSettingsSchema),
    defaultValues: {
      triggerDayOfWeek: initialData.triggerDayOfWeek,
      triggerHour: initialData.triggerHour,
      triggerMinute: initialData.triggerMinute,
    },
  })

  const onSubmit = async (values: WeeklyScheduleSettingsFormValues) => {
    if (
      !DAY_OF_WEEK_VALUES.includes(values.triggerDayOfWeek as (typeof DAY_OF_WEEK_VALUES)[number])
    ) {
      toast.error(WEEKLY_SCHEDULE_MSGS.CONFIG_INVALID_DAY)
      return
    }

    try {
      await updateSettings(values)
      toast.success(WEEKLY_SCHEDULE_MSGS.CONFIG_SAVE_SUCCESS)
      form.reset(values)
      onSuccess?.()
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(
        error.response?.data?.error?.message ?? WEEKLY_SCHEDULE_MSGS.CONFIG_SAVE_ERROR,
      )
    }
  }

  return {
    form,
    isPending,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
