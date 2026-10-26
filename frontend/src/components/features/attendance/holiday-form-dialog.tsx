import { HolidayEmployeePicker } from "@/components/features/attendance/holiday-employee-picker"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ATTENDANCE_EMPLOYEE_PICKER_LIMIT,
  HOLIDAY_SCOPE,
  HOLIDAY_SCOPE_LABELS,
  HOLIDAY_TYPE,
  HOLIDAY_TYPES,
  type IHolidayScope,
  type IHolidayType,
} from "@/config/entities/attendance.config"
import { EMPLOYEE_STATUS } from "@/config/entities/employee.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { usePositions } from "@/hooks/use-position-query"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { type FormEvent, useState } from "react"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  open: boolean
  editingHoliday: IHoliday | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmitCreate: (payload: IHolidayPayload) => void
  onSubmitUpdate: (id: string, payload: Pick<IHolidayPayload, "name" | "date" | "type">) => void
}

interface FormState {
  name: string
  startDate: string
  endDate: string
  type: IHolidayType
  scope: IHolidayScope
  positionId: string
  employeeIds: string[]
}

const DEFAULT_FORM: FormState = {
  name: "",
  startDate: "",
  endDate: "",
  type: HOLIDAY_TYPE.NATIONAL,
  scope: HOLIDAY_SCOPE.ALL,
  positionId: "",
  employeeIds: [],
}

function toDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10)
}

function createInitialForm(editingHoliday: IHoliday | null): FormState {
  if (!editingHoliday) return DEFAULT_FORM
  // Editing targets one persisted date; range scope and batch membership stay immutable.
  const day = toDateInputValue(editingHoliday.date)
  return {
    name: editingHoliday.name,
    startDate: day,
    endDate: day,
    type: editingHoliday.type,
    scope: (editingHoliday.scope as IHolidayScope) || HOLIDAY_SCOPE.ALL,
    positionId: editingHoliday.positionId || "",
    employeeIds: editingHoliday.assignees?.map((assignee) => assignee.employeeId) || [],
  }
}

/**
 * Create/edit dialog for holiday calendar — supports date range + scope.
 */
export function HolidayFormDialog({
  open,
  editingHoliday,
  isSaving,
  onOpenChange,
  onSubmitCreate,
  onSubmitUpdate,
}: Props) {
  const [form, setForm] = useState<FormState>(() => createInitialForm(editingHoliday))
  const [employeeSearch, setEmployeeSearch] = useState("")
  const { data: positions = [] } = usePositions()
  const { data: employeeData } = useEmployees({
    limit: ATTENDANCE_EMPLOYEE_PICKER_LIMIT,
    status: EMPLOYEE_STATUS.ACTIVE,
  })
  const employees = employeeData?.data ?? []
  const isEdit = Boolean(editingHoliday)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error("Vui lòng nhập đủ tên và khoảng ngày")
      return
    }
    if (form.endDate < form.startDate) {
      toast.error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu")
      return
    }
    if (form.scope === HOLIDAY_SCOPE.POSITION && !form.positionId) {
      toast.error("Chọn chức danh")
      return
    }
    if (form.scope === HOLIDAY_SCOPE.EMPLOYEES && form.employeeIds.length === 0) {
      toast.error("Chọn ít nhất 1 nhân viên")
      return
    }

    if (editingHoliday) {
      onSubmitUpdate(editingHoliday.id, {
        name: form.name.trim(),
        date: form.startDate,
        type: form.type,
      })
      return
    }

    onSubmitCreate({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      type: form.type,
      scope: form.scope,
      ...(form.scope === HOLIDAY_SCOPE.POSITION ? { positionId: form.positionId } : {}),
      ...(form.scope === HOLIDAY_SCOPE.EMPLOYEES ? { employeeIds: form.employeeIds } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa ngày lễ" : "Thêm ngày lễ"}</DialogTitle>
          <DialogDescription>
            Có thể tạo khoảng ngày và giới hạn theo chức danh hoặc nhóm nhân viên.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="holiday-name">Tên ngày lễ</Label>
            <Input
              id="holiday-name"
              value={form.name}
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }))
              }}
              placeholder="Ví dụ: Nghỉ team building"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="holiday-start">Từ ngày</Label>
              <DatePicker
                id="holiday-start"
                value={form.startDate || null}
                disabled={isEdit}
                onChange={(val) => {
                  setForm((c) => ({ ...c, startDate: val || "" }));
                }}
                placeholder="Chọn từ ngày..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-end">Đến ngày</Label>
              <DatePicker
                id="holiday-end"
                value={form.endDate || null}
                disabled={isEdit}
                minDate={form.startDate}
                onChange={(val) => {
                  setForm((c) => ({ ...c, endDate: val || "" }));
                }}
                placeholder="Chọn đến ngày..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Loại ngày nghỉ</Label>
            <Select
              value={form.type}
              onValueChange={(value) => {
                setForm((c) => ({ ...c, type: value as IHolidayType }))
              }}
            >
              <SelectTrigger className="h-12 w-full rounded-full bg-transparent px-6">
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                {HOLIDAY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getHolidayTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>Phạm vi áp dụng</Label>
                <Select
                  value={form.scope}
                  onValueChange={(value) => {
                    setForm((c) => ({ ...c, scope: value as IHolidayScope }))
                  }}
                >
                  <SelectTrigger className="h-12 w-full rounded-full bg-transparent px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HOLIDAY_SCOPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.scope === HOLIDAY_SCOPE.POSITION && (
                <div className="space-y-2">
                  <Label>Chức danh</Label>
                  <Select
                    value={form.positionId || undefined}
                    onValueChange={(value) => {
                      setForm((c) => ({ ...c, positionId: value }))
                    }}
                  >
                    <SelectTrigger className="h-12 w-full rounded-full bg-transparent px-6">
                      <SelectValue placeholder="Chọn chức danh" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos: { id: string; name: string }) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.scope === HOLIDAY_SCOPE.EMPLOYEES && (
                <HolidayEmployeePicker
                  employees={employees}
                  selectedIds={form.employeeIds}
                  search={employeeSearch}
                  onSearchChange={setEmployeeSearch}
                  onToggle={(id) => {
                    setForm((c) => ({
                      ...c,
                      employeeIds: c.employeeIds.includes(id)
                        ? c.employeeIds.filter((x) => x !== id)
                        : [...c.employeeIds, id],
                    }))
                  }}
                />
              )}
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
