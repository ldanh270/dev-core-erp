import { EntityFormPage } from "@/components/common/entity-form-page"
import { Badge } from "@/components/ui/badge"
import { DatePicker, TimePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  COMPONENT_TYPE,
  PAYROLL_STATUS_BADGE,
  PAYROLL_STATUS_LABELS,
  PAYSLIP_RECEIPT_STATUS_LABELS,
} from "@/config/entities/payroll.config"
import { useSubmitPayslipFeedback } from "@/hooks/payroll/use-my-payslips"
import { formatCurrency } from "@/lib/utils"
import type { IPayslip } from "@/types/payroll.types"

import { useState } from "react"

import { Activity, Clock, DollarSign, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface PayslipDetailPageProps {
  payslip: IPayslip | null
  onClose: () => void
}

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  on_time: "Đúng giờ",
  late: "Đi muộn",
  early_leave: "Về sớm",
  absent: "Vắng",
  overtime: "Tăng ca",
  no_record: "Chưa có dữ liệu",
}

const ATTENDANCE_STATUS_LABEL_MAP = new Map(Object.entries(ATTENDANCE_STATUS_LABELS))

function formatWorkHours(hours: number) {
  return `${Math.max(0, hours).toFixed(2).replace(/\.00$/, "")} giờ`
}

function getAttendanceStatusLabel(status: string) {
  return ATTENDANCE_STATUS_LABEL_MAP.get(status) || status
}

