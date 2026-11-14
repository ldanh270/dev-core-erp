import { cn } from "@/lib/utils"

import type { HTMLAttributes, ReactNode } from "react"

export interface BoardCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  isActive?: boolean
  isDragging?: boolean
}

export function BoardCard({ children, isActive, isDragging, className, ...props }: BoardCardProps) {
  return (
    <div
      className={cn(
        "group cursor-pointer rounded-xl border border-border/60 bg-card p-3 shadow-xs transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        isActive && "border-primary ring-1 ring-primary/30",
        isDragging && "opacity-50 shadow-lg scale-[0.98]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
