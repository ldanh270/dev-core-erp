import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { WORK_SCHEDULE_TYPE } from "@/config/entities/employee.config"
import { useApplyWeeklyScheduleTemplate } from "@/hooks/attendance/use-weekly-schedule-templates"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { useMemo, useState } from "react"

import { CalendarCheck, Search } from "lucide-react"
import { toast } from "sonner"

interface ApplyWeeklyScheduleTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: IWeeklyScheduleTemplate | null
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ApplyWeeklyScheduleTemplateDialog({
  open,
  onOpenChange,
  template,
}: ApplyWeeklyScheduleTemplateDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [validFrom, setValidFrom] = useState(todayInputValue)
  const [validTo, setValidTo] = useState("")
  const [generateShifts, setGenerateShifts] = useState(true)
  const applyMutation = useApplyWeeklyScheduleTemplate()
  const { data, isLoading } = useEmployees({
    limit: 100,
    status: "active",
    workSchedule: WORK_SCHEDULE_TYPE.FULL_TIME,
  })
  const employees = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const rows = data?.data ?? []
    if (!keyword) return rows
    return rows.filter((employee) =>
      [employee.fullName, employee.email, employee.position ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    )
  }, [data?.data, search])
  // Bulk actions target the filtered list only, while prior selections outside the filter stay selected.
  const visibleIds = employees.map((employee) => employee.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const toggleOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleVisible = () => {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    )
  }

  const handleSubmit = () => {
    if (!template) return
    // generateShifts controls whether the backend materializes EmployeeShift rows immediately.
    applyMutation.mutate(
      {
        templateId: template.id,
        employeeIds: selectedIds,
        validFrom,
        validTo: validTo || null,
        generateShifts,
      },
      {
        onSuccess: () => {
          toast.success(`Đã áp dụng template cho ${selectedIds.length} nhân viên`)
          onOpenChange(false)
          setSelectedIds([])
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Áp dụng template
          </DialogTitle>
          <DialogDescription>
            {template?.name ?? "Template"} sẽ được gán cho các nhân viên toàn thời gian đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="template-valid-from">Ngày bắt đầu</Label>
              <DatePicker
                id="template-valid-from"
                value={validFrom || null}
                onChange={(val) => {
                  setValidFrom(val || "");
                }}
                placeholder="Chọn ngày bắt đầu..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-valid-to">Ngày kết thúc</Label>
              <DatePicker
                id="template-valid-to"
                value={validTo || null}
                minDate={validFrom}
                onChange={(val) => {
                  setValidTo(val || "");
                }}
                placeholder="Chọn ngày kết thúc..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <Label>Sinh ca ngay</Label>
              <p className="text-xs text-muted-foreground">
                Tạo Employee Shifts theo template trong khoảng ngày đã chọn.
              </p>
            </div>
            <Switch checked={generateShifts} onCheckedChange={setGenerateShifts} />
          </div>

          <div className="grid gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
                placeholder="Tìm nhân viên toàn thời gian"
                className="rounded-full pl-9"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={toggleVisible}
                className="rounded-full text-primary hover:underline"
              >
                {allVisibleSelected ? "Bỏ chọn danh sách" : "Chọn danh sách"}
              </button>
              <span className="text-muted-foreground">Đã chọn {selectedIds.length}</span>
            </div>
            <div className="h-64 overflow-auto rounded-xl border border-border">
              <div className="divide-y divide-border">
                {employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(employee.id)}
                      onChange={() => {
                        toggleOne(employee.id)
                      }}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{employee.fullName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {employee.position ?? "Chưa có vị trí"} · {employee.email}
                      </span>
                    </span>
                  </label>
                ))}
                {!isLoading && employees.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Không có nhân viên toàn thời gian phù hợp.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            Hủy
          </Button>
          <Button
            className="rounded-full"
            onClick={handleSubmit}
            disabled={!template || !validFrom || selectedIds.length === 0 || applyMutation.isPending}
          >
            {applyMutation.isPending ? "Đang áp dụng..." : "Áp dụng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
