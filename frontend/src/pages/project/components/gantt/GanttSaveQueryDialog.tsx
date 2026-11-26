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

import { Save } from "lucide-react"

import { GanttSaveQueryColumnsTransfer } from "./GanttSaveQueryColumnsTransfer"
import { GanttSaveQueryFiltersList } from "./GanttSaveQueryFiltersList"

interface GanttSaveQueryDialogProps {
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
  newQueryFilterKeys: string[]
  setNewQueryFilterKeys: React.Dispatch<React.SetStateAction<string[]>>
  newQueryFilters: Record<string, { enabled: boolean; operator: string; value: string }>
  setNewQueryFilters: React.Dispatch<
    React.SetStateAction<Record<string, { enabled: boolean; operator: string; value: string }>>
  >
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  assignees: { id: string; fullName: string }[]
  getDefaultOperator: (key: string) => string
  getDefaultValue: (key: string) => string
}

/** Modal dialog for saving or updating custom Gantt query presets. */
export function GanttSaveQueryDialog({
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
  newQueryFilterKeys,
  setNewQueryFilterKeys,
  newQueryFilters,
  setNewQueryFilters,
  onSubmit,
  isSubmitting,
  assignees,
  getDefaultOperator,
  getDefaultValue,
}: GanttSaveQueryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Save className="size-4 text-primary" />
            Lưu truy vấn riêng
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {/* Top inputs block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="query-name"
                className="text-xs font-semibold text-foreground flex items-center gap-0.5"
              >
                Tên truy vấn <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="query-name"
                value={newQueryName}
                onChange={(e) => {
                  setNewQueryName(e.target.value)
                }}
                placeholder="Ví dụ: Công việc mở tuần này..."
                className="h-9 text-xs rounded-lg border-border"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="query-desc" className="text-xs font-semibold text-foreground">
                Mô tả
              </Label>
              <Input
                id="query-desc"
                value={newQueryDesc}
                onChange={(e) => {
                  setNewQueryDesc(e.target.value)
                }}
                placeholder="Mô tả mục đích của truy vấn..."
                className="h-9 text-xs rounded-lg border-border"
              />
            </div>
          </div>

          {/* Checkbox For All Projects */}
          <div className="flex items-center gap-2">
            <input
              id="query-for-all"
              type="checkbox"
              checked={newQueryForAll}
              onChange={(e) => {
                setNewQueryForAll(e.target.checked)
              }}
              className="rounded border-border size-4"
            />
            <Label htmlFor="query-for-all" className="text-xs font-semibold cursor-pointer">
              Cho mọi dự án
            </Label>
          </div>

          {/* Options section */}
          <div className="border-t border-border pt-3 space-y-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tùy chọn
            </span>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  id="query-default-cols"
                  type="checkbox"
                  checked={newQueryDefaultCols}
                  onChange={(e) => {
                    setNewQueryDefaultCols(e.target.checked)
                    if (e.target.checked) {
                      setNewQuerySelectedCols(["estimatedTime", "assignee", "progress"])
                    }
                  }}
                  className="rounded border-border size-4"
                />
                <Label htmlFor="query-default-cols" className="text-xs font-semibold cursor-pointer">
                  Cột mặc định
                </Label>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold pl-1">
                <span className="text-muted-foreground">Hiện:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      newQueryDefaultCols ? true : newQuerySelectedCols.includes("estimatedTime")
                    }
                    disabled={newQueryDefaultCols}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewQuerySelectedCols((prev) => [...prev, "estimatedTime"])
                      } else {
                        setNewQuerySelectedCols((prev) =>
                          prev.filter((k) => k !== "estimatedTime"),
                        )
                      }
                    }}
                    className="rounded border-border size-3.5"
                  />
                  Ước lượng thời gian & log time (Est)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      newQueryDefaultCols ? true : newQuerySelectedCols.includes("assignee")
                    }
                    disabled={newQueryDefaultCols}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewQuerySelectedCols((prev) => [...prev, "assignee"])
                      } else {
                        setNewQuerySelectedCols((prev) => prev.filter((k) => k !== "assignee"))
                      }
                    }}
                    className="rounded border-border size-3.5"
                  />
                  Người thực hiện (Assignee)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      newQueryDefaultCols ? true : newQuerySelectedCols.includes("progress")
                    }
                    disabled={newQueryDefaultCols}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewQuerySelectedCols((prev) => [...prev, "progress"])
                      } else {
                        setNewQuerySelectedCols((prev) => prev.filter((k) => k !== "progress"))
                      }
                    }}
                    className="rounded border-border size-3.5"
                  />
                  Tiến độ (Progress)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!newQueryDefaultCols}
                    onChange={(e) => {
                      setNewQueryDefaultCols(!e.target.checked)
                      if (!e.target.checked) {
                        setNewQuerySelectedCols(["estimatedTime", "assignee", "progress"])
                      }
                    }}
                    className="rounded border-border size-3.5"
                  />
                  Các cột được lựa chọn
                </label>
              </div>
            </div>
          </div>

          {/* Filters section */}
          <GanttSaveQueryFiltersList
            newQueryFilterKeys={newQueryFilterKeys}
            setNewQueryFilterKeys={setNewQueryFilterKeys}
            newQueryFilters={newQueryFilters}
            setNewQueryFilters={setNewQueryFilters}
            assignees={assignees}
            getDefaultOperator={getDefaultOperator}
            getDefaultValue={getDefaultValue}
          />

          {/* Columns selection section */}
          {!newQueryDefaultCols && (
            <GanttSaveQueryColumnsTransfer
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
              {isSubmitting ? "Đang lưu..." : "Lưu truy vấn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
