import { PageContainer, PageHeader } from "@/components/common"
import { PositionCardsGrid } from "@/components/features/security/PositionCardsGrid"
import { PositionFormDialog } from "@/components/features/security/PositionFormDialog"
import { Button } from "@/components/ui/button"
import {
  TRACKER_LABELS,
  usePositionsManagement,
} from "@/hooks/security/use-positions-management"
import { Plus } from "lucide-react"

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
    <PageContainer variant="default" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Bảo mật & Cài đặt
          </span>
          <PageHeader
            title="Quản lý Chức vụ"
            description="Định nghĩa các chức vụ và cấu hình các quy tắc giới hạn tạo Công việc (Task) cũng như gửi Yêu cầu (Application) toàn hệ thống."
          />
        </div>
        <Button
          onClick={handleOpenCreate}
          size="default"
          className="rounded-full shadow-xs gap-2 font-semibold"
        >
          <Plus className="size-4" />
          Thêm chức vụ mới
        </Button>
      </div>

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
