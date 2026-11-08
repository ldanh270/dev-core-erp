import { cn } from "@/lib/utils"

import { cva, type VariantProps } from "class-variance-authority"
import type { ReactNode } from "react"

export const pageContainerVariants = cva("w-full flex flex-col min-w-0", {
  variants: {
    variant: {
      // Standard layout for general dashboard and analytics pages
      default: "w-full px-4 md:px-6 py-6 gap-6",

      // Viewport-locked layout for data tables (matches attendance matrix pattern)
      // Locks viewport height on desktop, eliminates window-level scrolling
      table:
        "w-full px-4 md:px-6 py-4 flex-1 h-full min-h-0 max-h-full flex flex-col overflow-hidden gap-4",

      // Focused center layout for forms, wizards, and profile detail flows
      centered: "max-w-4xl mx-auto px-4 md:px-6 py-6 gap-6",

      // Full-width/height canvas for horizontal drag boards (Kanban, Gantt, Timesheet)
      fluid: "w-full p-4 md:p-6 h-full flex flex-col min-w-0",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type PageContainerVariant = NonNullable<VariantProps<typeof pageContainerVariants>["variant"]>

export interface PageContainerProps extends VariantProps<typeof pageContainerVariants> {
  children: ReactNode
  className?: string
}

/**
 * PageContainer — Single Source of Truth for macro page layout and padding.
 * Ensures consistent horizontal alignment with the main Header (px-4 md:px-6),
 * locks viewport height on desktop data tables to guarantee internal scrolling,
 * and maintains token-based spacing across breakpoints.
 */
export function PageContainer({
  children,
  variant,
  className,
}: PageContainerProps) {
  return (
    <div className={cn(pageContainerVariants({ variant }), className)}>
      {children}
    </div>
  )
}
