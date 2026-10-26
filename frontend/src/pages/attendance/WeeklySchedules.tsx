import { WeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/weekly-schedule-template-dialog"
import { ApplyWeeklyScheduleTemplateDialog } from "@/components/features/attendance/weekly-schedules/apply-weekly-schedule-template-dialog"
import { PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteWeeklyScheduleTemplate,
  useWeeklyScheduleTemplates,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import { usePermission } from "@/hooks/use-permission"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { useConfirm } from "@/components/common"
import { useState } from "react"

import { Loader2, MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

function countAssignedDays(template: IWeeklyScheduleTemplate): number {
  return template.weeks.reduce(
    (total, week) => total + week.days.filter((day) => day.shiftId).length,
    0,
  )
}

export default function WeeklySchedules() {
  const confirm = useConfirm()
  const { hasPermission } = usePermission()
  const canReadSchedules = hasPermission("attendance.weekly_schedule.read")

  const { data: templates = [], isLoading, isError } = useWeeklyScheduleTemplates()
  const deleteMutation = useDeleteWeeklyScheduleTemplate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IWeeklyScheduleTemplate | null>(null)
  // Non-null means the apply dialog owns the selected template until it closes.
  const [applying, setApplying] = useState<IWeeklyScheduleTemplate | null>(null)

  const handleCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (template: IWeeklyScheduleTemplate) => {
    setEditing(template)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa template",
      description: "Bạn có chắc chắn muốn xoá template lịch tuần này không?",
      confirmText: "Xóa template",
      variant: "destructive",
    })
    if (!isConfirmed) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xoá template"),
    })
  }

  return (
    <div className="container px-6 py-6 space-y-6">
      <PageHeader
        title="Lịch hàng tuần"
        description="Tạo và quản lý template ca xoay tuần."
        actions={
          <Button onClick={handleCreate} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Tạo template
          </Button>
        }
      />

      {canReadSchedules && (
        <PageCard className="overflow-hidden p-0" noBorder={false}>
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Tên</TableHead>
                <TableHead>Chu kỳ</TableHead>
                <TableHead>Ca đã gán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-destructive">
                    Lỗi khi tải danh sách template.
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Chưa có template. Tạo template đầu tiên.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          handleEdit(template)
                        }}
                        className="rounded-full text-left font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {template.name}
                      </button>
                      {template.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{template.cycleWeeks} tuần</TableCell>
                    <TableCell>{countAssignedDays(template)} ô ca</TableCell>
                    <TableCell>
                      <StatusPill
                        label={template.isActive ? "Đang dùng" : "Tắt"}
                        variant={template.isActive ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              handleEdit(template)
                            }}
                          >
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setApplying(template)
                            }}
                          >
                            Áp dụng
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              handleDelete(template.id)
                            }}
                          >
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </PageCard>
      )}

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
    </div>
  )
}
