import { useState } from "react"
import { Calendar, CalendarClock, Clock, Layers, MapPin, Phone, UserCheck, Video } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INTERVIEW_FORMAT } from "@/config/entities/recruitment.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { useCreateInterview } from "@/hooks/recruitment/use-recruitment-queries"
import type { KanbanApplication } from "@/types/recruitment.types"

interface ScheduleInterviewDialogProps {
  applications: KanbanApplication[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function ScheduleInterviewDialog({ applications, open, onOpenChange, onCreated }: ScheduleInterviewDialogProps) {
  const [applicationId, setApplicationId] = useState("")
  const [title, setTitle] = useState("")
  const [format, setFormat] = useState<string>(INTERVIEW_FORMAT.VIDEO_CALL)
  const [scheduledAt, setScheduledAt] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [interviewerId, setInterviewerId] = useState("")
  const { data: employeeData } = useEmployees({ limit: 200 }, { enabled: open })
  const createInterview = useCreateInterview()
  const employees = employeeData?.data ?? []

  const reset = () => {
    setApplicationId("")
    setTitle("")
    setFormat(INTERVIEW_FORMAT.VIDEO_CALL)
    setScheduledAt("")
    setDurationMinutes("60")
    setInterviewerId("")
  }

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const submit = () => {
    const application = applications.find((item) => item.id === applicationId)
    if (!application || !scheduledAt || !interviewerId) return

    createInterview.mutate({
      applicationId,
      title: title.trim(),
      roundNumber: (application.interviewRounds?.length ?? 0) + 1,
      format,
      scheduledAt: scheduledAt && !isNaN(new Date(scheduledAt).getTime())
        ? new Date(scheduledAt).toISOString()
        : new Date().toISOString(),
      durationMinutes: Number(durationMinutes),
      interviewerIds: [interviewerId],
    }, {
      onSuccess: () => {
        onCreated()
        close(false)
      },
    })
  }

  const selectedAppStages = [
    { id: "pv1", name: "Phỏng vấn vòng 1" },
    { id: "pv2", name: "Phỏng vấn vòng 2" },
    { id: "pv_hr", name: "Phỏng vấn HR" },
    { id: "pv_tech", name: "Phỏng vấn Chuyên môn" },
  ]

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
        <DialogHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">Tạo lịch phỏng vấn mới</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Chọn ứng viên, vòng phỏng vấn & thời gian hẹn</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Ứng viên</Label>
            <Select value={applicationId} onValueChange={setApplicationId}>
              <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                <SelectValue placeholder="-- Chọn ứng viên cần lên lịch --" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border bg-popover shadow-lg max-h-56">
                {applications.map((application) => (
                  <SelectItem key={application.id} value={application.id} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                        {application.candidate.fullName.charAt(0)}
                      </div>
                      <span className="font-semibold">{application.candidate.fullName}</span>
                      <span className="text-muted-foreground text-[10px]">({application.candidate.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <span>Vòng phỏng vấn (Cột Kanban)</span>
            </Label>
            <Select value={title} onValueChange={setTitle}>
              <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                <SelectValue placeholder="-- Chọn vòng phỏng vấn theo Cột Kanban --" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                {selectedAppStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.name} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="font-semibold">{stage.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format, Duration & Scheduled DateTime on 1 Single Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Col 1: Format */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Video className="size-3 text-blue-500" />
                <span>Hình thức</span>
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                  <SelectItem value={INTERVIEW_FORMAT.VIDEO_CALL} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Video className="size-3 text-blue-500" />
                      <span>Online</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={INTERVIEW_FORMAT.IN_PERSON} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-emerald-500" />
                      <span>Trực tiếp</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={INTERVIEW_FORMAT.PHONE} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3 text-purple-500" />
                      <span>Điện thoại</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Col 2: Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock className="size-3 text-amber-500" />
                <span>Thời lượng</span>
              </Label>
              <Select value={String(durationMinutes)} onValueChange={setDurationMinutes}>
                <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                  <SelectItem value="30" className="text-xs font-medium">30 phút</SelectItem>
                  <SelectItem value="45" className="text-xs font-medium">45 phút</SelectItem>
                  <SelectItem value="60" className="text-xs font-medium">60 phút</SelectItem>
                  <SelectItem value="90" className="text-xs font-medium">90 phút</SelectItem>
                  <SelectItem value="120" className="text-xs font-medium">120 phút</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Col 3: Scheduled DateTime (Shadcn Popover) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <CalendarClock className="size-3 text-emerald-500" />
                <span>Thời gian</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start rounded-2xl border border-border/70 bg-background px-3 text-xs font-semibold hover:border-primary/50 transition-colors shadow-2xs"
                  >
                    <Calendar className="mr-1.5 size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {scheduledAt
                        ? new Date(scheduledAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
                        : "Chọn ngày & giờ"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3 rounded-2xl space-y-3 bg-popover border border-border shadow-xl">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Chọn ngày</Label>
                    <DatePicker
                      value={scheduledAt ? scheduledAt.split("T")[0] : null}
                      onChange={(val) => {
                        const timeVal = scheduledAt.split("T")[1] || "09:00";
                        setScheduledAt(val ? `${val}T${timeVal}` : "");
                      }}
                      size="sm"
                      placeholder="Chọn ngày phỏng vấn..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Chọn giờ phỏng vấn</Label>
                    <Select
                      value={scheduledAt.split("T")[1]?.substring(0, 5) || "09:00"}
                      onValueChange={(timeVal) => {
                        const dateVal = scheduledAt.split("T")[0] || new Date().toISOString().split("T")[0]
                        setScheduledAt(`${dateVal}T${timeVal}`)
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border/70 text-xs font-semibold">
                        <SelectValue placeholder="Chọn giờ" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 rounded-xl">
                        {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map((t) => (
                          <SelectItem key={t} value={t} className="text-xs font-medium">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-purple-500" />
              <span>Người phỏng vấn chính</span>
            </Label>
            <Select value={interviewerId} onValueChange={setInterviewerId}>
              <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                <SelectValue placeholder="-- Chọn nhân viên phỏng vấn --" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border bg-popover shadow-lg max-h-56">
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                        {employee.fullName.charAt(0)}
                      </div>
                      <span className="font-semibold text-foreground">{employee.fullName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { close(false); }}
            className="h-9 rounded-full px-5 text-xs font-bold border-border/80 hover:bg-secondary"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!applicationId || !title.trim() || !scheduledAt || !interviewerId || createInterview.isPending}
            className="h-9 rounded-full px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            {createInterview.isPending ? "Đang tạo..." : "Xác nhận tạo lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
