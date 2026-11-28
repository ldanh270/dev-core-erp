import { BackButton } from "@/components/common/back-button"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export interface MatrixPageLayoutProps {
  /** Page Title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Optional back navigation */
  backHref?: string
  fallbackHref?: string
  onBack?: () => void
  /** Period navigation (e.g. Previous/Next Week, Month Selector) */
  periodNavigation?: ReactNode
  /** Filter and action toolbar */
  toolbar?: ReactNode
  /** Sticky Matrix/Calendar viewport content */
  children: ReactNode
  /** Status / color indicator legend */
  legend?: ReactNode
  className?: string
}

/**
 * Standardized MatrixPageLayout component.
 * Layout primitive for high-density matrix grids (Attendance, Weekly Schedules, Permission Matrices).
 * Provides viewport-aware scrolling and pinned controls.
 */
export function MatrixPageLayout({
  title,
  description,
  backHref,
  fallbackHref,
  onBack,
  periodNavigation,
  toolbar,
  children,
  legend,
  className,
}: MatrixPageLayoutProps) {
  return (
    <PageContainer
      className={cn("flex flex-col h-[calc(100vh-4rem)] overflow-hidden gap-4", className)}
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          {(backHref || onBack) && (
            <BackButton backHref={backHref} fallbackHref={fallbackHref} onBack={onBack} />
          )}
          <PageHeader title={title} description={description} />
        </div>

        {periodNavigation && <div className="flex items-center gap-2">{periodNavigation}</div>}
      </div>

      {/* Toolbar / Filters */}
      {toolbar && <div className="shrink-0">{toolbar}</div>}

      {/* Main Interactive Matrix Area */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card">{children}</div>

      {/* Footer Legend */}
      {legend && <div className="shrink-0 border-t border-border pt-3">{legend}</div>}
    </PageContainer>
  )
}
