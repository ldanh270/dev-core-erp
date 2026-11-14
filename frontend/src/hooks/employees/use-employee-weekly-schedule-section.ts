import {
  useApplyWeeklyScheduleTemplate,
  useWeeklyScheduleTemplates,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import { schedulesApi } from "@/lib/api/attendance.api"
import { formatDateParam } from "@/utils/attendance/format-date-param"

import { useEffect, useMemo } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const scheduleSchema = z.object({
  templateId: z.string().min(1, "Vui lòng chọn template lịch tuần"),
})

export type EmployeeWeeklyScheduleFormValues = z.infer<typeof scheduleSchema>

export function useEmployeeWeeklyScheduleSection(employeeId: string | undefined, isOpen: boolean) {
  const { data: templates = [] } = useWeeklyScheduleTemplates()
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.isActive),
    [templates],
  )

  const { data: activeSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["employee-schedule", employeeId, "config"],
    queryFn: () => {
      if (!employeeId) {
        throw new Error("Employee id is required")
      }
      return schedulesApi.getByEmployee(employeeId)
    },
    enabled: Boolean(employeeId) && isOpen,
  })

  const applyMutation = useApplyWeeklyScheduleTemplate()

  const form = useForm<EmployeeWeeklyScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      templateId: "",
    },
  })

  const { reset, formState } = form

  useEffect(() => {
    if (!isOpen || !employeeId) return

    reset({
      templateId: activeSchedule?.templateId ?? "",
    })
  }, [activeSchedule, employeeId, isOpen, reset])

  const initialTemplateId = activeSchedule?.templateId ?? ""

  const applyIfNeeded = async (): Promise<boolean> => {
    const values = form.getValues()
    if (!employeeId || !values.templateId) return false

    if (values.templateId === initialTemplateId) return false

    const parsed = scheduleSchema.safeParse(values)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Thông tin lịch tuần không hợp lệ"
      toast.error(firstIssue)
      throw new Error(firstIssue)
    }

    await applyMutation.mutateAsync({
      templateId: parsed.data.templateId,
      employeeIds: [employeeId],
      validFrom: formatDateParam(new Date()),
      validTo: null,
      generateShifts: false,
    })

    reset(values)
    return true
  }

  const selectedTemplate = activeTemplates.find(
    (template) => template.id === form.watch("templateId"),
  )

  return {
    form,
    activeTemplates,
    selectedTemplate,
    activeSchedule,
    isScheduleLoading,
    isPending: applyMutation.isPending,
    isDirty: formState.isDirty,
    applyIfNeeded,
  }
}
