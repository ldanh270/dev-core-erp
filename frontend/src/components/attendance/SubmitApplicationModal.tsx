"use client"

import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { employeeApi, type IApprover } from "@/lib/api/employee.api"
import { ArrowLeft, Send, UserCheck, X } from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { DatePicker } from "@/components/common"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { APP_TYPE_META, LEAVE_TYPE_OPTIONS } from "./attendance-ui.meta"

export interface SubmitModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function SubmitApplicationModal({ onClose, onSuccess }: SubmitModalProps) {
  const { isSubmitting, submitApplication } = useSubmitApplication()

  const [step, setStep] = useState<"type" | "details">("type")
  const [selectedType, setSelectedType] = useState<string>("")
  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    note: "",
    assignedToId: "",
    // leave
    leaveType: "annual_leave" as string,
    leaveRegimeType: "paid" as "paid" | "unpaid",
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
    // business_trip
    destination: "",
    purpose: "",
    // regime
    regimeType: "paid" as "paid" | "unpaid",
    reducedMinutesPerDay: 0,
    applyToStart: false,
    applyToEnd: false,
    documentUrl: "",
  })

  useEffect(() => {
    employeeApi.getApprovers().then(setApprovers).catch(() => {})
  }, [])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu")
      return
    }

    // Build type-specific detail matching the backend Zod schemas exactly
    let detail: Record<string, unknown> = {}

    switch (selectedType) {
      case "leave":
        detail = {
          leaveType: form.leaveType,
          regimeType: form.leaveRegimeType,
        }
        break

      case "overtime":
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca làm việc")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        break

      case "late_early":
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

      case "shift_swap":
        if (!form.employeeShiftId.trim()) {
          toast.error("Vui lòng nhập ID ca của bạn")
          return
        }
        detail = { employeeShiftId: form.employeeShiftId.trim() }
        if (form.swapWithEmployeeId.trim()) detail.swapWithEmployeeId = form.swapWithEmployeeId.trim()
        if (form.swapWithShiftId.trim()) detail.swapWithShiftId = form.swapWithShiftId.trim()
        break

      case "work_from_home":
        detail = form.location.trim() ? { location: form.location.trim() } : {}
        break

      case "business_trip":
        if (!form.destination.trim()) {
          toast.error("Vui lòng nhập địa điểm công tác")
          return
        }
        detail = { location: form.destination.trim() }
        if (form.purpose.trim()) detail.purpose = form.purpose.trim()
        break

      case "regime":
        detail = {
          regimeType: form.regimeType,
          reducedMinutesPerDay: form.reducedMinutesPerDay,
          applyToStart: form.applyToStart,
          applyToEnd: form.applyToEnd,
        }
        if (form.documentUrl.trim()) detail.documentUrl = form.documentUrl.trim()
        break
    }

    const success = await submitApplication({
      type: selectedType,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      reason: form.reason || undefined,
      note: form.note || undefined,
      assignedToId: form.assignedToId || undefined,
      detail,
    })

    if (success) {
      onSuccess()
      onClose()
    }
  }

  const meta = Object.entries(APP_TYPE_META).find(([k]) => k === selectedType)?.[1] || APP_TYPE_META["leave"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-background w-full max-w-lg rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <button
                type="button"
                onClick={() => { setStep("type"); }}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-foreground">
                {step === "type" ? "Chọn loại đơn" : `Tạo đơn ${meta.label}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "type"
                  ? "Chọn loại đơn bạn muốn gửi"
                  : "Điền thông tin chi tiết và xác nhận"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground/70"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Step 1: Type picker */}
          {step === "type" && (
            <div className="p-5 grid grid-cols-2 gap-3">
              {Object.entries(APP_TYPE_META).map(([type, m]) => {
                const Icon = m.icon
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type)
                      setStep("details")
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all active:scale-[0.98] ${m.border} ${m.bg}`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${m.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{m.hint}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Details form */}
          {step === "details" && (
            <form id="submit-form" onSubmit={(e) => { void handleSubmit(e); }} className="p-5 flex flex-col gap-4">
              {/* Type badge */}
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
                <meta.icon size={16} className={meta.color} />
                <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ngày bắt đầu *</label>
                  <DatePicker
                    value={form.startDate || null}
                    onChange={(val) => { set("startDate", val || ""); }}
                    placeholder="Chọn ngày bắt đầu..."
                    size="sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Ngày kết thúc</label>
                  <DatePicker
                    value={form.endDate || null}
                    minDate={form.startDate}
                    onChange={(val) => { set("endDate", val || ""); }}
                    placeholder="Chọn ngày kết thúc..."
                    size="sm"
                  />
                </div>
              </div>

              {/* ── LEAVE ── */}
              {selectedType === "leave" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Loại nghỉ phép *</label>
                    <Select
                      value={form.leaveType}
                      onValueChange={(val) => { set("leaveType", val); }}
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
                    <label className="text-xs font-semibold text-muted-foreground">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["paid", "unpaid"] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => { set("leaveRegimeType", rt); }}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.leaveRegimeType === rt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-input text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {rt === "paid" ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── OVERTIME ── */}
              {selectedType === "overtime" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ID Ca làm việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập CUID ca làm việc..."
                    value={form.employeeShiftId}
                    onChange={(e) => { set("employeeShiftId", e.target.value); }}
                    className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {/* ── LATE / EARLY ── */}
              {selectedType === "late_early" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">ID Ca làm việc *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => { set("employeeShiftId", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Loại *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([true, false] as const).map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => { set("isLate", v); }}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.isLate === v
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-input text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {v ? "Đi muộn" : "Về sớm"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Số phút (1–480) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={480}
                      value={form.durationMinutes}
                      onChange={(e) => { set("durationMinutes", Number(e.target.value)); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── SHIFT SWAP ── */}
              {selectedType === "shift_swap" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">ID Ca của bạn *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập CUID ca làm việc..."
                      value={form.employeeShiftId}
                      onChange={(e) => { set("employeeShiftId", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">ID Nhân viên muốn đổi (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="CUID nhân viên..."
                      value={form.swapWithEmployeeId}
                      onChange={(e) => { set("swapWithEmployeeId", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">ID Ca muốn đổi sang (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="CUID ca làm việc..."
                      value={form.swapWithShiftId}
                      onChange={(e) => { set("swapWithShiftId", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── WFH ── */}
              {selectedType === "work_from_home" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Địa điểm làm việc</label>
                  <input
                    type="text"
                    placeholder="VD: Tại nhà, Quán cà phê..."
                    value={form.location}
                    onChange={(e) => { set("location", e.target.value); }}
                    className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              )}

              {/* ── BUSINESS TRIP ── */}
              {selectedType === "business_trip" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Địa điểm công tác *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Hà Nội, TP.HCM..."
                      value={form.destination}
                      onChange={(e) => { set("destination", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Mục đích chuyến đi</label>
                    <input
                      type="text"
                      placeholder="Mô tả mục đích..."
                      value={form.purpose}
                      onChange={(e) => { set("purpose", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* ── REGIME ── */}
              {selectedType === "regime" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Chế độ lương *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["paid", "unpaid"] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => { set("regimeType", rt); }}
                          className={`py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                            form.regimeType === rt
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-input text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {rt === "paid" ? "Có lương" : "Không lương"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Số phút giảm/ngày (0–480) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={480}
                      value={form.reducedMinutesPerDay}
                      onChange={(e) => { set("reducedMinutesPerDay", Number(e.target.value)); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Áp dụng</label>
                    <div className="flex gap-4">
                      {(
                        [
                          { key: "applyToStart", label: "Đầu buổi" },
                          { key: "applyToEnd", label: "Cuối buổi" },
                        ] as const
                      ).map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={key === "applyToStart" ? form.applyToStart : form.applyToEnd}
                            onChange={(e) => { set(key, e.target.checked); }}
                            className="accent-primary"
                          />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      URL chứng từ (tùy chọn)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.documentUrl}
                      onChange={(e) => { set("documentUrl", e.target.value); }}
                      className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </>
              )}

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Lý do{" "}
                  <span className="text-muted-foreground/70 font-normal">(tối thiểu 5 ký tự nếu điền)</span>
                </label>
                <textarea
                  rows={3}
                  minLength={5}
                  placeholder="Nhập lý do gửi đơn..."
                  value={form.reason}
                  onChange={(e) => { set("reason", e.target.value); }}
                  className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>

              {/* Assigned Approver */}
              {approvers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <UserCheck size={13} className="text-primary" />
                    Người duyệt đơn
                    <span className="text-muted-foreground/70 font-normal">(tùy chọn)</span>
                  </label>
                  <Select
                    value={form.assignedToId || "none"}
                    onValueChange={(val) => { set("assignedToId", val === "none" ? "" : val); }}
                  >
                    <SelectTrigger className="h-10 rounded-full bg-background">
                      <SelectValue placeholder="-- Không chỉ định (bất kỳ ai có thẩm quyền) --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không chỉ định (bất kỳ ai có thẩm quyền) --</SelectItem>
                      {approvers.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.fullName}
                          {a.position ? ` — ${a.position}` : ""}
                          {" "}({a.role.replace(/_/g, " ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Thông tin bổ sung (nếu có)..."
                  value={form.note}
                  onChange={(e) => { set("note", e.target.value); }}
                  className="px-3 py-2 border border-input bg-transparent rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "details" && (
          <div className="border-t border-border px-5 py-4 flex gap-3 bg-muted/30">
            <button
              type="button"
              onClick={() => { setStep("type"); }}
              className="flex-1 py-2.5 border border-input rounded-full text-sm font-semibold text-foreground hover:bg-muted transition-colors"
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
