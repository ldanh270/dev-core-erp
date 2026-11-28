import { EmptyState, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { TYPOGRAPHY } from "@/config/typography.config"
import { getHolidayScopeLabel } from "@/hooks/attendance/use-holidays-management"
import { cn, formatDate } from "@/lib/utils"
import type { IHoliday } from "@/types/attendance.types"
import { getHolidayTypeLabel } from "@/utils/attendance/get-holiday-type-label"

import { Inbox, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

interface HolidayCardsGridProps {
  holidays?: IHoliday[]
  isLoading: boolean
  isAdmin: boolean
  year: number
  onEdit: (holiday: IHoliday) => void
  onDelete: (holiday: IHoliday) => void
  onOpenCreate: () => void
}

/**
 * Presenter grid rendering holiday items as responsive cards with scope and date badges.
 * Handles loading spinner state and empty collection placeholder UI.
 */
export function HolidayCardsGrid({
  holidays,
  isLoading,
  isAdmin,
  year,
  onEdit,
  onDelete,
  onOpenCreate,
}: HolidayCardsGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!holidays || holidays.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title={`Không có ngày lễ trong năm ${year}`}
        description={
          isAdmin
            ? "Bạn có thể thêm các ngày lễ quốc gia hoặc ngày nghỉ đặc thù của công ty."
            : "Chưa có ngày lễ nào được ghi nhận cho năm này."
        }
        action={
          isAdmin ? (
            <Button
              className="rounded-full shadow-xs gap-1.5 font-semibold cursor-pointer"
              onClick={onOpenCreate}
            >
              <Plus className="size-4" />
              Thêm ngày lễ đầu tiên
            </Button>
          ) : null
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {holidays.map((h) => {
        const scopeLabel = getHolidayScopeLabel(h)
        return (
          <div
            key={h.id}
            className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-primary/20 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-semibold")}>{h.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusPill
                      label={getHolidayTypeLabel(h.type)}
                      variant={h.type === "national" ? "info" : "neutral"}
                    />
                    <StatusPill label={scopeLabel} variant="neutral" />
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      onClick={() => {
                        onEdit(h)
                      }}
                      aria-label={`Sửa ${h.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => {
                        onDelete(h)
                      }}
                      aria-label={`Xóa ${h.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatDate(h.date)}</span>
              <span>Tạo: {formatDate(h.createdAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
