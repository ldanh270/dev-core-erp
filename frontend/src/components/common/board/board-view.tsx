import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export interface BoardViewProps {
  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode
  children: ReactNode
  height?: string
  legend?: ReactNode
  footerText?: string
  layout?: "stretch" | "fixed"
  scrollType?: "always" | "auto" | "hover" | "scroll"
  className?: string
  contentClassName?: string
}

export function BoardView({
  toolbarLeft,
  toolbarRight,
  children,
  height,
  legend,
  footerText,
  layout = "stretch",
  scrollType = "always",
  className,
  contentClassName,
}: BoardViewProps) {
  const hasToolbar = Boolean(toolbarLeft || toolbarRight)
  const hasFooter = Boolean(legend || footerText)

  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 w-full flex-col rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden",
        className
      )}
      style={height ? { height } : undefined}
    >
      {/* ── Toolbar Header ────────────────────────────────────────── */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 p-4 shrink-0 bg-card">
          {toolbarLeft ? (
            <div className="flex items-center gap-3">{toolbarLeft}</div>
          ) : (
            <div />
          )}
          {toolbarRight ? (
            <div className="flex items-center gap-3">{toolbarRight}</div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* ── Horizontal Scrollable Board Viewport ───────────────────── */}
      <ScrollArea
        type={scrollType}
        className={cn(
          "w-full flex-1 min-h-0",
          !height && "h-full",
          "[&>div]:!h-full"
        )}
      >
        <div
          className={cn(
            "p-4 min-w-full h-full gap-3.5",
            layout === "stretch"
              ? "flex w-full items-stretch"
              : "flex w-max min-w-full items-stretch",
            contentClassName
          )}
        >
          {children}
        </div>
        <ScrollBar
          orientation="horizontal"
          className="h-2.5 bg-muted/20 border-t border-border/30"
        />
      </ScrollArea>

      {/* ── Footer / Legend ───────────────────────────────────────── */}
      {hasFooter && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 px-4 py-3 text-xs text-muted-foreground shrink-0 bg-muted/10">
          {legend && <div className="flex items-center gap-4">{legend}</div>}
          {footerText && (
            <p className="text-xs text-muted-foreground italic ml-auto">
              {footerText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
