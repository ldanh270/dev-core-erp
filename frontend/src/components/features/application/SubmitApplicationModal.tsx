import { DatePicker } from "@/components/common"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
"use client"

import { APP_TYPE_META, LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { APPLICATION_TYPES, REGIME_TYPE } from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"

import { useState } from "react"

import { ArrowLeft, Send, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export interface SubmitModalProps {
  onClose: () => void
  onSuccess: () => void
  initialType?: string
}

/** Presents application type selection and legacy single-item submission fields. */
export function SubmitApplicationModal({ onClose, onSuccess, initialType }: SubmitModalProps) {
  const navigate = useNavigate()
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [step, setStep] = useState<"type" | "details">(initialType ? "details" : "type")
  const [selectedType] = useState<string>(initialType || "")
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    // leave
    leaveType: LEAVE_TYPE_OPTIONS[0].value as string,
    leaveRegimeType: REGIME_TYPE.PAID as "paid" | "unpaid",
    // overtime / late_early / shift_swap
    employeeShiftId: "",
    // late_early specific
    durationMinutes: 30,
    isLate: true,
    // shift_swap
    swapWithEmployeeId: "",
    swapWithShiftId: "",
    // work_from_home
    location: "",
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu")
      return
    }

    // Build type-specific detail matching the backend Zod schemas exactly
    let detail: Record<string, unknown> = {}

    switch (selectedType) {
      case APPLICATION_TYPES.LEAVE.LABEL:
        // Backend: { leaveType: LEAVE_TYPE_VALUES, regimeType: REGIME_TYPES }
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case APPLICATION_TYPES.OVERTIME.LABEL:
        // Backend: { employeeShiftId: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case APPLICATION_TYPES.LATE_EARLY.LABEL:
        // Backend: { employeeShiftId: cuid, durationMinutes: int(1-480), isLate: boolean }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        if (form.durationMinutes < 1 || form.durationMinutes > 480) {
          toast.error("Số phút muộn/sớm phải từ 1 đến 480")
          return
        }
        detail = {
          employeeShiftId: form.employeeShiftId.trim(),
          durationMinutes: form.durationMinutes,
          isLate: form.isLate,
        }
        break

      case APPLICATION_TYPES.SHIFT_SWAP.LABEL:
        // Backend: { employeeShiftId: cuid, swapWithEmployeeId?: cuid, swapWithShiftId?: cuid }
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca của bạn")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim())
          detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case APPLICATION_TYPES.WORK_FROM_HOME.LABEL:
        // Backend: { location?: string }  ← key is "location" not "workLocation"
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case APPLICATION_TYPES.RESIGNATION.LABEL:
        detail = {}
        break
    }

    const success = await submitApplication({
      type: selectedType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      detail,
    })

    if (success) {
      onSuccess()
      onClose()
    }
  }

  const meta =
    Object.entries(APP_TYPE_META).find(([k]) => k === selectedType)?.[1] ||
    APP_TYPE_META[APPLICATION_TYPES.LEAVE.LABEL]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className={`bg-background w-full ${step === "type" ? "max-w-3xl" : "max-w-lg"} rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button
                type="button"
                onClick={() => {
                  setStep("type")
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {step === "type" ? "Tạo mới đơn từ" : `Tạo đơn ${meta.label}`}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === "type"
                  ? "Chọn loại đơn bạn muốn gửi"
                  : "Điền thông tin chi tiết và xác nhận"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Step 1: Type picker */}
          {step === "type" && (
            <div className="p-6 grid grid-cols-2 gap-4">
              {Object.entries(APP_TYPE_META).map(([type, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(ROUTES.APPLICATION.CREATE.replace(":type", type))
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 text-left hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] bg-background"
                  >
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${m.color} ${m.bg}`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-700">{m.label}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{m.hint}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Details form */}
          {step === "details" && (
            <form
              id="submit-form"
              onSubmit={(e) => {
                void handleSubmit(e)
              }}
              className="p-5 flex flex-col gap-4"
            >
              {/* Type badge */}
              <div
                className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}
              >
                <meta.icon size={16} className={meta.color} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    {selectedType === APPLICATION_TYPES.LATE_EARLY.LABEL
                      ? "Ngày làm việc *"
                      : selectedType === APPLICATION_TYPES.RESIGNATION.LABEL
                        ? "Ngày thôi việc *"
                        : "Ngày bắt đầu *"}
                  </label>
                  <DatePicker
                    value={form.startDate || null}
                    onChange={(val) => {
                      set("startDate", val || "");
                    }}
                    placeholder="Chọn ngày..."
                    size="sm"
                  />
                </div>
                {!(
                  [
                    APPLICATION_TYPES.OVERTIME.LABEL,
                    APPLICATION_TYPES.SHIFT_SWAP.LABEL,
                    APPLICATION_TYPES.LATE_EARLY.LABEL,
                    APPLICATION_TYPES.RESIGNATION.LABEL,
                  ] as string[]
                ).includes(selectedType) && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Ngày kết thúc</label>
                    <DatePicker
                      value={form.endDate || null}
                      minDate={form.startDate}
                      onChange={(val) => {
                        set("endDate", val || "");
                      }}
                      placeholder="Chọn ngày kết thúc..."
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* ── LEAVE ── */}
              {selectedType === APPLICATION_TYPES.LEAVE.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại nghỉ phép *</label>
                    <Select
                      value={form.leaveType}
                      onValueChange={(val) => {
                        set("leaveType", val)
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-full bg-background">
                        <SelectValue placeholder="Chọn loại nghỉ phép..." />
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([REGIME_TYPE.PAID, REGIME_TYPE.UNPAID] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => {
                            set("leaveRegimeType", rt)
                          }}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.leaveRegimeType === rt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {rt === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── OVERTIME ── */}
              {selectedType === APPLICATION_TYPES.OVERTIME.LABEL && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">ID Ca làm việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập CUID ca làm việc..."
                    value={form.employeeShiftId}
                    onChange={(e) => {
                      set("employeeShiftId", e.target.value)
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {/* ── LATE / EARLY ── */}
              {selectedType === APPLICATION_TYPES.LATE_EARLY.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Ca làm việc *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => {
                        set("employeeShiftId", e.target.value)
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Loại *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([true, false] as const).map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => {
                            set("isLate", v)
                          }}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.isLate === v
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {v ? "Đi muộn" : "Về sớm"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Số phút (1–480) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={480}
                      value={form.durationMinutes}
                      onChange={(e) => {
                        set("durationMinutes", Number(e.target.value))
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── SHIFT SWAP ── */}
              {selectedType === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">ID Ca của bạn *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => {
                        set("employeeShiftId", e.target.value)
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      ID Nhân viên muốn đổi (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="CUID nhân viên..."
                      value={form.swapWithEmployeeId}
                      onChange={(e) => {
                        set("swapWithEmployeeId", e.target.value)
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      ID Ca muốn đổi sang (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="CUID ca làm việc..."
                      value={form.swapWithShiftId}
                      onChange={(e) => {
                        set("swapWithShiftId", e.target.value)
                      }}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── WFH ── */}
              {selectedType === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
                <div className="flex flex-col gap-1.5">
                  {/* Backend field name: "location" */}
                  <label className="text-xs font-semibold text-slate-600">Địa điểm làm việc</label>
                  <input
                    type="text"
                    placeholder="VD: Tại nhà, Quán cà phê..."
                    value={form.location}
                    onChange={(e) => {
                      set("location", e.target.value)
                    }}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Lý do{" "}
                  <span className="text-slate-400 font-normal">(tối thiểu 5 ký tự nếu điền)</span>
                </label>
                <textarea
                  rows={3}
                  minLength={5}
                  placeholder="Nhập lý do gửi đơn..."
                  value={form.reason}
                  onChange={(e) => {
                    set("reason", e.target.value)
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Thông tin bổ sung (nếu có)..."
                  value={form.note}
                  onChange={(e) => {
                    set("note", e.target.value)
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="border-t border-slate-100 px-5 py-4 flex gap-3 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setStep("type")
              }}
              className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Quay lại
            </button>
            <button
              type="submit"
              form="submit-form"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-full text-sm font-bold transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Gửi đơn
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
