import { PageCard, PageContainer, PageHeader } from "@/components/common"
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
  HOLIDAY_SCOPE,
  HOLIDAY_SCOPE_LABELS,
  ATTENDANCE_QUERY_KEYS,
  type IHolidayScope,
} from "@/config/entities/attendance.config"
import { usePermission } from "@/hooks/use-permission"
import { holidaysApi } from "@/lib/api/attendance.api"
import { formatDate } from "@/lib/utils"
import type { IHoliday, IHolidayPayload } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { isAxiosError } from "axios"

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">Năm {year}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Button size="default" className="rounded-full shadow-xs gap-1.5 font-semibold" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Thêm ngày lễ
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setYear((y) => y - 1)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setYear((y) => y + 1)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : holidays?.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{holiday.name}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {formatDate(holiday.date)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{getScopeLabel(holiday)}</p>
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Sửa ngày lễ"
                        onClick={() => {
                          openEditDialog(holiday)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        aria-label="Xóa ngày lễ"
                        onClick={() => {
                          setDeletingHoliday(holiday)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  {getHolidayTypeLabel(holiday.type)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Chưa có ngày lễ nào trong năm {year}.
          </div>
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
