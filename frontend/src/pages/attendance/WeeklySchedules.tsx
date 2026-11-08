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
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import {
  useDeleteWeeklyScheduleTemplate,
  useWeeklyScheduleTemplates,
} from "@/hooks/attendance/use-weekly-schedule-templates"
import { usePermission } from "@/hooks/use-permission"
import { cn } from "@/lib/utils"
import type { IWeeklyScheduleTemplate } from "@/types/attendance.types"

import { useCallback, useMemo, useState } from "react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IWeeklyScheduleTemplate | null>(null)
  const [applying, setApplying] = useState<IWeeklyScheduleTemplate | null>(null)

  const handleCreate = useCallback(() => {
    setEditing(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((template: IWeeklyScheduleTemplate) => {
    setEditing(template)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Xác nhận xoá template này?")) return
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Đã xoá template")
        },
      })
    },
    [deleteMutation],
  )

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }, [])

  const filteredTemplates = useMemo(() => {
    if (!canReadSchedules) return []
    if (!searchQuery.trim()) return templates
    const query = searchQuery.toLowerCase().trim()
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query)),
    )
  }, [canReadSchedules, templates, searchQuery])

  const totalItems = filteredTemplates.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTemplates.slice(startIndex, startIndex + pageSize)
  }, [filteredTemplates, currentPage, pageSize])

  const columns: DataTableColumn<IWeeklyScheduleTemplate>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Tên",
        width: getTableColWidthPx("TITLE"),
        minWidth: "220px",
        sticky: true,
        cell: (template) => (
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => {
                handleEdit(template)
              }}
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "rounded-full text-left hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block max-w-full",
              )}
            >
              {template.name}
            </button>
            {template.description && (
              <p
                className={cn("mt-0.5", TYPOGRAPHY.CELL_SECONDARY)}
                title={template.description}
              >
                {template.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "cycleWeeks",
        header: "Chu kỳ",
        width: getTableColWidthPx("STATUS"),
        minWidth: "120px",
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>{template.cycleWeeks} tuần</span>
        ),
      },
      {
        id: "assignedDays",
        header: "Ca đã gán",
        width: getTableColWidthPx("STATUS"),
        minWidth: "120px",
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>{countAssignedDays(template)} ô ca</span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
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
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "right",
        cell: (template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full">
                <MoreHorizontal className="size-4" />
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
        ),
      },
    ],
    [handleDelete, handleEdit],
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
      search={{
        placeholder: "Tìm kiếm template theo tên...",
        value: searchQuery,
        onSearch: handleSearch,
        onClear: () => {
          handleSearch("")
        },
      }}
      columns={columns}
      data={paginatedData}
      isLoading={isLoading}
      keyExtractor={(item) => item.id}
      emptyState={{
        title: searchQuery ? "Không tìm thấy template" : "Chưa có template nào",
        description: searchQuery
          ? `Không tìm thấy template nào phù hợp với từ khóa "${searchQuery}".`
          : "Tạo template lịch xoay ca đầu tiên cho nhân sự.",
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pageSize,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: (limit) => {
          setPageSize(limit)
          setCurrentPage(1)
        },
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
