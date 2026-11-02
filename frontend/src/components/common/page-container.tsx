import { cn } from "@/lib/utils"

import { cva, type VariantProps } from "class-variance-authority"
import type { ReactNode } from "react"

export const pageContainerVariants = cva("w-full flex flex-col min-w-0", {
  variants: {
    variant: {
      // Standard layout for general dashboard and analytics pages
      default: "max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6",

      // Viewport-locked layout for data tables (sticky header, internal scroll, zero window scrolling)
      table:
        "max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 h-[calc(100vh-4rem)] gap-4 md:overflow-hidden",

      // Focused center layout for forms, wizards, and profile detail flows
      centered: "max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6",

      // Full-width/height canvas for horizontal drag boards (Kanban, Gantt, Timesheet)
      fluid: "p-4 md:p-6 h-full",
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
 * Enforces CVA architecture to eliminate object-injection vulnerabilities,
 * ensures consistent horizontal alignment with the main Header (px-4 sm:px-6),
 * centers content uniformly (max-w-7xl mx-auto), and locks viewport height on desktop tables.
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