export function PayslipDetailPage({ payslip, onClose }: PayslipDetailPageProps) {
  const submitFeedback = useSubmitPayslipFeedback()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackDate, setFeedbackDate] = useState("")
  const [feedbackReason, setFeedbackReason] = useState("")
  const [checkInAt, setCheckInAt] = useState("")
  const [checkOutAt, setCheckOutAt] = useState("")

  if (!payslip) {
    return (
      <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
        <div className="flex h-40 items-center justify-center text-destructive bg-background border border-border rounded-xl shadow-none">
          <p>Không thể tải thông tin phiếu lương.</p>
        </div>
      </EntityFormPage>
    )
  }

  const openFeedback = (date?: string) => {
    setFeedbackDate(date ?? payslip.dailyWorkLogs?.[0]?.date ?? "")
    setFeedbackReason("")
    setCheckInAt("")
    setCheckOutAt("")
    setFeedbackOpen(true)
  }

  const handleSubmitFeedback = () => {
    if (!feedbackDate || !feedbackReason.trim()) {
      toast.error("Chọn ngày và nhập nội dung feedback")
      return
    }
    submitFeedback.mutate(
      {
        payslipId: payslip.id,
        payload: {
          date: feedbackDate,
          reason: feedbackReason,
          checkInAt: checkInAt || null,
          checkOutAt: checkOutAt || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi feedback phiếu lương")
          setFeedbackOpen(false)
        },
        onError: () => {
          toast.error("Không gửi được feedback. Kiểm tra ngày có ca làm rồi thử lại.")
        },
      },
    )
  }

  const dailyWorkLogs = payslip.dailyWorkLogs ?? []

  return (
    <EntityFormPage title="Chi tiết phiếu lương" isReadOnly={true} onBack={onClose}>
      <div className="space-y-6">
        {/* Overview Card */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none p-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Thực Lãnh
              </span>
              <div className="text-5xl font-bold text-primary">
                {formatCurrency(payslip.netSalary)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {payslip.status ? (
                  <Badge
                    variant={PAYROLL_STATUS_BADGE[payslip.status]}
                    className="rounded-full shadow-none"
                  >
                    {PAYROLL_STATUS_LABELS[payslip.status]}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full shadow-none">
                  {payslip.receiptStatus
                    ? PAYSLIP_RECEIPT_STATUS_LABELS[payslip.receiptStatus]
                    : "Chưa nhận"}
                </Badge>
                {payslip.isPreview ? (
                  <Badge variant="secondary" className="rounded-full shadow-none">
                    Phiếu xem trước
                  </Badge>
                ) : null}
              </div>
            </div>
            {payslip.canFeedback ? (
              <Button
                type="button"
                className="rounded-full"
                onClick={() => {
                  openFeedback()
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </Button>
            ) : null}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Tổng kết chấm công</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Ngày công</span>
                <span className="font-semibold text-2xl">{payslip.workingDays}</span>
              </div>
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Vắng mặt</span>
                <span className="font-semibold text-2xl text-destructive">
                  {payslip.absentDays}
                </span>
              </div>
              <div className="rounded-xl border p-4 flex flex-col items-center justify-center bg-card">
                <span className="text-muted-foreground mb-1">Tăng ca (phút)</span>
                <span className="font-semibold text-2xl text-success">
                  {payslip.overtimeMinutes}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="daily-work" className="bg-background border border-border rounded-xl overflow-hidden shadow-none gap-0">
          <div className="px-6 py-4 border-b border-border bg-muted/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="w-full sm:w-auto justify-start">
              <TabsTrigger value="daily-work" className="gap-2">
                <Clock className="h-4 w-4" />
                Công theo ngày
              </TabsTrigger>
              <TabsTrigger value="additions" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Thu nhập
                <span className="hidden md:inline text-success">
                  +{formatCurrency(payslip.totalAdditions)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="deductions" className="gap-2">
                <Activity className="h-4 w-4" />
                Khấu trừ
                <span className="hidden md:inline text-destructive">
                  -{formatCurrency(payslip.totalDeductions)}
                </span>
              </TabsTrigger>
            </TabsList>
            {payslip.canFeedback ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => {
                  openFeedback()
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Báo sai lệch
              </Button>
            ) : null}
          </div>

          <TabsContent value="daily-work" className="m-0">
            <div className="max-h-[380px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/40">
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Ca</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Giờ làm</TableHead>
                    <TableHead className="text-right">Tăng ca</TableHead>
                    <TableHead className="text-right">Muộn/Sớm</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyWorkLogs.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        Ngày {day.dayOfMonth}
                        <div className="text-xs text-muted-foreground">{day.date}</div>
                      </TableCell>
                      <TableCell>{day.shiftName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full shadow-none">
                          {getAttendanceStatusLabel(day.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatWorkHours(day.workHours)}</TableCell>
                      <TableCell className="text-right">{day.overtimeMinutes} phút</TableCell>
                      <TableCell className="text-right">
                        {day.lateMinutes + day.earlyLeaveMinutes} phút
                      </TableCell>
                      <TableCell className="text-right">
                        {payslip.canFeedback ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => {
                              openFeedback(day.date)
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                  {dailyWorkLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Chưa có dữ liệu công theo ngày.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="additions" className="m-0">
            <div className="p-6 space-y-3">
              {payslip.details
                .filter((d) => d.type === COMPONENT_TYPE.ADDITION)
                .map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center gap-4 py-3 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground font-medium">{detail.name}</span>
                    <span className="font-semibold text-success whitespace-nowrap">
                      +{formatCurrency(detail.value)}
                    </span>
                  </div>
                ))}
              {payslip.details.filter((d) => d.type === COMPONENT_TYPE.ADDITION).length === 0 && (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-muted-foreground italic text-sm">Không có phụ cấp</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deductions" className="m-0">
            <div className="p-6 space-y-3">
              {payslip.details
                .filter((d) => d.type === COMPONENT_TYPE.DEDUCTION)
                .map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center gap-4 py-3 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground font-medium">{detail.name}</span>
                    <span className="font-semibold text-destructive whitespace-nowrap">
                      -{formatCurrency(detail.value)}
                    </span>
                  </div>
                ))}
              {payslip.details.filter((d) => d.type === COMPONENT_TYPE.DEDUCTION).length === 0 && (
                <div className="flex h-24 items-center justify-center">
                  <p className="text-muted-foreground italic text-sm">Không có khấu trừ</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-[520px] rounded-xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-border">
            <DialogTitle className="text-base">Feedback phiếu lương</DialogTitle>
            <DialogDescription className="text-sm">
              Chọn ngày bị sai và mô tả vấn đề để HR kiểm tra trước khi chốt lương.
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="payroll-feedback-date" className="text-xs font-medium text-muted-foreground">
                Ngày sai lệch
              </Label>
              <DatePicker
                id="payroll-feedback-date"
                value={feedbackDate || null}
                onChange={(val) => {
                  setFeedbackDate(val || "");
                }}
                placeholder="Chọn ngày sai lệch..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="payroll-feedback-check-in" className="text-xs font-medium text-muted-foreground">
                  Giờ vào đúng
                </Label>
                <TimePicker
                  id="payroll-feedback-check-in"
                  value={checkInAt}
                  onChange={setCheckInAt}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-feedback-check-out" className="text-xs font-medium text-muted-foreground">
                  Giờ ra đúng
                </Label>
                <TimePicker
                  id="payroll-feedback-check-out"
                  value={checkOutAt}
                  onChange={setCheckOutAt}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-feedback-reason" className="text-xs font-medium text-muted-foreground">
                Nội dung
              </Label>
              <Textarea
                id="payroll-feedback-reason"
                value={feedbackReason}
                onChange={(event) => {
                  setFeedbackReason(event.target.value)
                }}
                placeholder="Ví dụ: ngày này em có làm nhưng hệ thống tính thiếu giờ..."
                className="min-h-24 resize-none rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="px-5 py-4 border-t border-border bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setFeedbackOpen(false)
              }}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={handleSubmitFeedback}
              disabled={submitFeedback.isPending}
            >
              Gửi feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EntityFormPage>
  )
}
