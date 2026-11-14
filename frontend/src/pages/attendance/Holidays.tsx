import { EmptyState, PageCard, PageContainer, PageHeader, StatusPill } from "@/components/common"
import { HolidayFormDialog } from "@/components/features/attendance/holiday-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ATTENDANCE_QUERY_KEYS,
  HOLIDAY_SCOPE,
  HOLIDAY_SCOPE_LABELS,
  type IHolidayScope,
} from "@/config/entities/attendance.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { usePermission } from "@/hooks/use-permission"
import { holidaysApi } from "@/lib/api/attendance.api"
import { cn, formatDate } from "@/lib/utils"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

interface IApiErrorResponse {
  error?: { message?: string }
}

function getScopeLabel(holiday: IHoliday): string {
  const scope = (holiday.scope as IHolidayScope) || HOLIDAY_SCOPE.ALL
  if (scope === HOLIDAY_SCOPE.POSITION) {
    return holiday.position?.name
      ? `Chức danh: ${holiday.position.name}`
      : HOLIDAY_SCOPE_LABELS.position
  }
  if (scope === HOLIDAY_SCOPE.EMPLOYEES) {
    const count = holiday.assignees?.length ?? 0
    return `Nhóm ${count} nhân viên`
  }
  return HOLIDAY_SCOPE_LABELS.all
}

/**
 * Holidays admin page — company-wide or scoped date-range holidays.
 * Standardized Card Grid layout adhering to DevCore design tokens, Pill rule, and StatusPill.
 */
export default function Holidays() {
  const { hasPermission } = usePermission()
  const isAdmin = hasPermission("attendance.update")
  const [year, setYear] = useState(new Date().getFullYear())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<IHoliday | null>(null)
  const [deletingHoliday, setDeletingHoliday] = useState<IHoliday | null>(null)
  const queryClient = useQueryClient()
  const holidaysQueryKey = [...ATTENDANCE_QUERY_KEYS.HOLIDAYS, year] as const

  const { data: holidays, isLoading } = useQuery({
    queryKey: holidaysQueryKey,
    queryFn: () => holidaysApi.getAll({ year }),
  })

  const invalidateHolidays = () => {
    void queryClient.invalidateQueries({ queryKey: ATTENDANCE_QUERY_KEYS.HOLIDAYS })
  }

  const createMutation = useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: (created) => {
      toast.success(`Đã thêm ${created.length} ngày nghỉ`)
      invalidateHolidays()
      closeDialog()
    },
    onError: (error: unknown) => {
      const message = isAxiosError<IApiErrorResponse>(error)
        ? error.response?.data.error?.message
        : undefined
      toast.error(message ?? "Thêm ngày lễ thất bại")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Pick<IHolidayPayload, "name" | "date" | "type">
    }) => holidaysApi.update(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật ngày lễ")
      invalidateHolidays()
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: holidaysApi.delete,
    onSuccess: () => {
      toast.success("Đã xóa ngày lễ")
      invalidateHolidays()
      setDeletingHoliday(null)
    },
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = () => {
    setEditingHoliday(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (holiday: IHoliday) => {
    setEditingHoliday(holiday)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingHoliday(null)
  }

  return (
    <PageContainer variant="default" className="space-y-6">
      <PageHeader
        title="Ngày lễ"
        description="Quản lý ngày nghỉ lễ áp dụng cho lịch làm việc nhân viên."
      />

      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">Năm {year}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button
                size="default"
                className="rounded-full shadow-xs gap-1.5 font-semibold"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Thêm ngày lễ
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => {
                setYear((y) => y - 1)
              }}
              aria-label="Năm trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => {
                setYear((y) => y + 1)
              }}
              aria-label="Năm sau"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : holidays?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        TYPOGRAPHY.CELL_PRIMARY,
                        "truncate font-semibold text-foreground",
                      )}
                    >
                      {holiday.name}
                    </p>
                    <p className={cn(TYPOGRAPHY.CELL_DATE, "mt-1")}>{formatDate(holiday.date)}</p>
                    <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-1 truncate")}>
                      {getScopeLabel(holiday)}
                    </p>
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                        aria-label="Sửa ngày lễ"
                        onClick={() => {
                          openEditDialog(holiday)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="size-7 rounded-full text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Xóa ngày lễ"
                        onClick={() => {
                          setDeletingHoliday(holiday)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 pt-1">
                  <StatusPill
                    label={getHolidayTypeLabel(holiday.type)}
                    variant={holiday.type === "national" ? "success" : "neutral"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title={`Chưa có ngày lễ nào trong năm ${year}`}
            description="Tạo ngày lễ để thiết lập ngày nghỉ áp dụng cho lịch làm việc nhân viên."
            action={
              isAdmin ? (
                <Button
                  size="default"
                  className="rounded-full shadow-xs gap-1.5 font-semibold"
                  onClick={openCreateDialog}
                >
                  <Plus className="size-4" />
                  Thêm ngày lễ
                </Button>
              ) : undefined
            }
          />
        )}
      </PageCard>

      {/* Remount when the target changes so local form state is rebuilt from the selected holiday. */}
      <HolidayFormDialog
        key={`${editingHoliday?.id ?? "new"}:${isDialogOpen ? "open" : "closed"}`}
        open={isDialogOpen}
        editingHoliday={editingHoliday}
        isSaving={isSaving}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setIsDialogOpen(true)
        }}
        onSubmitCreate={(payload) => {
          createMutation.mutate(payload)
        }}
        onSubmitUpdate={(id, data) => {
          updateMutation.mutate({ id, data })
        }}
      />

      <AlertDialog
        open={Boolean(deletingHoliday)}
        onOpenChange={() => {
          setDeletingHoliday(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ngày lễ?</AlertDialogTitle>
            <AlertDialogDescription>
              Nếu ngày này thuộc khoảng ngày đã tạo, toàn bộ khoảng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deletingHoliday) return
                deleteMutation.mutate(deletingHoliday.id)
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
