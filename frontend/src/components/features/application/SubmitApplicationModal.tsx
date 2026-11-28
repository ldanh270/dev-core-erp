"use client"

import { APP_TYPE_META, LEAVE_TYPE_OPTIONS } from "@/components/attendance/attendance-ui.meta"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { APPLICATION_TYPES, REGIME_TYPE } from "@/config/entities/attendance.config"
import { ROUTES } from "@/config/routes.config"
import {
  type SubmitApplicationFormState,
  useSubmitApplicationForm,
} from "@/hooks/application/use-submit-application-form"
import { routerNavigate } from "@/lib/router-navigator"

import { useState } from "react"

import { ArrowLeft, Send, X } from "lucide-react"

function ApplicationTypePicker({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      {Object.entries(APP_TYPE_META).map(([type, m]) => {
        const Icon = m.icon
        return (
          <button
            key={type}
            type="button"
            onClick={() => {
              onClose()
              routerNavigate(ROUTES.APPLICATION.CREATE.replace(":type", type))
            }}
            className="flex items-center gap-4 p-4 rounded-xl border border-border text-left hover:shadow-md hover:border-primary/50 transition-all active:scale-[0.98] bg-card hover:bg-muted/40 cursor-pointer"
          >
            <div
              className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${m.color} ${m.bg}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{m.label}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{m.hint}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function SubmitApplicationDateFields({
  selectedType,
  meta,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  selectedType: string
  meta: {
    label: string
    color: string
    bg: string
    border: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }
  startDate: string
  endDate: string
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
}) {
  const Icon = meta.icon
  const hideEndDate = (
    [
      APPLICATION_TYPES.OVERTIME.LABEL,
      APPLICATION_TYPES.SHIFT_SWAP.LABEL,
      APPLICATION_TYPES.LATE_EARLY.LABEL,
      APPLICATION_TYPES.RESIGNATION.LABEL,
    ] as string[]
  ).includes(selectedType)

  return (
    <>
      <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
        <Icon size={16} className={meta.color} />
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            {selectedType === APPLICATION_TYPES.LATE_EARLY.LABEL
              ? "Ngày làm việc *"
              : selectedType === APPLICATION_TYPES.RESIGNATION.LABEL
                ? "Ngày thôi việc *"
                : "Ngày bắt đầu *"}
          </label>
          <DatePicker
            value={startDate || null}
            onChange={(val) => {
              onStartDateChange(val || "")
            }}
            placeholder="Chọn ngày..."
            size="sm"
          />
        </div>
        {!hideEndDate && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Ngày kết thúc</label>
            <DatePicker
              value={endDate || null}
              minDate={startDate}
              onChange={(val) => {
                onEndDateChange(val || "")
              }}
              placeholder="Chọn ngày kết thúc..."
              size="sm"
            />
          </div>
        )}
      </div>
    </>
  )
}

function SubmitApplicationTypeSpecificFields({
  selectedType,
  form,
  setFormField,
}: {
  selectedType: string
  form: SubmitApplicationFormState
  setFormField: <K extends keyof SubmitApplicationFormState>(
    k: K,
    v: SubmitApplicationFormState[K],
  ) => void
}) {
  return (
    <>
      {selectedType === APPLICATION_TYPES.LEAVE.LABEL && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Loại nghỉ phép *</label>
            <Select
              value={form.leaveType}
              onValueChange={(val) => {
                setFormField("leaveType", val)
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
            <label className="text-xs font-semibold text-muted-foreground">Chế độ lương *</label>
            <div className="grid grid-cols-2 gap-2">
              {([REGIME_TYPE.PAID, REGIME_TYPE.UNPAID] as const).map((rt) => (
                <Button
                  key={rt}
                  type="button"
                  variant={form.leaveRegimeType === rt ? "default" : "outline"}
                  onClick={() => {
                    setFormField("leaveRegimeType", rt)
                  }}
                  className="rounded-full h-10 text-xs font-semibold"
                >
                  {rt === REGIME_TYPE.PAID ? "Có lương" : "Không lương"}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedType === APPLICATION_TYPES.OVERTIME.LABEL && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">ID Ca làm việc *</label>
          <Input
            required
            placeholder="Nhập CUID ca làm việc..."
            value={form.employeeShiftId}
            onChange={(e) => {
              setFormField("employeeShiftId", e.target.value)
            }}
            className="font-mono bg-background"
          />
        </div>
      )}

      {selectedType === APPLICATION_TYPES.LATE_EARLY.LABEL && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">ID Ca làm việc *</label>
            <Input
              required
              placeholder="Nhập CUID ca làm việc..."
              value={form.employeeShiftId}
              onChange={(e) => setFormField("employeeShiftId", e.target.value)}
              className="font-mono bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Loại *</label>
            <div className="grid grid-cols-2 gap-2">
              {([true, false] as const).map((v) => (
                <Button
                  key={String(v)}
                  type="button"
                  variant={form.isLate === v ? "default" : "outline"}
                  onClick={() => {
                    setFormField("isLate", v)
                  }}
                  className="rounded-full h-10 text-xs font-semibold"
                >
                  {v ? "Đi muộn" : "Về sớm"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Số phút (1–480) *</label>
            <Input
              type="number"
              required
              min={1}
              max={480}
              value={form.durationMinutes}
              onChange={(e) => {
                setFormField("durationMinutes", Number(e.target.value))
              }}
              className="bg-background"
            />
          </div>
        </>
      )}

      {selectedType === APPLICATION_TYPES.SHIFT_SWAP.LABEL && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">ID Ca của bạn *</label>
            <Input
              required
              placeholder="Nhập CUID ca làm việc..."
              value={form.employeeShiftId}
              onChange={(e) => setFormField("employeeShiftId", e.target.value)}
              className="font-mono bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              ID Nhân viên muốn đổi (tùy chọn)
            </label>
            <Input
              placeholder="CUID nhân viên..."
              value={form.swapWithEmployeeId}
              onChange={(e) => {
                setFormField("swapWithEmployeeId", e.target.value)
              }}
              className="font-mono bg-background"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              ID Ca muốn đổi sang (tùy chọn)
            </label>
            <Input
              placeholder="CUID ca làm việc..."
              value={form.swapWithShiftId}
              onChange={(e) => {
                setFormField("swapWithShiftId", e.target.value)
              }}
              className="font-mono bg-background"
            />
          </div>
        </>
      )}

      {selectedType === APPLICATION_TYPES.WORK_FROM_HOME.LABEL && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Địa điểm làm việc</label>
          <Input
            placeholder="VD: Tại nhà, Quán cà phê..."
            value={form.location}
            onChange={(e) => {
              setFormField("location", e.target.value)
            }}
            className="bg-background"
          />
        </div>
      )}
    </>
  )
}

function SubmitApplicationReasonFields({
  reason,
  note,
  onReasonChange,
  onNoteChange,
}: {
  reason: string
  note: string
  onReasonChange: (val: string) => void
  onNoteChange: (val: string) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground">
          Lý do{" "}
          <span className="text-muted-foreground/70 font-normal">(tối thiểu 5 ký tự nếu điền)</span>
        </label>
        <Textarea
          rows={3}
          minLength={5}
          placeholder="Nhập lý do gửi đơn..."
          value={reason}
          onChange={(e) => {
            onReasonChange(e.target.value)
          }}
          className="rounded-xl border border-input bg-background resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground">Ghi chú thêm</label>
        <Input
          placeholder="Thông tin bổ sung (nếu có)..."
          value={note}
          onChange={(e) => {
            onNoteChange(e.target.value)
          }}
          className="bg-background"
        />
      </div>
    </>
  )
}

export interface SubmitModalProps {
  onClose: () => void
  onSuccess: () => void
  initialType?: string
}

export function SubmitApplicationModal({ onClose, onSuccess, initialType }: SubmitModalProps) {
  const [step, setStep] = useState<"type" | "details">(initialType ? "details" : "type")
  const selectedType = initialType || ""

  const { form, setFormField, isSubmitting, handleSubmit } = useSubmitApplicationForm({
    selectedType,
    onSuccess,
    onClose,
  })

  const meta =
    Object.entries(APP_TYPE_META).find(([k]) => k === selectedType)?.[1] ||
    APP_TYPE_META[APPLICATION_TYPES.LEAVE.LABEL]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className={`bg-background w-full ${step === "type" ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {step === "details" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStep("type")
                }}
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
              >
                <ArrowLeft size={16} />
              </Button>
            )}
            <div>
              <h2 className="text-base font-bold text-foreground">
                {step === "type" ? "Tạo mới đơn từ" : `Tạo đơn ${meta.label}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "type"
                  ? "Chọn loại đơn bạn muốn gửi"
                  : "Điền thông tin chi tiết và xác nhận"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === "type" ? (
            <ApplicationTypePicker onClose={onClose} />
          ) : (
            <form
              id="submit-form"
              onSubmit={(e) => {
                void handleSubmit(e)
              }}
              className="p-5 flex flex-col gap-4"
            >
              <SubmitApplicationDateFields
                selectedType={selectedType}
                meta={meta}
                startDate={form.startDate}
                endDate={form.endDate}
                onStartDateChange={(val) => setFormField("startDate", val)}
                onEndDateChange={(val) => setFormField("endDate", val)}
              />

              <SubmitApplicationTypeSpecificFields
                selectedType={selectedType}
                form={form}
                setFormField={setFormField}
              />

              <SubmitApplicationReasonFields
                reason={form.reason}
                note={form.note}
                onReasonChange={(val) => setFormField("reason", val)}
                onNoteChange={(val) => setFormField("note", val)}
              />
            </form>
          )}
        </div>

        {step === "details" && (
          <div className="border-t border-border px-5 py-4 flex gap-3 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("type")
              }}
              className="flex-1 rounded-full h-10 font-semibold"
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              form="submit-form"
              disabled={isSubmitting}
              className="flex-1 rounded-full h-10 font-bold gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Gửi đơn
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
