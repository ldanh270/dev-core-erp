import { ApplyWeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/apply-weekly-schedule-template-dialog"
import { WeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/weekly-schedule-template-dialog"
import { DataTablePage, type DataTableColumn, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useDeleteWeeklyScheduleTemplate,
  useWeeklyScheduleTemplates,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import { usePermission } from "@/hooks/use-permission"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

function countAssignedDays(template: IWeeklyScheduleTemplate): number {
  return template.weeks.reduce(
    (total, week) => total + week.days.filter((day) => day.shiftId).length,
    0,
  )
}

/**
 * Standardized Weekly Schedules Template page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, sticky actions, and seamless responsive design.
 */
export default function WeeklySchedules() {
  const { hasPermission } = usePermission()
  const canReadSchedules = hasPermission("attendance.weekly_schedule.read")

  const { data: templates = [], isLoading } = useWeeklyScheduleTemplates()
  const deleteMutation = useDeleteWeeklyScheduleTemplate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IWeeklyScheduleTemplate | null>(null)
  const [applying, setApplying] = useState<IWeeklyScheduleTemplate | null>(null)

  const handleCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (template: IWeeklyScheduleTemplate) => {
    setEditing(template)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("Xác nhận xoá template này?")) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xoá template"),
    })
  }

  const columns: DataTableColumn<IWeeklyScheduleTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Tên",
        width: "280px",
        minWidth: "220px",
        sticky: true,
        cell: (template) => (
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => handleEdit(template)}
              className="rounded-full text-left font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring truncate block max-w-full"
            >
              {template.name}
            </button>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate" title={template.description}>
                {template.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "cycleWeeks",
        header: "Chu kỳ",
        width: "140px",
        minWidth: "120px",
        cell: (template) => `${template.cycleWeeks} tuần`,
      },
      {
        id: "assignedDays",
        header: "Ca đã gán",
        width: "140px",
        minWidth: "120px",
        cell: (template) => `${countAssignedDays(template)} ô ca`,
      },
      {
        id: "status",
        header: "Trạng thái",
        width: "140px",
        minWidth: "130px",
        cell: (template) => (
          <StatusPill
            label={template.isActive ? "Đang dùng" : "Tắt"}
            variant={template.isActive ? "success" : "neutral"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: "60px",
        minWidth: "60px",
        align: "right",
        cell: (template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(template)}>Sửa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setApplying(template)}>Áp dụng</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(template.id)}>
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  return (
    <DataTablePage<IWeeklyScheduleTemplate>
      title="Lịch hàng tuần"
      description="Tạo và quản lý template ca xoay tuần."
      primaryAction={{
        label: "Tạo template",
        icon: Plus,
        onClick: handleCreate,
      }}
      columns={columns}
      data={canReadSchedules ? templates : []}
      isLoading={isLoading}
      keyExtractor={(item) => item.id}
      emptyState={{
        title: "Chưa có template nào",
        description: "Tạo template lịch xoay ca đầu tiên cho nhân sự.",
      }}
      extraContent={
        <>
          <WeeklyScheduleTemplateDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editing={editing}
          />
          <ApplyWeeklyScheduleTemplateDialog
            open={Boolean(applying)}
            onOpenChange={(open) => {
              if (!open) setApplying(null)
            }}
            template={applying}
          />
        </>
      }
    />
  )
}
