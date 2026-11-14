import { DAY_OF_WEEK_VALUES } from "@/config/entities/attendance.config"
import { useUpdateWeeklyScheduleSettings } from "@/hooks/attendance/use-weekly-schedule-settings"
import type { IWeeklyScheduleSettings } from "@/types/attendance.types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const weeklyScheduleSettingsSchema = z.object({
  triggerDayOfWeek: z.number().min(0).max(6),
  triggerHour: z.number().min(0).max(23),
  triggerMinute: z.number().min(0).max(59),
})

export type WeeklyScheduleSettingsFormValues = z.infer<typeof weeklyScheduleSettingsSchema>

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
      toast.error("Ngày kích hoạt không hợp lệ")
      return
    }

    try {
      await updateSettings(values)
      toast.success("Đã lưu cấu hình tự động sinh lịch tuần")
      form.reset(values)
      onSuccess?.()
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(error.response?.data?.error?.message ?? "Không thể lưu cấu hình lịch tuần")
    }
  }

  return {
    form,
    isPending,
    onSubmit: form.handleSubmit(onSubmit),
  }
}
