import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export type PageContainerVariant = "default" | "table" | "centered" | "fluid"

export interface PageContainerProps {
  children: ReactNode
  variant?: PageContainerVariant
  className?: string
}

const variantStyles: Record<PageContainerVariant, string> = {
  // Standard layout for general dashboard and analytics pages
  default: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0",

  // Viewport-locked layout for data tables (sticky header, internal scroll, zero window scrolling)
  table:
    "w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 h-[calc(100vh-4rem)] flex flex-col gap-4 min-w-0 md:overflow-hidden",

  // Focused center layout for forms, wizards, and profile detail flows
  centered: "w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 min-w-0",

  // Full-width/height canvas for horizontal drag boards (Kanban, Gantt, Timesheet)
  fluid: "w-full p-4 md:p-6 h-full flex flex-col min-w-0",
}

/**
 * PageContainer — Single Source of Truth for macro page layout and padding.
 * Ensures consistent horizontal alignment with the main Header (px-4 sm:px-6),
 * centers content uniformly (max-w-7xl mx-auto), and locks viewport height on desktop tables.
 */
export function PageContainer({
  children,
  variant = "default",
  className,
}: PageContainerProps) {
  return (
    <div className={cn(variantStyles[variant], className)}>
      {children}
    </div>
  )
}
