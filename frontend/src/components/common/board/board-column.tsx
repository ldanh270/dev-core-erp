import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { HTMLAttributes, ReactNode } from "react"

export interface BoardColumnProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode
  children: ReactNode
  emptyState?: ReactNode
  isEmpty?: boolean
  isHighlighted?: boolean
  maxHeight?: string | number
  scrollType?: "always" | "auto" | "hover" | "scroll"
  bodyProps?: HTMLAttributes<HTMLDivElement>
  bodyClassName?: string
}

export function BoardColumn({
  header,
  children,
  emptyState,
  isEmpty,
  isHighlighted,
  maxHeight,
  scrollType = "always",
  className,
  bodyProps,
  bodyClassName,
  ...props
}: BoardColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col shrink-0 rounded-xl border border-border/60 bg-muted/30 transition-all duration-200 overflow-hidden h-full min-h-0",
        isHighlighted && "border-primary/50 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20",
        className
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-border/40 p-3 shrink-0 bg-muted/20">
          {header}
        </div>
      )}
      <ScrollArea
        type={scrollType}
        className={cn("flex-1 min-h-0 w-full", bodyClassName)}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <div className="flex flex-col gap-2.5 p-2.5 min-h-full" {...bodyProps}>
          {isEmpty && emptyState ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground/70 min-h-[120px]">
              {emptyState}
            </div>
          ) : (
            children
          )}
        </div>
        <ScrollBar
          orientation="vertical"
          className="w-2 bg-muted/10 border-l border-border/20"
        />
      </ScrollArea>
    </div>
  )
}
