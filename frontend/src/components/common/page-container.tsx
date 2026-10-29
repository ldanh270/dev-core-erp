import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export type PageContainerVariant = "default" | "table" | "centered" | "fluid"

interface PageContainerProps {
  children: ReactNode
  variant?: PageContainerVariant
  className?: string
}

const variantStyles: Record<PageContainerVariant, string> = {
  // Standard layout for general dashboard pages
  default: "w-full px-4 md:px-6 py-6 flex flex-col gap-6 min-w-0",

  // Viewport-locked layout for tables (sticky header, internal scroll, zero window scrolling)
  table: "w-full px-4 md:px-6 py-6 h-[calc(100vh-4rem)] flex flex-col gap-6 min-w-0 overflow-hidden",

  // Focused center layout for entity forms and detail flows (max 1024px)
  centered: "w-full max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 min-w-0",

  // Full-width/height canvas for horizontal drag boards (Kanban, Timesheet)
  fluid: "w-full p-4 md:p-6 h-full flex flex-col min-w-0",
}

/**
 * PageContainer — Single Source of Truth for macro page layout and padding.
 * Ensures consistent horizontal alignment with the main Header (px-4 md:px-6),
 * locks viewport height for data tables, and eliminates double-padding across transitions.
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
