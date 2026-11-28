import { usePermission } from "@/hooks/use-permission"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { usePostingKanban } from "./use-posting-kanban"
import { useRequisitionKanban } from "./use-requisition-kanban"

export interface UseKanbanManagementOptions {
  givenPostingId?: string
  requisitionId?: string
}

/**
 * Tier 1 Business Hook managing state, permissions, search params, and active board selection
 * for the recruitment Kanban workspace.
 */
export function useKanbanManagement({
  givenPostingId,
  requisitionId = "",
}: UseKanbanManagementOptions = {}) {
  const [searchParams] = useSearchParams()
  const postingId = givenPostingId ?? searchParams.get("postingId") ?? ""
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const { hasPermission } = usePermission()
  const canManage = hasPermission("recruitment.posting.manage")

  const postingBoard = usePostingKanban(postingId, canManage)
  const requisitionBoard = useRequisitionKanban(requisitionId, canManage)
  const board = requisitionId ? requisitionBoard : postingBoard

  const hasTarget = Boolean(postingId || requisitionId)

  const handleOpenAddColumn = () => {
    board.resetForm()
    board.setIsAddColumnOpen(true)
  }

  return {
    postingId,
    requisitionId,
    hasTarget,
    selectedApplicationId,
    setSelectedApplicationId,
    board,
    handleOpenAddColumn,
  }
}
