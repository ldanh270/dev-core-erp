import { cn } from "@/lib/utils"

import type { HTMLAttributes, ReactNode } from "react"

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: ReactNode
}

/**
 * PageHeader — Standard page header for enterprise minimalist layout.
 * Conforms to Slot Pattern (actions prop) and aligns with PageContainer gap-6.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-4 shrink-0", className)}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
