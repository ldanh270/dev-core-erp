/**
 * Modal for PT (and project members) to log task hours.
 * Creates pending SpentTime rows — lead must approve before payroll includes them.
 * workTimeType=overtime applies OT multiplier; backend blocks edits after approval.
 */
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import {
  SPENT_TIME_ACTIVITIES,
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_WORK_TIME_TYPE,
  SPENT_TIME_WORK_TIME_TYPES,
} from "@/config/entities/project.config"
import { useLogTimeForm } from "@/hooks/project/useLogTimeForm"
import type { SpentTime, SpentTimeActivity, SpentTimeWorkTimeType } from "@/types/spent-time.types"

const formatLabel = (val: string) => {
  if (val === SPENT_TIME_ACTIVITY.DEVELOP) return "Phát triển (Develop)"
  if (val === SPENT_TIME_ACTIVITY.DESIGN) return "Thiết kế (Design)"
  if (val === SPENT_TIME_ACTIVITY.TEST) return "Kiểm thử (Test)"
  if (val === SPENT_TIME_ACTIVITY.MANAGE) return "Quản lý (Manage)"
  if (val === SPENT_TIME_ACTIVITY.OTHER) return "Khác (Other)"
  if (val === SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY) return "Ngày làm việc bình thường"
  if (val === SPENT_TIME_WORK_TIME_TYPE.OVERTIME) return "Làm thêm giờ (Overtime)"
  return val
}

function LogTimeFormFields({
  date,
  setDate,
  hours,
  setHours,
  activity,
  setActivity,
  workTimeType,
  setWorkTimeType,
  comment,
  setComment,
  error,
  remainingEstimate,
  estimatedTime,
}: {
  date: string
  setDate: (v: string) => void
  hours: string
  setHours: (v: string) => void
  activity: SpentTimeActivity
  setActivity: (v: SpentTimeActivity) => void
  workTimeType: SpentTimeWorkTimeType
  setWorkTimeType: (v: SpentTimeWorkTimeType) => void
  comment: string
  setComment: (v: string) => void
  error: string | null
  remainingEstimate: number | null
  estimatedTime?: number | null
}) {
  return (
    <>
      {error && (
        <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {remainingEstimate != null && remainingEstimate < 0 && (
        <div className="rounded-xl bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 font-medium border border-amber-500/20">
          Cảnh báo: vượt ước tính {Math.abs(remainingEstimate).toFixed(1)} giờ (ước tính:{" "}
          {estimatedTime}h)
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">
            Ngày thực hiện
          </Label>
          <DatePicker
            id="date"
            value={date}
            onChange={(val) => {
              setDate(val || "")
            }}
            placeholder="Chọn ngày thực hiện..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hours" className="text-xs font-semibold text-muted-foreground">
            Số giờ
          </Label>
          <Input
            id="hours"
            type="number"
            step="0.1"
            min="0.1"
            max="24"
            placeholder="Ví dụ: 2.5"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value)
            }}
            className="h-10 text-sm border-border rounded-full px-4"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="activity" className="text-xs font-semibold text-muted-foreground">
            Hoạt động
          </Label>
          <Select
            value={activity}
            onValueChange={(val) => {
              setActivity(val as SpentTimeActivity)
            }}
          >
            <SelectTrigger
              id="activity"
              className="w-full h-10 border-border rounded-full px-4 bg-background"
            >
              <SelectValue placeholder="Chọn hoạt động" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              {SPENT_TIME_ACTIVITIES.map((act) => (
                <SelectItem key={act} value={act} className="rounded-lg">
                  {formatLabel(act)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workTimeType" className="text-xs font-semibold text-muted-foreground">
            Loại giờ
          </Label>
          <Select
            value={workTimeType}
            onValueChange={(val) => {
              setWorkTimeType(val as SpentTimeWorkTimeType)
            }}
          >
            <SelectTrigger
              id="workTimeType"
              className="w-full h-10 border-border rounded-full px-4 bg-background"
            >
              <SelectValue placeholder="Chọn loại giờ" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              {SPENT_TIME_WORK_TIME_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="rounded-lg">
                  {formatLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment" className="text-xs font-semibold text-muted-foreground">
          Ý kiến / Ghi chú
        </Label>
        <Textarea
          id="comment"
          placeholder="Nhập nội dung công việc đã làm..."
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
          }}
          className="min-h-[80px] rounded-xl border-border p-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          maxLength={255}
        />
      </div>
    </>
  )
}

interface LogTimeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  spentTime?: SpentTime
  estimatedTime?: number | null
  loggedHours?: number
  onSuccess?: () => void
}

/**
 * Modal dialog component for project members to log task hours and record spent time.
 */
export default function LogTimeModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  spentTime,
  estimatedTime,
  loggedHours = 0,
  onSuccess,
}: LogTimeModalProps) {
  const {
    date,
    setDate,
    hours,
    setHours,
    activity,
    setActivity,
    workTimeType,
    setWorkTimeType,
    comment,
    setComment,
    error,
    remainingEstimate,
    isPending,
    handleSubmit,
  } = useLogTimeForm({
    open,
    taskId,
    spentTime,
    estimatedTime,
    loggedHours,
    onSuccess,
    onOpenChange,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground">
            {spentTime ? "Chỉnh sửa thời gian làm việc" : "Ghi nhận thời gian (Log Time)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {spentTime ? "Cập nhật nhật ký thời gian" : "Log time"} cho công việc:{" "}
            <span className="font-semibold text-foreground">
              #{taskId.substring(0, 8)} - {taskTitle}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <LogTimeFormFields
            date={date}
            setDate={setDate}
            hours={hours}
            setHours={setHours}
            activity={activity}
            setActivity={setActivity}
            workTimeType={workTimeType}
            setWorkTimeType={setWorkTimeType}
            comment={comment}
            setComment={setComment}
            error={error}
            remainingEstimate={remainingEstimate}
            estimatedTime={estimatedTime}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="h-10 rounded-full px-5 text-sm"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? "Đang lưu..." : spentTime ? "Lưu thay đổi" : "Ghi nhận"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
