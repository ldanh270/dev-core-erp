import { BackButton } from "@/components/common/back-button"
import { cn } from "@/lib/utils"

import type { HTMLAttributes, ReactNode } from "react"

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
  fallbackHref?: string
  onBack?: () => void
  backLabel?: string
  backVariant?: "icon" | "pill"
}

/**
 * PageHeader — Standard page header for enterprise minimalist layout.
 * Conforms to Slot Pattern (actions prop) and aligns with PageContainer gap-6.
 * Seamlessly integrates BackButton for unified detail and wizard sub-pages.
 */
export function PageHeader({
  title,
  description,
  actions,
  backHref,
  fallbackHref,
  onBack,
  backLabel,
  backVariant = "icon",
  className,
  ...props
}: PageHeaderProps) {
  const showBackButton = Boolean(backHref || fallbackHref || onBack)

  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-4 shrink-0", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {showBackButton && (
          <div className="pt-0.5">
            <BackButton
              backHref={backHref}
              fallbackHref={fallbackHref}
              onBack={onBack}
              label={backLabel}
              variant={backVariant}
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
