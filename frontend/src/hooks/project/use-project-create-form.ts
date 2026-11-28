import { TASK_CREATION_POLICIES } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import { extractErrorMessage } from "@/utils/error-helper"

import React, { useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface UseProjectCreateFormProps {
  onClose: () => void
}

/**
 * Tier 1 Business Hook managing state, field validation, and mutation for creating new projects.
 */
export function useProjectCreateForm({ onClose }: UseProjectCreateFormProps) {
  const queryClient = useQueryClient()

  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [newProjectTech, setNewProjectTech] = useState("")
  const [newProjectLeader, setNewProjectLeader] = useState("none")
  const [newProjectPolicy, setNewProjectPolicy] = useState("all_members")
  const [newProjectStart, setNewProjectStart] = useState("")
  const [newProjectEnd, setNewProjectEnd] = useState("")
  const [newProjectDealTarget, setNewProjectDealTarget] = useState("")
  const [newProjectTrackers, setNewProjectTrackers] = useState<string[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false)

  const resetForm = () => {
    setNewProjectName("")
    setNewProjectDesc("")
    setNewProjectTech("")
    setNewProjectLeader("none")
    setNewProjectPolicy("all_members")
    setNewProjectStart("")
    setNewProjectEnd("")
    setNewProjectDealTarget("")
    setNewProjectTrackers([])
    setCreateError(null)
    setIsCreateDropdownOpen(false)
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const techStack = newProjectTech
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      if (newProjectStart && newProjectEnd) {
        const start = new Date(newProjectStart)
        const end = new Date(newProjectEnd)
        if (start > end) {
          throw new Error("Ngày bắt đầu không được lớn hơn ngày kết thúc dự kiến")
        }
      }

      return projectApi.create({
        name: newProjectName,
        description: newProjectDesc.trim() || null,
        techStack,
        status: "planning",
        taskCreationPolicy: newProjectPolicy as (typeof TASK_CREATION_POLICIES)[number],
        startDate: newProjectStart || null,
        expectedEndDate: newProjectEnd || null,
        dealTargetPercent: newProjectDealTarget ? Number(newProjectDealTarget) : null,
        teamLeaderId: newProjectLeader === "none" ? null : newProjectLeader,
        allowedTaskTrackers: newProjectTrackers,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] })
      resetForm()
      onClose()
    },
    onError: (err: unknown) => {
      setCreateError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!newProjectName.trim()) {
      setCreateError("Vui lòng nhập tên dự án")
      return
    }
    createMutation.mutate()
  }

  const handleModalClose = () => {
    resetForm()
    onClose()
  }

  const toggleTracker = (trackerKey: string) => {
    setNewProjectTrackers((prev) =>
      prev.includes(trackerKey) ? prev.filter((k) => k !== trackerKey) : [...prev, trackerKey],
    )
  }

  const selectAllTrackers = (keys: string[]) => {
    setNewProjectTrackers(keys)
  }

  const clearAllTrackers = () => {
    setNewProjectTrackers([])
  }

  return {
    newProjectName,
    setNewProjectName,
    newProjectDesc,
    setNewProjectDesc,
    newProjectTech,
    setNewProjectTech,
    newProjectLeader,
    setNewProjectLeader,
    newProjectPolicy,
    setNewProjectPolicy,
    newProjectStart,
    setNewProjectStart,
    newProjectEnd,
    setNewProjectEnd,
    newProjectDealTarget,
    setNewProjectDealTarget,
    newProjectTrackers,
    createError,
    isCreateDropdownOpen,
    setIsCreateDropdownOpen,
    isPending: createMutation.isPending,
    handleSubmit,
    handleModalClose,
    toggleTracker,
    selectAllTrackers,
    clearAllTrackers,
  }
}
