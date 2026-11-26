import { PROJECT_STATUSES, TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import type { Project } from "@/types/project.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { startTransition, useEffect, useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const SELECT_NONE_VALUE = "none"

interface UseEditProjectFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  project: Project
  trackers: { code: string; name: string }[]
}

/**
 * Tier 1 Business Hook managing project update form state, validation, and mutations.
 */
export function useEditProjectForm({
  isOpen,
  onOpenChange,
  projectId,
  project,
  trackers,
}: UseEditProjectFormProps) {
  const queryClient = useQueryClient()

  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDesc, setEditProjectDesc] = useState("")
  const [editProjectStatus, setEditProjectStatus] = useState("")
  const [editProjectPolicy, setEditProjectPolicy] = useState("")
  const [editProjectLeader, setEditProjectLeader] = useState(SELECT_NONE_VALUE)
  const [editProjectStart, setEditProjectStart] = useState("")
  const [editProjectEnd, setEditProjectEnd] = useState("")
  const [editProjectDealTarget, setEditProjectDealTarget] = useState("")
  const [editProjectTrackers, setEditProjectTrackers] = useState<string[]>([])
  const [tempTrackers, setTempTrackers] = useState<string[]>([])
  const [editProjectError, setEditProjectError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    if (isOpen && project && trackers.length > 0) {
      startTransition(() => {
        setEditProjectName(project.name)
        setEditProjectDesc(project.description || "")
        setEditProjectStatus(project.status)
        setEditProjectPolicy(project.taskCreationPolicy)
        setEditProjectLeader(project.teamLeaderId || SELECT_NONE_VALUE)
        setEditProjectStart(
          project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        )
        setEditProjectEnd(
          project.expectedEndDate
            ? new Date(project.expectedEndDate).toISOString().split("T")[0]
            : "",
        )
        setEditProjectDealTarget(
          project.dealTargetPercent != null ? String(project.dealTargetPercent) : "",
        )
        const initialTrackers =
          project.allowedTaskTrackers && project.allowedTaskTrackers.length > 0
            ? project.allowedTaskTrackers
            : trackers.map((t) => t.code)
        setEditProjectTrackers(initialTrackers)
        setEditProjectError(null)
      })
    }
  }, [isOpen, project, trackers])

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      if (!editProjectName.trim()) {
        throw new Error("Vui lòng nhập tên dự án")
      }
      if (editProjectStart && editProjectEnd) {
        const start = new Date(editProjectStart)
        const end = new Date(editProjectEnd)
        if (start > end) {
          throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến")
        }
      }
      return projectApi.update(projectId, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim() || null,
        status: editProjectStatus as (typeof PROJECT_STATUSES)[number],
        taskCreationPolicy: editProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        teamLeaderId: editProjectLeader === SELECT_NONE_VALUE ? null : editProjectLeader,
        startDate: editProjectStart || null,
        expectedEndDate: editProjectEnd || null,
        allowedTaskTrackers: editProjectTrackers,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      setEditProjectError(null)
      toast.success("Cập nhật thông tin dự án thành công")
    },
    onError: (err: unknown) => {
      setEditProjectError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditProjectError(null)
    if (editProjectTrackers.length === 0) {
      setEditProjectError("Vui lòng chọn ít nhất 1 loại yêu cầu.")
      return
    }
    updateProjectMutation.mutate()
  }

  const handleClose = () => {
    setEditProjectError(null)
    onOpenChange(false)
  }

  return {
    editProjectName,
    setEditProjectName,
    editProjectDesc,
    setEditProjectDesc,
    editProjectStatus,
    setEditProjectStatus,
    editProjectPolicy,
    setEditProjectPolicy,
    editProjectLeader,
    setEditProjectLeader,
    editProjectStart,
    setEditProjectStart,
    editProjectEnd,
    setEditProjectEnd,
    editProjectDealTarget,
    editProjectTrackers,
    setEditProjectTrackers,
    tempTrackers,
    setTempTrackers,
    editProjectError,
    isDropdownOpen,
    setIsDropdownOpen,
    isPending: updateProjectMutation.isPending,
    handleSubmit,
    handleClose,
  }
}
