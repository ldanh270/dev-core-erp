import { cn } from "@/lib/utils"

export interface SectionHeaderProps {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/**
 * SectionHeader — Card title row with optional description and right-side action slot.
 * Provides consistent `border-b` divider and spacing across all cards.
 */
export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-border/40 pb-2.5 mb-4",
        className,
      )}
    >
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  )
}
