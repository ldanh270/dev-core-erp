import { Badge } from "@/components/ui/badge"
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
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { useBulkAssignSalaryTemplate } from "@/hooks/payroll/use-employee-salary-config"
import type { Employee } from "@/types/employee.types"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useState } from "react"

import { Loader2, Search, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface BulkAssignPayslipTemplateDialogProps {
  template: IPayslipTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkAssignPayslipTemplateDialog({
  template,
  open,
  onOpenChange,
}: BulkAssignPayslipTemplateDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [defaultBaseSalary, setDefaultBaseSalary] = useState(0)
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0])
  const [note, setNote] = useState("")
  const assignMutation = useBulkAssignSalaryTemplate()
  const { data: employeeData, isLoading } = useEmployees({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT,
    search,
  })
  const employees = employeeData?.data ?? []
  // Selection is cumulative across searches; "visible" means the current server-filtered page.
  const visibleIds = employees.map((employee) => employee.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const toggleVisible = () => {
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    )
  }

  const toggleOne = (employeeId: string) => {
    setSelectedIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    )
  }

  const handleSubmit = async () => {
    if (!template || selectedIds.length === 0) return
    try {
      const result = await assignMutation.mutateAsync({
        employeeIds: selectedIds,
        templateId: template.id,
        // Backend keeps existing base salaries and uses this only when an employee has no active config.
        defaultBaseSalary,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        note: note || undefined,
      })
      toast.success(`Đã gán mẫu phiếu lương cho ${result.assignedCount} nhân viên`)
      setSelectedIds([])
      setNote("")
      onOpenChange(false)
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || "Không gán được mẫu phiếu lương")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-180 rounded-xl overflow-hidden p-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            Gán mẫu phiếu lương
          </DialogTitle>
          <DialogDescription>
            {template?.name ?? "Mẫu phiếu lương"} sẽ được áp dụng cho các nhân viên đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bulk-template-effective-from">Ngày áp dụng</Label>
              <DatePicker
                id="bulk-template-effective-from"
                value={effectiveFrom || null}
                onChange={(val) => {
                  setEffectiveFrom(val || "");
                }}
                placeholder="Chọn ngày áp dụng..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-template-default-salary">Lương cơ bản mặc định</Label>
              <Input
                id="bulk-template-default-salary"
                type="number"
                min={0}
                value={defaultBaseSalary}
                onChange={(event) => {
                  setDefaultBaseSalary(Number(event.target.value))
                }}
                className="rounded-full"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulk-template-note">Ghi chú</Label>
            <Input
              id="bulk-template-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
              }}
              placeholder="Ví dụ: gán mẫu phiếu lương chuẩn cho nhân viên full-time"
              className="rounded-full"
            />
          </div>

          <div className="grid gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
                placeholder="Tìm nhân viên..."
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
              <Badge variant="outline" className="rounded-full shadow-none">
                Đã chọn {selectedIds.length}
              </Badge>
            </div>
            <div className="h-72 overflow-auto rounded-xl border border-border">
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  employees.map((employee: Employee) => (
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
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {employee.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {employee.position || "Chưa có vị trí"} · {employee.email}
                        </span>
                      </span>
                    </label>
                  ))
                )}
                {!isLoading && employees.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Không có nhân viên phù hợp.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
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
            disabled={!template || selectedIds.length === 0 || assignMutation.isPending}
          >
            {assignMutation.isPending ? "Đang gán..." : "Gán cho nhân viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
