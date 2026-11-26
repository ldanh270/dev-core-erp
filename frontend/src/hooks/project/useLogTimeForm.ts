import {
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_WORK_TIME_TYPE,
} from "@/config/entities/project.config"
import { taskApi } from "@/lib/api/task.api"
import type { SpentTime, SpentTimeActivity, SpentTimeWorkTimeType } from "@/types/spent-time.types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startTransition, useEffect, useState } from "react"

interface UseLogTimeFormParams {
  open: boolean
  taskId: string
  spentTime?: SpentTime
  estimatedTime?: number | null
  loggedHours?: number
  onSuccess?: () => void
  onOpenChange: (open: boolean) => void
}

/**
 * Tier 1 Business Hook managing state, validation, and mutation for logging task time.
 */
export function useLogTimeForm({
  open,
  taskId,
  spentTime,
  estimatedTime,
  loggedHours = 0,
  onSuccess,
  onOpenChange,
}: UseLogTimeFormParams) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [hours, setHours] = useState("")
  const [activity, setActivity] = useState<SpentTimeActivity>(SPENT_TIME_ACTIVITY.DEVELOP)
  const [workTimeType, setWorkTimeType] = useState<SpentTimeWorkTimeType>(
    SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
  )
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      startTransition(() => {
        if (spentTime) {
          setDate(new Date(spentTime.date).toISOString().split("T")[0])
          setHours(String(spentTime.hours))
          setActivity(spentTime.activity)
          setWorkTimeType(spentTime.workTimeType)
          setComment(spentTime.comment || "")
        } else {
          setDate(new Date().toISOString().split("T")[0])
          setHours("")
          setActivity(SPENT_TIME_ACTIVITY.DEVELOP)
          setWorkTimeType(SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY)
          setComment("")
        }
        setError(null)
      })
    }
  }, [open, spentTime])

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedHours = parseFloat(hours)
      if (isNaN(parsedHours) || parsedHours <= 0) {
        throw new Error("Số giờ phải lớn hơn 0")
      }
      if (spentTime) {
        return taskApi.updateSpentTime(spentTime.id, {
          date,
          hours: parsedHours,
          activity,
          workTimeType,
          comment: comment.trim() || null,
        })
      } else {
        return taskApi.logSpentTime({
          taskId,
          date,
          hours: parsedHours,
          activity,
          workTimeType,
          comment: comment.trim() || null,
        })
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spentTimes", taskId] })
      void queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      void queryClient.invalidateQueries({ queryKey: ["project"] })
      onOpenChange(false)
      setHours("")
      setComment("")
      setError(null)
      if (onSuccess) onSuccess()
    },
    onError: (err: unknown) => {
      let message = "Đã xảy ra lỗi"
      if (err instanceof Error) {
        message = err.message
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
        if (axiosErr.response?.data?.error?.message) {
          message = axiosErr.response.data.error.message
        }
      }
      setError(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!hours) {
      setError("Vui lòng nhập số giờ làm việc")
      return
    }
    mutation.mutate()
  }

  const parsedHours = parseFloat(hours)
  const remainingEstimate =
    estimatedTime != null && !Number.isNaN(parsedHours)
      ? estimatedTime - loggedHours + (spentTime?.hours ?? 0) - parsedHours
      : null

  return {
    date,
    setDate,
    hours,
    setHours,
    activity,
    setActivity,
    workTimeType,
    setWorkTimeType,
    comment,
    setComment,
    error,
    remainingEstimate,
    isPending: mutation.isPending,
    handleSubmit,
  }
}
