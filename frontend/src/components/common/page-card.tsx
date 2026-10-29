import { cn } from "@/lib/utils"

import type { HTMLAttributes, ReactNode } from "react"

interface PageCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: "none" | "sm" | "md" | "lg"
  noBorder?: boolean
}

const paddingMap = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

/**
 * PageCard — Standard card container used across all pages.
 * Enforces rounded-xl (12px), bg-card, and standardized concentric border.
 */
export function PageCard({
  children,
  className,
  padding = "md",
  noBorder = false,
  ...props
}: PageCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card",
        !noBorder && "border border-border/80",
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
