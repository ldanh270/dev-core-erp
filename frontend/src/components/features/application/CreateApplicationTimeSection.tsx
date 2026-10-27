import { DatePicker, TimePicker } from "@/components/common"
"use client"

import { LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { AddRegimeCategoryDialog } from "@/components/features/application/add-regime-category-dialog"
import { FileUploader } from "@/components/ui/file-uploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { ApplicationFormState } from "@/hooks/application/useCreateApplicationForm"
import { useRegimeCategories } from "@/hooks/attendance/use-regime-categories"
import { schedulesApi } from "@/lib/api/attendance.api"
import type { Employee } from "@/types/employee.types"

import { useEffect, useState } from "react"

import { Trash2 } from "lucide-react"

interface Props {
  type: string
  form: ApplicationFormState
  set: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  employees: Employee[]
  formIndex?: number
  onRemove?: () => void
}

interface IEmployeeShiftOption {
  id: string
  name?: string
  startTime?: number
  endTime?: number
  shift?: {
    name: string
    startTime: number
    endTime: number
  }
}

const EMPTY_SHIFT_VALUE = "__empty_shift__"
const EMPTY_REGIME_CATEGORY_VALUE = "__empty_regime_category__"
const EMPTY_EMPLOYEE_VALUE = "__empty_employee__"

/** Renders type-specific scheduling and evidence fields for an application item. */
export function CreateApplicationTimeSection({
  type,
  form,
  set,
  employees,
  formIndex,
  onRemove,
}: Props) {
  const [shifts, setShifts] = useState<IEmployeeShiftOption[]>([])
  const [partnerShifts, setPartnerShifts] = useState<IEmployeeShiftOption[]>([])
  const [isAddRegimeOpen, setIsAddRegimeOpen] = useState(false)

  const { categories } = useRegimeCategories()
  useEffect(() => {
    let active = true
    if (
      form.startDate &&
      (
        [
          APPLICATION_TYPES.OVERTIME.LABEL,
          APPLICATION_TYPES.LATE_EARLY.LABEL,
          APPLICATION_TYPES.SHIFT_SWAP.LABEL,
          APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
          APPLICATION_TYPES.FORGOT_CARD.LABEL,
        ] as string[]
      ).includes(type)
    ) {
      schedulesApi
        .getMyShifts(form.startDate, form.startDate)
        .then((data) => {
          if (active) setShifts(data)
        })
        .catch(() => {
          if (active) setShifts([])
        })
    } else {
      void Promise.resolve().then(() => {
        if (active) setShifts([])
      })
    }
    return () => {
      active = false
    }
  }, [type, form.startDate])

  useEffect(() => {
    let active = true
    if (
      type === APPLICATION_TYPES.SHIFT_SWAP.LABEL &&
      form.swapWithEmployeeId &&
      form.swapWithDate
    ) {
      schedulesApi
        .getShiftsByEmployee(form.swapWithEmployeeId, form.swapWithDate, form.swapWithDate)
        .then((data) => {
          if (active) setPartnerShifts(data)
        })
        .catch(() => {
          if (active) setPartnerShifts([])
        })
    } else {
      void Promise.resolve().then(() => {
        if (active) setPartnerShifts([])
      })
    }
    return () => {
      active = false
    }
  }, [type, form.swapWithEmployeeId, form.swapWithDate])

  /** Formats a minute offset from midnight as an HH:mm value. */
  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  // Validations
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDateObj = form.startDate ? new Date(form.startDate) : null
  const endDateObj = form.endDate ? new Date(form.endDate) : null

  const isStartDatePast = startDateObj ? startDateObj < today : false
  const isStartDateFuture = startDateObj ? startDateObj > today : false
  const isEndDateBeforeStart = startDateObj && endDateObj ? endDateObj < startDateObj : false

  const isForgotCard = type === APPLICATION_TYPES.FORGOT_CARD.LABEL
  const showDatePastError = !isForgotCard && isStartDatePast
  const showDateFutureError = isForgotCard && isStartDateFuture

  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-visible shrink-0 relative flex flex-col">
      <div className="px-5 py-4 border-b border-border bg-muted/50 rounded-t-xl flex items-center gap-3">
        {formIndex !== undefined && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {formIndex + 1}
          </div>
        )}
        <h3 className="font-semibold text-[15px] text-foreground flex-1">
          {type === APPLICATION_TYPES.LEAVE.LABEL && "Nghỉ phép"}
          {type === APPLICATION_TYPES.OVERTIME.LABEL && "Tăng ca"}
          {type === APPLICATION_TYPES.LATE_EARLY.LABEL && "Đi muộn / Về sớm"}
          {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && "Đổi ca"}
          {type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && "Làm việc từ xa"}
          {!(
            [
              APPLICATION_TYPES.LEAVE.LABEL,
              APPLICATION_TYPES.OVERTIME.LABEL,
              APPLICATION_TYPES.LATE_EARLY.LABEL,
              APPLICATION_TYPES.SHIFT_SWAP.LABEL,
              APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
            ] as string[]
          ).includes(type) && "Thời gian"}
        </h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-destructive text-sm flex items-center gap-1.5 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium"
          >
            <Trash2 size={15} /> Xóa
          </button>
        )}
      </div>
      <div className="p-5">
        {type === APPLICATION_TYPES.LEAVE.LABEL ? (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-sm text-foreground mb-3">Thời gian</h4>
              <div className="border border-border rounded-md overflow-hidden bg-background">
                <div className="grid grid-cols-[200px_350px_1fr] bg-muted/30 border-b border-border">
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Kiểu nghỉ
                  </div>
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Thời gian
                  </div>
                  <div className="px-4 py-3 font-medium text-[13px] text-muted-foreground flex items-center">
                    Lý do
                  </div>
                </div>
                <div className="grid grid-cols-[200px_350px_1fr]">
                  <div className="p-3 border-r border-border">
                    <Select
                      value={form.leaveType}
                      onValueChange={(value) => {
                        set("leaveType", value)
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-full bg-background px-3 text-[13px]">
                        <SelectValue placeholder="Chọn kiểu nghỉ" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAVE_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 border-r border-border flex flex-col gap-1 justify-center">
                    <div className="flex gap-2 items-center">
                      <DatePicker
                        value={form.startDate || null}
                        onChange={(val) => {
                          set("startDate", val || "");
                        }}
                        placeholder="Từ ngày"
                        size="sm"
                        triggerClassName="w-[140px]"
                      />
                      <span className="text-muted-foreground/70">-</span>
                      <DatePicker
                        value={form.endDate || null}
                        minDate={form.startDate}
                        onChange={(val) => {
                          set("endDate", val || "");
                        }}
                        placeholder="Đến ngày"
                        size="sm"
                        triggerClassName="w-[140px]"
                      />
                    </div>
                    {isStartDatePast && (
                      <span className="text-[11px] text-destructive">
                        Thời gian không được ở quá khứ
                      </span>
                    )}
                    {isEndDateBeforeStart && (
                      <span className="text-[11px] text-destructive">
                        Ngày kết thúc không được nhỏ hơn
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex items-center">
                    <input
                      type="text"
                      placeholder="Nhập lý do"
                      value={form.reason}
                      onChange={(e) => {
                        set("reason", e.target.value)
                      }}
                      className="w-full h-9 px-4 text-xs border border-input bg-background rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[13px] font-medium text-foreground mb-2 flex items-center gap-1">
                Chứng từ đính kèm
                <span className="text-muted-foreground font-normal">
                  (Hỗ trợ định dạng: JPEG, PNG, WEBP, GIF, PDF. Tối đa 10MB)
                </span>
              </label>
              <FileUploader
                onUploadSuccess={(url) => {
                  set("documentUrl", url)
                }}
              />
              {form.documentUrl && (
                <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-primary">
                  Đã tải lên tệp:{" "}
                  <a
                    href={form.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline transition-colors hover:text-primary/80"
                  >
                    Xem tài liệu
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Common fields for other types */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {type === APPLICATION_TYPES.OVERTIME.LABEL
                  ? "Ngày tăng ca"
                  : type === APPLICATION_TYPES.SHIFT_SWAP.LABEL
                    ? "Ngày ca của bạn"
                    : type === APPLICATION_TYPES.LATE_EARLY.LABEL ||
                        type === APPLICATION_TYPES.FORGOT_CARD.LABEL
                      ? "Ngày làm việc"
                      : type === APPLICATION_TYPES.WORK_FROM_HOME.LABEL
                        ? "Ngày làm việc từ xa"
                        : type === APPLICATION_TYPES.RESIGNATION.LABEL
                          ? "Ngày thôi việc"
                          : type === APPLICATION_TYPES.REGIME.LABEL
                            ? "Ngày bắt đầu áp dụng"
                            : "Ngày bắt đầu"}
              </label>
              <DatePicker
                value={form.startDate || null}
                onChange={(val) => {
                  set("startDate", val || "");
                }}
                placeholder="Chọn ngày..."
                size="sm"
              />
              {showDatePastError && (
                <span className="text-xs text-destructive">Thời gian không được ở quá khứ</span>
              )}
              {showDateFutureError && (
                <span className="text-xs text-destructive">Thời gian không được ở tương lai</span>
              )}
            </div>
            {!(
              [
                APPLICATION_TYPES.OVERTIME.LABEL,
                APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                APPLICATION_TYPES.LATE_EARLY.LABEL,
                APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
                APPLICATION_TYPES.RESIGNATION.LABEL,
                APPLICATION_TYPES.FORGOT_CARD.LABEL,
              ] as string[]
            ).includes(type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {type === APPLICATION_TYPES.REGIME.LABEL
                    ? "Ngày kết thúc chế độ"
                    : "Ngày kết thúc"}
                </label>
                <DatePicker
                  value={form.endDate || null}
                  minDate={form.startDate}
                  onChange={(val) => {
                    set("endDate", val || "");
                  }}
                  placeholder="Chọn ngày kết thúc..."
                  size="sm"
                />
                {isEndDateBeforeStart && (
                  <span className="text-xs text-destructive">
                    Ngày kết thúc không được nhỏ hơn ngày bắt đầu
                  </span>
                )}
              </div>
            )}

            {/* Specific fields */}
            {(
              [
                APPLICATION_TYPES.OVERTIME.LABEL,
                APPLICATION_TYPES.LATE_EARLY.LABEL,
                APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                APPLICATION_TYPES.WORK_FROM_HOME.LABEL,
                APPLICATION_TYPES.FORGOT_CARD.LABEL,
              ] as string[]
            ).includes(type) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL ? "Ca của bạn" : "Ca làm việc"}
                </label>
                <Select
                  value={form.employeeShiftId || EMPTY_SHIFT_VALUE}
                  onValueChange={(value) => {
                    set("employeeShiftId", value === EMPTY_SHIFT_VALUE ? "" : value)
                  }}
                >
                  <SelectTrigger className="h-9 rounded-full bg-background px-3">
                    <SelectValue placeholder="Chọn ca làm việc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SHIFT_VALUE}>Chọn ca làm việc</SelectItem>
                    {shifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shift
                          ? `${s.shift.name} (${formatTime(s.shift.startTime)} - ${formatTime(s.shift.endTime)})`
                          : "Không xác định"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === APPLICATION_TYPES.OVERTIME.LABEL && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Số giờ tăng ca</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.overtimeHours || ""}
                  onChange={(e) => {
                    set("overtimeHours", parseFloat(e.target.value))
                  }}
                  placeholder="Nhập số giờ"
                  className="w-full h-9 px-4 text-xs border border-input rounded-full bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {type === APPLICATION_TYPES.LATE_EARLY.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Số phút</label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={form.durationMinutes}
                    onChange={(e) => {
                      set("durationMinutes", parseInt(e.target.value))
                    }}
                    className="w-full h-9 px-4 text-xs border border-input rounded-full bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Loại</label>
                  <Select
                    value={form.isLate ? "true" : "false"}
                    onValueChange={(value) => {
                      set("isLate", value === "true")
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-full bg-background px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đi muộn</SelectItem>
                      <SelectItem value="false">Về sớm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === APPLICATION_TYPES.REGIME.LABEL && (
              <>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-foreground">Loại chế độ</label>
                  <div className="flex gap-2">
                    <Select
                      value={form.regimeCategoryId || EMPTY_REGIME_CATEGORY_VALUE}
                      onValueChange={(value) => {
                        const nextValue = value === EMPTY_REGIME_CATEGORY_VALUE ? "" : value
                        const cat = categories.find((category) => category.id === nextValue)
                        set("regimeCategoryId", nextValue)
                        if (cat) {
                          set("regimeLateMinutes", cat.maxLateMinutes)
                          set("regimeEarlyMinutes", cat.maxEarlyMinutes)
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-full bg-background px-3">
                        <SelectValue placeholder="Chọn loại chế độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_REGIME_CATEGORY_VALUE}>
                          Chọn loại chế độ
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRegimeOpen(true)
                      }}
                      className="h-9 px-3 text-sm font-medium border border-input rounded-md bg-muted/50 hover:bg-muted whitespace-nowrap transition-colors"
                    >
                      + Thêm mới
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Thời gian về muộn (phút)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={form.regimeLateMinutes}
                    className="w-full h-9 px-4 text-xs border border-input rounded-full bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Thời gian về sớm (phút)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={form.regimeEarlyMinutes}
                    className="w-full h-9 px-4 text-xs border border-input rounded-full bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <AddRegimeCategoryDialog
                  open={isAddRegimeOpen}
                  onOpenChange={setIsAddRegimeOpen}
                  onCreated={(category) => {
                    set("regimeCategoryId", category.id)
                    set("regimeLateMinutes", category.maxLateMinutes)
                    set("regimeEarlyMinutes", category.maxEarlyMinutes)
                  }}
                />
              </>
            )}

            {type === APPLICATION_TYPES.FORGOT_CARD.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Giờ vào</label>
                  <TimePicker
                    value={form.checkInAt}
                    onChange={(val) => {
                      set("checkInAt", val)
                    }}
                    placeholder="Chọn giờ vào..."
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Giờ ra</label>
                  <TimePicker
                    value={form.checkOutAt}
                    onChange={(val) => {
                      set("checkOutAt", val)
                    }}
                    placeholder="Chọn giờ ra..."
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-foreground">Chứng từ đính kèm</label>
                  <FileUploader
                    onUploadSuccess={(url) => {
                      set("documentUrl", url)
                    }}
                  />
                  {form.documentUrl && (
                    <div className="mt-1 text-xs font-medium text-primary">
                      Đã tải lên tệp:{" "}
                      <a
                        href={form.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Xem tài liệu
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}

            {type === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Ngày ca của đồng nghiệp
                  </label>
                  <DatePicker
                    value={form.swapWithDate || null}
                    onChange={(val) => {
                      set("swapWithDate", val || "");
                    }}
                    placeholder="Chọn ngày ca đổi..."
                    size="sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Ca của đồng nghiệp</label>
                  <Select
                    value={form.swapWithShiftId || EMPTY_SHIFT_VALUE}
                    onValueChange={(value) => {
                      set("swapWithShiftId", value === EMPTY_SHIFT_VALUE ? "" : value)
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-full bg-background px-3">
                      <SelectValue placeholder="Chọn ca làm việc" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_SHIFT_VALUE}>Chọn ca làm việc</SelectItem>
                      {partnerShifts.length > 0 ? (
                        partnerShifts.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.shift?.name ?? s.name} (
                            {formatTime(s.shift?.startTime ?? s.startTime ?? 0)} -{" "}
                            {formatTime(s.shift?.endTime ?? s.endTime ?? 0)})
                          </SelectItem>
                        ))
                      ) : form.swapWithDate && form.swapWithEmployeeId ? (
                        <SelectItem disabled value="no_partner_shift">
                          Không có ca trong ngày này
                        </SelectItem>
                      ) : (
                        <SelectItem disabled value="partner_shift_requires_context">
                          Chọn ngày và nhân sự trước
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Nhân sự đổi ca</label>
                  <Select
                    value={form.swapWithEmployeeId || EMPTY_EMPLOYEE_VALUE}
                    onValueChange={(value) => {
                      set("swapWithEmployeeId", value === EMPTY_EMPLOYEE_VALUE ? "" : value)
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-full bg-background px-3">
                      <SelectValue placeholder="Chọn nhân sự" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_EMPLOYEE_VALUE}>Chọn nhân sự</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-foreground">Lý do/Ghi chú</label>
              <textarea
                rows={2}
                placeholder="Nhập lý do hoặc ghi chú chi tiết"
                value={form.reason}
                onChange={(e) => {
                  set("reason", e.target.value)
                }}
                className="w-full p-3 text-xs border border-input rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
