import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INTERVIEW_FORMAT } from "@/config/entities/recruitment.config"
import type { Employee } from "@/types/employee.types"
import type { RecruitmentPipelineStage } from "@/types/recruitment.types"
import { format } from "date-fns"
import {
  Calendar,
  CalendarClock,
  Clock,
  Layers,
  MapPin,
  Phone,
  UserCheck,
  Video,
} from "lucide-react"

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

function InterviewStageSelectField({
  title,
  setTitle,
  dynamicStages,
}: {
  title: string
  setTitle: (v: string) => void
  dynamicStages: RecruitmentPipelineStage[]
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center justify-between text-xs font-bold text-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-primary" />
          <span>Vòng phỏng vấn (Cột Kanban)</span>
        </div>
        <span className="text-[10px] font-normal text-muted-foreground">Tự động gắn vào Kanban</span>
      </Label>
      {dynamicStages.length > 0 ? (
        <Select value={title} onValueChange={setTitle}>
          <SelectTrigger className="h-10 rounded-full border-border/70 bg-background text-xs font-semibold transition-colors hover:border-primary/50">
            <SelectValue placeholder="-- Chọn giai đoạn phỏng vấn từ Cột Kanban --" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
            {dynamicStages.map((stg) => (
              <SelectItem
                key={stg.id}
                value={stg.name}
                className="cursor-pointer rounded-xl py-2 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="font-semibold">{stg.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
          placeholder="Ví dụ: Phỏng vấn vòng 1, Phỏng vấn vòng 2"
          className="h-10 rounded-full border-border/70 bg-background text-xs font-semibold"
        />
      )}
    </div>
  )
}

function InterviewSchedulePicker({
  formatVal,
  setFormatVal,
  duration,
  setDuration,
  scheduledAt,
  setScheduledAt,
}: {
  formatVal: string
  setFormatVal: (v: string) => void
  duration: string
  setDuration: (v: string) => void
  scheduledAt: string
  setScheduledAt: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1 text-xs font-bold text-foreground">
          <Video className="size-3 text-blue-500" />
          <span>Hình thức</span>
        </Label>
        <Select value={formatVal} onValueChange={setFormatVal}>
          <SelectTrigger className="h-10 rounded-full border-border/70 bg-background text-xs font-semibold transition-colors hover:border-primary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
            <SelectItem
              value={INTERVIEW_FORMAT.VIDEO_CALL}
              className="cursor-pointer rounded-xl py-1.5 text-xs font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Video className="size-3 text-blue-500" />
                <span>Online</span>
              </div>
            </SelectItem>
            <SelectItem
              value={INTERVIEW_FORMAT.IN_PERSON}
              className="cursor-pointer rounded-xl py-1.5 text-xs font-medium"
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3 text-emerald-500" />
                <span>Trực tiếp</span>
              </div>
            </SelectItem>
            <SelectItem
              value={INTERVIEW_FORMAT.PHONE}
              className="cursor-pointer rounded-xl py-1.5 text-xs font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Phone className="size-3 text-purple-500" />
                <span>Điện thoại</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1 text-xs font-bold text-foreground">
          <Clock className="size-3 text-amber-500" />
          <span>Thời lượng</span>
        </Label>
        <Select value={String(duration)} onValueChange={setDuration}>
          <SelectTrigger className="h-10 rounded-full border-border/70 bg-background text-xs font-semibold transition-colors hover:border-primary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
            <SelectItem value="30" className="text-xs font-medium">
              30 phút
            </SelectItem>
            <SelectItem value="45" className="text-xs font-medium">
              45 phút
            </SelectItem>
            <SelectItem value="60" className="text-xs font-medium">
              60 phút
            </SelectItem>
            <SelectItem value="90" className="text-xs font-medium">
              90 phút
            </SelectItem>
            <SelectItem value="120" className="text-xs font-medium">
              120 phút
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1 text-xs font-bold text-foreground">
          <CalendarClock className="size-3 text-emerald-500" />
          <span>Thời gian</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-start rounded-full border border-border/70 bg-background px-3 text-xs font-semibold shadow-2xs transition-colors hover:border-primary/50"
            >
              <Calendar className="mr-1.5 size-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">
                {scheduledAt ? format(new Date(scheduledAt), "HH:mm, dd/MM") : "Chọn ngày & giờ"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-64 space-y-3 rounded-xl border border-border bg-popover p-3 shadow-xl"
          >
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">Chọn ngày</Label>
              <DatePicker
                value={scheduledAt ? scheduledAt.split("T")[0] : null}
                onChange={(val) => {
                  const timeVal = scheduledAt.split("T")[1] || "09:00"
                  setScheduledAt(val ? `${val}T${timeVal}` : "")
                }}
                size="sm"
                placeholder="Chọn ngày..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground">
                Chọn giờ phỏng vấn
              </Label>
              <Select
                value={scheduledAt.split("T")[1]?.substring(0, 5) || "09:00"}
                onValueChange={(timeVal) => {
                  const dateVal = scheduledAt
                    ? scheduledAt.split("T")[0]
                    : format(new Date(), "yyyy-MM-dd")
                  setScheduledAt(`${dateVal}T${timeVal}`)
                }}
              >
                <SelectTrigger className="h-9 rounded-full border-border/70 text-xs font-semibold">
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent className="max-h-48 rounded-xl">
                  {TIME_SLOTS.map((t) => (
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
  )
}

function InterviewInterviewerSelectField({
  interviewerId,
  setInterviewerId,
  employees,
}: {
  interviewerId: string
  setInterviewerId: (v: string) => void
  employees: Employee[]
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <UserCheck className="size-3.5 text-purple-500" />
        <span>Người phỏng vấn chính (Interviewer)</span>
      </Label>
      <Select value={interviewerId} onValueChange={setInterviewerId}>
        <SelectTrigger className="h-10 rounded-full border-border/70 bg-background text-xs font-semibold transition-colors hover:border-primary/50">
          <SelectValue placeholder="-- Chọn người phỏng vấn phụ trách --" />
        </SelectTrigger>
        <SelectContent className="max-h-56 rounded-xl border-border bg-popover shadow-lg">
          {employees.map((emp) => (
            <SelectItem
              key={emp.id}
              value={emp.id}
              className="cursor-pointer rounded-xl py-2 text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {emp.fullName.charAt(0)}
                </div>
                <span className="font-semibold text-foreground">{emp.fullName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export interface InterviewRoundFieldsProps {
  title: string
  setTitle: (v: string) => void
  formatVal: string
  setFormatVal: (v: string) => void
  duration: string
  setDuration: (v: string) => void
  scheduledAt: string
  setScheduledAt: (v: string) => void
  interviewerId: string
  setInterviewerId: (v: string) => void
  dynamicStages: RecruitmentPipelineStage[]
  employees: Employee[]
}

/**
 * Pure UI presentational component composing input controls for interview round attributes:
 * stage selection, format picker, duration, datetime slot picker, and interviewer assignment.
 */
export function InterviewRoundFields({
  title,
  setTitle,
  formatVal,
  setFormatVal,
  duration,
  setDuration,
  scheduledAt,
  setScheduledAt,
  interviewerId,
  setInterviewerId,
  dynamicStages,
  employees,
}: InterviewRoundFieldsProps) {
  return (
    <div className="space-y-4 py-3">
      <InterviewStageSelectField
        title={title}
        setTitle={setTitle}
        dynamicStages={dynamicStages}
      />

      <InterviewSchedulePicker
        formatVal={formatVal}
        setFormatVal={setFormatVal}
        duration={duration}
        setDuration={setDuration}
        scheduledAt={scheduledAt}
        setScheduledAt={setScheduledAt}
      />

      <InterviewInterviewerSelectField
        interviewerId={interviewerId}
        setInterviewerId={setInterviewerId}
        employees={employees}
      />
    </div>
  )
}
