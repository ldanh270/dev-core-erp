import { cn } from "@/lib/utils"

import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes, ReactNode } from "react"

export const pageCardVariants = cva("rounded-xl bg-card", {
  variants: {
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    noBorder: {
      true: "",
      false: "border border-border/80",
    },
  },
  defaultVariants: {
    padding: "md",
    noBorder: false,
  },
})

export interface PageCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageCardVariants> {
  children: ReactNode
}

/**
 * PageCard — Standard card container used across all pages.
 * Enforces rounded-xl (12px), bg-card, and standardized concentric border.
 * Uses CVA to prevent object injection sink vulnerabilities.
 */
export function PageCard({
  children,
  className,
  padding,
  noBorder,
  ...props
}: PageCardProps) {
  return (
    <div
      className={cn(pageCardVariants({ padding, noBorder }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
