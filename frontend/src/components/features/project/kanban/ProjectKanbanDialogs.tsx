import { Label } from "@/components/ui/label"
import { KANBAN_PALETTE_COLORS } from "@/config/entities/project.config"
import type { ProjectTaskStatus } from "@/types/project-task-status.types"

import { Check } from "lucide-react"

import { KanbanCreateColumnDialog } from "./KanbanCreateColumnDialog"
import { KanbanDeleteColumnDialog } from "./KanbanDeleteColumnDialog"
import { KanbanEditColumnDialog } from "./KanbanEditColumnDialog"

export interface KanbanColorPickerProps {
  columnColor: string
  setColumnColor: (color: string) => void
}

/**
 * Color picker presenter component for choosing Kanban column themes.
 */
export function KanbanColorPicker({ columnColor, setColumnColor }: KanbanColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">Màu cột sắc đại diện</Label>
      <div className="flex flex-wrap gap-2.5">
        {KANBAN_PALETTE_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => setColumnColor(hex)}
            className={`size-6 rounded-full border transition-all relative shrink-0 cursor-pointer ${
              columnColor === hex
                ? "scale-110 ring-2 ring-primary/45 border-transparent"
                : "border-border hover:scale-105"
            }`}
            style={{ backgroundColor: hex }}
          >
            {columnColor === hex && (
              <Check className="size-3 text-white absolute inset-0 m-auto font-black" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface ProjectKanbanDialogsProps {
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
  setColumnIsCompleted: (isCompleted: boolean) => void
  columnIsDefault: boolean
  setColumnIsDefault: (isDefault: boolean) => void
  selectedColumn: ProjectTaskStatus | null
  fallbackColumnId: string
  setFallbackColumnId: (id: string) => void
  statuses: ProjectTaskStatus[]
  handleCreateColumn: (e: React.FormEvent) => void
  handleUpdateColumn: (e: React.FormEvent) => void
  handleDeleteColumn: () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

/** Container managing modal dialogs for Kanban column lifecycle operations. */
export function ProjectKanbanDialogs({
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
  handleCreateColumn,
  handleUpdateColumn,
  handleDeleteColumn,
  isCreating,
  isUpdating,
  isDeleting,
}: ProjectKanbanDialogsProps) {
  return (
    <>
      <KanbanCreateColumnDialog
        isOpen={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        columnName={columnName}
        setColumnName={setColumnName}
        columnColor={columnColor}
        setColumnColor={setColumnColor}
        columnIsCompleted={columnIsCompleted}
        setColumnIsCompleted={setColumnIsCompleted}
        columnIsDefault={columnIsDefault}
        setColumnIsDefault={setColumnIsDefault}
        onSubmit={handleCreateColumn}
        isCreating={isCreating}
      />

      <KanbanEditColumnDialog
        isOpen={isEditColumnOpen}
        onOpenChange={setIsEditColumnOpen}
        columnName={columnName}
        setColumnName={setColumnName}
        columnColor={columnColor}
        setColumnColor={setColumnColor}
        columnIsCompleted={columnIsCompleted}
        setColumnIsCompleted={setColumnIsCompleted}
        columnIsDefault={columnIsDefault}
        setColumnIsDefault={setColumnIsDefault}
        selectedColumn={selectedColumn}
        onSubmit={handleUpdateColumn}
        isUpdating={isUpdating}
      />

      <KanbanDeleteColumnDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        selectedColumn={selectedColumn}
        statuses={statuses}
        fallbackColumnId={fallbackColumnId}
        setFallbackColumnId={setFallbackColumnId}
        onConfirmDelete={handleDeleteColumn}
        isDeleting={isDeleting}
      />
    </>
  )
}
