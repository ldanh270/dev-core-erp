import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Position } from "@/lib/api/position.api"

import { Briefcase, Edit2, Trash2 } from "lucide-react"

/**
 * Props for PositionCardsGrid component.
 */
export interface PositionCardsGridProps {
  positions: Position[]
  isLoading: boolean
  trackerLabels: Record<string, string>
  onOpenEdit: (pos: Position) => void
  onDelete: (id: string) => void
}

function getTrackerLabel(labels: Record<string, string>, tracker: string): string {
  const match = Object.entries(labels).find(([k]) => k === tracker)
  return match ? match[1] : tracker
}

/**
 * Presenter component displaying positions with associated tracker permissions and action triggers.
 */
export function PositionCardsGrid({
  positions,
  isLoading,
  trackerLabels,
  onOpenEdit,
  onDelete,
}: PositionCardsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-48 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <Briefcase className="size-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Chưa có chức vụ nào</p>
        <p className="text-xs text-muted-foreground mt-1">
          Bấm nút &quot;Thêm chức vụ mới&quot; để tạo.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {positions.map((pos) => (
        <PageCard
          key={pos.id}
          className="hover:shadow-md transition-all duration-300 border border-border/80 flex flex-col justify-between p-6 rounded-xl space-y-4 hover:border-primary/45"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-foreground leading-tight">{pos.name}</h3>
                <Badge
                  variant="secondary"
                  className="rounded-full text-[9px] font-mono mt-1 font-bold"
                >
                  {pos.code}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onOpenEdit(pos)
                  }}
                  className="size-8 rounded-full hover:bg-muted"
                  aria-label={`Chỉnh sửa chức vụ ${pos.name}`}
                >
                  <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDelete(pos.id)
                  }}
                  className="size-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Xóa chức vụ ${pos.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            {pos.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                {pos.description}
              </p>
            )}

            <div className="space-y-2 border-t border-border/40 pt-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Công việc được phép tạo (Mặc định)
                </span>
                <div className="flex flex-wrap gap-1">
                  {pos.allowedTaskTrackers.length === 0 ? (
                    <span className="text-[10px] text-muted-foreground italic">
                      Chưa giới hạn (Cho phép tất cả)
                    </span>
                  ) : (
                    pos.allowedTaskTrackers.map((t: string) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="rounded-full text-[9px] px-2 py-0.5 border-border bg-background"
                      >
                        {getTrackerLabel(trackerLabels, t)}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </PageCard>
      ))}
    </div>
  )
}
