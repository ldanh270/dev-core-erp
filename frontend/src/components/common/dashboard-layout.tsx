import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export interface DashboardLayoutProps {
  /** Page title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Toolbar filters (e.g. DateRangePicker, Dropdowns) */
  filters?: ReactNode
  /** Primary / secondary actions (Export, Create button) */
  actions?: ReactNode
  /** Top KPI stats section (e.g. StatRow / summary cards) */
  statsSection: ReactNode
  /** Optional analytics / charts grid */
  chartsSection?: ReactNode
  /** Main widgets or detailed tables */
  children?: ReactNode
  className?: string
}

/**
 * Standardized DashboardLayout component.
 * Encapsulates responsive grid layout for analytics, KPI statistics, and widgets.
 * Keeps dashboard pages purely declarative.
 */
export function DashboardLayout({
  title,
  description,
  filters,
  actions,
  statsSection,
  chartsSection,
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <PageContainer className={cn("space-y-6 pb-12", className)}>
      {/* Dashboard Header with Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <PageHeader title={title} description={description} />
        {(filters || actions) && (
          <div className="flex items-center gap-3 flex-wrap">
            {filters}
            {actions}
          </div>
        )}
      </div>

      {/* KPI Stats Overview Section */}
      <div className="w-full">{statsSection}</div>

      {/* Analytics & Charts Section */}
      {chartsSection && <div className="w-full">{chartsSection}</div>}

      {/* Main Widgets & Data Tables Section */}
      {children && <div className="w-full space-y-6">{children}</div>}
    </PageContainer>
  )
}
