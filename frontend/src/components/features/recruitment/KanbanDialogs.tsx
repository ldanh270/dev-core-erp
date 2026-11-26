import { ApplicationDetailPanel } from "@/components/features/recruitment/application-detail-panel"
import { DeleteColumnDialog } from "@/components/features/recruitment/DeleteColumnDialog"
import { StageDialog } from "@/components/features/recruitment/StageDialog"
import type { RecruitmentPipelineStage } from "@/types/recruitment.types"

interface KanbanDialogsProps {
  isAddColumnOpen: boolean
  setIsAddColumnOpen: (open: boolean) => void
  isEditColumnOpen: boolean
  setIsEditColumnOpen: (open: boolean) => void
  isDeleteConfirmOpen: boolean
  setIsDeleteConfirmOpen: (open: boolean) => void
  columnName: string
  setColumnName: (name: string) => void
  columnColor: string
  setColumnColor: (color: string) => void
  columnIsCompleted: boolean
  setColumnIsCompleted: (completed: boolean) => void
  columnIsDefault: boolean
  setColumnIsDefault: (isDefault: boolean) => void
  selectedColumn: RecruitmentPipelineStage | null
  fallbackColumnId: string
  setFallbackColumnId: (id: string) => void
  statuses: RecruitmentPipelineStage[]
  selectedApplicationId: string | null
  setSelectedApplicationId: (id: string | null) => void
  onCreateStatus: () => void
  onUpdateStatus: () => void
  onDeleteStatus: () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

/**
 * Encapsulates modal dialogs for adding/editing Kanban stages,
 * deleting stages with fallback reassignment, and slide-over application detail view.
 */
export function KanbanDialogs({
  isAddColumnOpen,
  setIsAddColumnOpen,
  isEditColumnOpen,
  setIsEditColumnOpen,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  columnName,
  setColumnName,
  columnColor,
  setColumnColor,
  columnIsCompleted,
  setColumnIsCompleted,
  columnIsDefault,
  setColumnIsDefault,
  selectedColumn,
  fallbackColumnId,
  setFallbackColumnId,
  statuses,
  selectedApplicationId,
  setSelectedApplicationId,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
  isCreating,
  isUpdating,
  isDeleting,
}: KanbanDialogsProps) {
  return (
    <>
      <StageDialog
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        title="Tạo cột trạng thái"
        submitLabel="Tạo cột"
        onSubmit={(event) => {
          event.preventDefault()
          if (columnName.trim()) onCreateStatus()
        }}
        name={columnName}
        setName={setColumnName}
        color={columnColor}
        setColor={setColumnColor}
        completed={columnIsCompleted}
        setCompleted={setColumnIsCompleted}
        isDefault={columnIsDefault}
        setDefault={setColumnIsDefault}
        pending={isCreating}
      />
      <StageDialog
        open={isEditColumnOpen}
        onOpenChange={setIsEditColumnOpen}
        title="Cấu hình cột trạng thái"
        submitLabel="Lưu cấu hình"
        onSubmit={(event) => {
          event.preventDefault()
          if (selectedColumn && columnName.trim()) onUpdateStatus()
        }}
        name={columnName}
        setName={setColumnName}
        color={columnColor}
        setColor={setColumnColor}
        completed={columnIsCompleted}
        setCompleted={setColumnIsCompleted}
        isDefault={columnIsDefault}
        setDefault={setColumnIsDefault}
        defaultDisabled={selectedColumn?.isDefault}
        pending={isUpdating}
      />
      <DeleteColumnDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        selectedColumn={selectedColumn}
        fallbackColumnId={fallbackColumnId}
        setFallbackColumnId={setFallbackColumnId}
        statuses={statuses}
        onConfirm={onDeleteStatus}
        isPending={isDeleting}
      />
      <ApplicationDetailPanel
        open={Boolean(selectedApplicationId)}
        onOpenChange={(open) => {
          if (!open) setSelectedApplicationId(null)
        }}
        applicationId={selectedApplicationId}
      />
    </>
  )
}
