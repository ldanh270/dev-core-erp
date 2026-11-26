import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProjectMember } from "@/types/project.types"

import { CustomQueryColumnsTransfer } from "./CustomQueryColumnsTransfer"
import { CustomQueryFilterSection } from "./CustomQueryFilterSection"

interface CreateCustomQueryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newQueryName: string
  setNewQueryName: (val: string) => void
  newQueryDesc: string
  setNewQueryDesc: (val: string) => void
  newQueryForAll: boolean
  setNewQueryForAll: (val: boolean) => void
  newQueryDefaultCols: boolean
  setNewQueryDefaultCols: (val: boolean) => void
  newQuerySelectedCols: string[]
  setNewQuerySelectedCols: React.Dispatch<React.SetStateAction<string[]>>
  availSelectedKey: string | null
  setAvailSelectedKey: (val: string | null) => void
  selSelectedKey: string | null
  setSelSelectedKey: (val: string | null) => void
  newQueryFilters: {
    status: { enabled: boolean; value: string }
    tracker: { enabled: boolean; value: string }
    priority: { enabled: boolean; value: string }
    assignee: { enabled: boolean; value: string }
    createdBy: { enabled: boolean; value: string }
  }
  setNewQueryFilters: React.Dispatch<
    React.SetStateAction<{
      status: { enabled: boolean; value: string }
      tracker: { enabled: boolean; value: string }
      priority: { enabled: boolean; value: string }
      assignee: { enabled: boolean; value: string }
      createdBy: { enabled: boolean; value: string }
    }>
  >
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  statuses: { id: string; name: string; isCompleted: boolean }[]
  teamLeader?: { id: string; fullName: string; email: string } | null
  members: ProjectMember[]
}

/** Modal dialog for authoring custom task filter queries in the Issues tab. */
export function CreateCustomQueryDialog({
  isOpen,
  onOpenChange,
  newQueryName,
  setNewQueryName,
  newQueryDesc,
  setNewQueryDesc,
  newQueryForAll,
  setNewQueryForAll,
  newQueryDefaultCols,
  setNewQueryDefaultCols,
  newQuerySelectedCols,
  setNewQuerySelectedCols,
  availSelectedKey,
  setAvailSelectedKey,
  selSelectedKey,
  setSelSelectedKey,
  newQueryFilters,
  setNewQueryFilters,
  onSubmit,
  isSubmitting,
  statuses,
  teamLeader,
  members,
}: CreateCustomQueryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">Tạo truy vấn mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {/* Query Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Tên truy vấn <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newQueryName}
              onChange={(e) => {
                setNewQueryName(e.target.value)
              }}
              placeholder="Ví dụ: Công việc ưu tiên cao..."
              className="h-9 text-xs rounded-full border-border"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Mô tả</Label>
            <Input
              value={newQueryDesc}
              onChange={(e) => {
                setNewQueryDesc(e.target.value)
              }}
              placeholder="Mô tả mục đích của truy vấn..."
              className="h-9 text-xs rounded-full border-border"
            />
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={newQueryForAll}
                onChange={(e) => {
                  setNewQueryForAll(e.target.checked)
                }}
                className="rounded border-border size-4"
              />
              Hiển thị cho tất cả dự án (Toàn cục)
            </label>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={newQueryDefaultCols}
                onChange={(e) => {
                  setNewQueryDefaultCols(e.target.checked)
                }}
                className="rounded border-border size-4"
              />
              Cột mặc định
            </label>
          </div>

          {/* Filters section */}
          <CustomQueryFilterSection
            newQueryFilters={newQueryFilters}
            setNewQueryFilters={setNewQueryFilters}
            statuses={statuses}
            teamLeader={teamLeader}
            members={members}
          />

          {/* Columns selection section */}
          {!newQueryDefaultCols && (
            <CustomQueryColumnsTransfer
              newQuerySelectedCols={newQuerySelectedCols}
              setNewQuerySelectedCols={setNewQuerySelectedCols}
              availSelectedKey={availSelectedKey}
              setAvailSelectedKey={setAvailSelectedKey}
              selSelectedKey={selSelectedKey}
              setSelSelectedKey={setSelSelectedKey}
            />
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="h-9 text-xs rounded-full cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!newQueryName.trim() || isSubmitting}
              className="h-9 text-xs rounded-full cursor-pointer"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
