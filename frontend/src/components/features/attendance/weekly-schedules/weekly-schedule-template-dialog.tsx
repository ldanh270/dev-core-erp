import { TemplateWeekGrid } from "@/components/features/attendance/weekly-schedules/template-week-grid"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useShifts } from "@/hooks/attendance/use-shifts"
import {
  useCreateWeeklyScheduleTemplate,
  useUpdateWeeklyScheduleTemplate,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import type {
  IWeeklyScheduleTemplate,
  IWeeklyScheduleTemplateWeek,
  IWorkingShift,
} from "@/types/attendance.types"
import { buildEmptyTemplateWeeks } from "@/utils/attendance/build-empty-template-weeks"

import { type FormEvent, useState } from "react"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WeeklyScheduleTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: IWeeklyScheduleTemplate | null
}

interface WeeklyScheduleTemplateFormProps {
  editing: IWeeklyScheduleTemplate | null
  activeShifts: IWorkingShift[]
  onOpenChange: (open: boolean) => void
}

function WeeklyScheduleTemplateForm({
  editing,
  activeShifts,
  onOpenChange,
}: WeeklyScheduleTemplateFormProps) {
  const createMutation = useCreateWeeklyScheduleTemplate()
  const updateMutation = useUpdateWeeklyScheduleTemplate()
  const [name, setName] = useState(() => editing?.name ?? "")
  const [description, setDescription] = useState(() => editing?.description ?? "")
  const [cycleWeeks, setCycleWeeks] = useState(() => editing?.cycleWeeks ?? 1)
  const [isActive, setIsActive] = useState(() => editing?.isActive ?? true)
  const [weeks, setWeeks] = useState<IWeeklyScheduleTemplateWeek[]>(
    () => editing?.weeks ?? buildEmptyTemplateWeeks(1),
  )

  const handleCycleWeeksChange = (value: number) => {
    const next = Math.min(12, Math.max(1, value))
    setCycleWeeks(next)
    setWeeks((current) => {
      if (current.length === next) return current
      if (current.length > next) return current.slice(0, next)
      const extra = buildEmptyTemplateWeeks(next - current.length).map((week, index) => ({
        ...week,
        weekIndex: current.length + index,
      }))
      return [...current, ...extra]
    })
  }

  const updateDay = (weekIndex: number, dayOfWeek: number, shiftId: string | null) => {
    setWeeks((current) =>
      current.map((week) => {
        if (week.weekIndex !== weekIndex) return week
        return {
          ...week,
          days: week.days.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, shiftId } : day)),
        }
      }),
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      cycleWeeks,
      isActive,
      weeks,
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật template")
            onOpenChange(false)
          },
        },
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo template lịch hàng tuần")
        onOpenChange(false)
      },
    })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="template-name">Tên template *</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
            placeholder="VD: Hành chính xoay 3 ca"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cycle-weeks">Số tuần trong chu kỳ *</Label>
          <Input
            id="cycle-weeks"
            type="number"
            min={1}
            max={12}
            value={cycleWeeks}
            onChange={(event) => {
              handleCycleWeeksChange(Number(event.target.value))
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template-description">Mô tả</Label>
        <Textarea
          id="template-description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value)
          }}
          placeholder="Ghi chú về cách xoay ca..."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch id="template-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="template-active">Đang sử dụng</Label>
      </div>

      <div className="space-y-4">
        {weeks.map((week) => (
          <div key={week.weekIndex} className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold">Tuần {week.weekIndex + 1}</p>
            <TemplateWeekGrid
              week={week}
              shifts={activeShifts}
              onDayChange={(dayOfWeek, shiftId) => {
                updateDay(week.weekIndex, dayOfWeek, shiftId)
              }}
            />
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenChange(false)
          }}
        >
          Huỷ
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Lưu" : "Tạo"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function WeeklyScheduleTemplateDialog({
  open,
  onOpenChange,
  editing,
}: WeeklyScheduleTemplateDialogProps) {
  const { data: shifts = [] } = useShifts()
  const activeShifts = shifts.filter((shift) => shift.isActive)
  const formKey = editing?.id ?? "new"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa template" : "Tạo template lịch hàng tuần"}</DialogTitle>
          <DialogDescription>
            Thiết lập pattern ca xoay tuần tái sử dụng từ danh sách ca làm việc.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <WeeklyScheduleTemplateForm
            key={formKey}
            editing={editing}
            activeShifts={activeShifts}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
