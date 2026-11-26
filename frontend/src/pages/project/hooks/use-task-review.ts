import { TASK_STATUS } from "@/config/entities/project.config"
import { taskApi } from "@/lib/api/task.api"
import type { Task, UpdateTaskDto } from "@/types/task.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { PROJECT_QUERY_KEY } from "../constants/gantt.constants"

interface UseTaskReviewProps {
  task: Task
  projectId: string
  onOpenChange: (open: boolean) => void
}

/**
 * Hook coordinating task completion submissions by assignees and approval/rejection reviews by leaders.
 */
export function useTaskReview({ task, projectId, onOpenChange }: UseTaskReviewProps) {
  const queryClient = useQueryClient()

  const [resultNotes, setResultNotes] = useState(task.resultNotes || "")

  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const [formError, setFormError] = useState<string | null>(null)

  const submitReviewMutation = useMutation({
    mutationFn: async (payload: UpdateTaskDto) => {
      return taskApi.update(task.id, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PROJECT_QUERY_KEY.GANTT, projectId] })
      void queryClient.invalidateQueries({
        queryKey: [PROJECT_QUERY_KEY.TASKS, PROJECT_QUERY_KEY.OVERVIEW, projectId],
      })
      toast.success("Đã cập nhật trạng thái công việc")
      onOpenChange(false)
    },
    onError: (err) => {
      setFormError(extractErrorMessage(err))
    },
  })

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    submitReviewMutation.mutate({
      status: TASK_STATUS.IN_REVIEW,
      resultUrl: null,
      resultNotes: resultNotes ? resultNotes.trim() : null,
      progress: 95,
    })
  }

  const handleApprove = () => {
    setFormError(null)
    submitReviewMutation.mutate({
      status: TASK_STATUS.DONE,
      progress: 100,
      rejectionReason: null,
    })
  }

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!rejectionReason.trim()) {
      setFormError("Vui lòng nhập lý do yêu cầu sửa đổi công việc")
      return
    }

    submitReviewMutation.mutate({
      status: TASK_STATUS.REOPENED,
      rejectionReason: rejectionReason.trim(),
      progress: 50,
    })
  }

  return {
    resultNotes,
    setResultNotes,
    isRejecting,
    setIsRejecting,
    rejectionReason,
    setRejectionReason,
    formError,
    setFormError,
    submitReviewMutation,
    handleSubmitWork,
    handleApprove,
    handleReject,
  }
}
