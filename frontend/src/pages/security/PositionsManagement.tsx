import { PageContainer, PageHeader } from "@/components/common"
import { PositionCardsGrid } from "@/components/features/security/PositionCardsGrid"
import { PositionFormDialog } from "@/components/features/security/PositionFormDialog"
import { PositionsHeaderActions } from "@/components/features/security/PositionsHeaderActions"
import { TRACKER_LABELS, usePositionsManagement } from "@/hooks/security/use-positions-management"

/**
 * PositionsManagement page component.
 * Pure orchestrator managing job positions, descriptions, and task tracker authorization rules.
 */
export default function PositionsManagement() {
  const {
    positions,
    isLoading,
    isOpen,
    setIsOpen,
    editingId,
    name,
    setName,
    code,
    setCode,
    description,
    setDescription,
    allowedTrackers,
    handleOpenCreate,
    handleOpenEdit,
    handleToggleTracker,
    handleSubmit,
    handleDelete,
  } = usePositionsManagement()

  return (
    <PageContainer variant="default">
      <PageHeader
        title="Quản lý Chức vụ"
        description="Định nghĩa các chức vụ và cấu hình các quy tắc giới hạn tạo Công việc (Task) cũng như gửi Yêu cầu (Application) toàn hệ thống."
        actions={<PositionsHeaderActions onOpenCreate={handleOpenCreate} />}
      />

      <PositionCardsGrid
        positions={positions}
        isLoading={isLoading}
        trackerLabels={TRACKER_LABELS}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <PositionFormDialog
        open={isOpen}
        editingId={editingId}
        name={name}
        code={code}
        description={description}
        allowedTrackers={allowedTrackers}
        trackerLabels={TRACKER_LABELS}
        onOpenChange={setIsOpen}
        onNameChange={setName}
        onCodeChange={setCode}
        onDescriptionChange={setDescription}
        onToggleTracker={handleToggleTracker}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  )
}
