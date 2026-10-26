import { cn } from "@/lib/utils"

import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import type { ReactNode } from "react"

export interface EmptyStateProps {
  /**
   * Lucide icon component. Defaults to Inbox.
   */
  icon?: LucideIcon
  /**
   * Main headline for the empty state, e.g. "Không tìm thấy dữ liệu"
   */
  title?: string
  /**
   * Secondary explanatory text explaining why the view is empty or what to do next.
   */
  description?: string
  /**
   * Slot for action button, e.g. `<Button className="rounded-full">+ Thêm mới</Button>`
   */
  action?: ReactNode
  /**
   * Backward-compatible alias for title if older callers pass message.
   */
  message?: string
  /**
   * Additional container classes.
   */
  className?: string
  /**
   * Compact mode with reduced padding and smaller icon for table cells, cards, or popovers.
   */
  compact?: boolean
}

/**
 * EmptyState — Standard empty state visual adhering to DevCore ERP Design Spec.
 * Replaces ad-hoc empty labels with an elegant icon container, headline, description,
 * and optional call-to-action button.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  message,
  className,
  compact = false,
}: EmptyStateProps) {
  // Support backward compatibility with `message`
  const displayTitle = title || message || "Không tìm thấy dữ liệu"
  const displayDesc = title ? description : description || (message ? undefined : "Chưa có bản ghi nào được ghi nhận.")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-4 px-3" : "py-10 px-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 border border-border/60 text-muted-foreground shadow-2xs",
          compact ? "h-10 w-10 rounded-xl mb-2.5" : "h-14 w-14 rounded-2xl mb-4",
        )}
      >
        <Icon className={cn("text-muted-foreground/80", compact ? "h-5 w-5" : "h-7 w-7")} />
      </div>

      <h3 className={cn("font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
        {displayTitle}
      </h3>

      {displayDesc && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm mt-1 leading-relaxed",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {displayDesc}
        </p>
      )}

      {action && <div className={cn(compact ? "mt-3" : "mt-4")}>{action}</div>}
    </div>
  )
}
