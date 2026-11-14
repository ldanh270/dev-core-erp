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

export function useTaskReview({ task, projectId, onOpenChange }: UseTaskReviewProps) {
  const queryClient = useQueryClient()

  // Form states for employee submitting work
  const [resultNotes, setResultNotes] = useState(task.resultNotes || "")

  // Rejection states for leader reviewing work
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const [formError, setFormError] = useState<string | null>(null)

  // Task update mutation
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

  // Employee submitting task for review
  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    submitReviewMutation.mutate({
      status: TASK_STATUS.IN_REVIEW,
      resultUrl: null, // Clear resultUrl as it is removed from UI
      resultNotes: resultNotes ? resultNotes.trim() : null,
      progress: 95, // Automatically sets progress to 95% when awaiting review
    })
  }

  // Leader approving task completion
  const handleApprove = () => {
    setFormError(null)
    submitReviewMutation.mutate({
      status: TASK_STATUS.DONE,
      progress: 100,
      rejectionReason: null, // Clear any previous rejection reason
    })
  }

  // Leader rejecting and requesting modifications
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
      progress: 50, // Shunts progress back to 50% for correction
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
