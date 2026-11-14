import { weeklyScheduleTemplatesApi } from "@/lib/api/attendance.api"
import type {
  IApplyWeeklyScheduleTemplatePayload,
  ICreateWeeklyScheduleTemplatePayload,
  IUpdateWeeklyScheduleTemplatePayload,
} from "@/types/attendance.types"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const WEEKLY_SCHEDULE_TEMPLATES_KEY = ["weekly-schedule-templates"] as const

export function useWeeklyScheduleTemplates() {
  return useQuery({
    queryKey: WEEKLY_SCHEDULE_TEMPLATES_KEY,
    queryFn: weeklyScheduleTemplatesApi.getAll,
  })
}

export function useWeeklyScheduleTemplate(id: string | null) {
  return useQuery({
    queryKey: [...WEEKLY_SCHEDULE_TEMPLATES_KEY, id],
    queryFn: () => {
      if (!id) {
        throw new Error("Template id is required")
      }
      return weeklyScheduleTemplatesApi.getById(id)
    },
    enabled: Boolean(id),
  })
}

export function useCreateWeeklyScheduleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ICreateWeeklyScheduleTemplatePayload) =>
      weeklyScheduleTemplatesApi.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEEKLY_SCHEDULE_TEMPLATES_KEY })
    },
  })
}

export function useUpdateWeeklyScheduleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: IUpdateWeeklyScheduleTemplatePayload & { id: string }) =>
      weeklyScheduleTemplatesApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEEKLY_SCHEDULE_TEMPLATES_KEY })
    },
  })
}

export function useDeleteWeeklyScheduleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => weeklyScheduleTemplatesApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEEKLY_SCHEDULE_TEMPLATES_KEY })
    },
  })
}

export function useApplyWeeklyScheduleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      templateId,
      ...data
    }: IApplyWeeklyScheduleTemplatePayload & { templateId: string }) =>
      weeklyScheduleTemplatesApi.apply(templateId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WEEKLY_SCHEDULE_TEMPLATES_KEY })
      void qc.invalidateQueries({ queryKey: ["employee-schedule"] })
      void qc.invalidateQueries({ queryKey: ["my-schedule"] })
    },
  })
}
