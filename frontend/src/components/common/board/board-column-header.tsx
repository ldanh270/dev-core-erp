import { Badge } from "@/components/ui/badge"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface BoardColumnHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  count?: number
  dotColor?: string
  badge?: ReactNode
  actions?: ReactNode
  className?: string
}

export function BoardColumnHeader({
  title,
  subtitle,
  count,
  dotColor,
  badge,
  actions,
  className,
}: BoardColumnHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {dotColor && (
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0 shadow-xs",
                !dotColor.startsWith("#") && !dotColor.startsWith("rgb") && dotColor
              )}
              style={
                dotColor.startsWith("#") || dotColor.startsWith("rgb")
                  ? { backgroundColor: dotColor }
                  : undefined
              }
              aria-hidden
            />
          )}
          <span className={cn(TYPOGRAPHY.BOARD_COLUMN_TITLE, "truncate")}>
            {title}
          </span>
          {count !== undefined && (
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-xs font-semibold tabular-nums shrink-0"
            >
              {count}
            </Badge>
          )}
          {badge}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {subtitle && (
        <div className={cn(TYPOGRAPHY.BOARD_COLUMN_SUB, "truncate")}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
