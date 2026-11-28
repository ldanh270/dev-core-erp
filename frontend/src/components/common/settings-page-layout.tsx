import { BackButton } from "@/components/common/back-button"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export interface SettingsPageLayoutProps {
  /** Setting section title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Back navigation */
  backHref?: string
  fallbackHref?: string
  onBack?: () => void
  /** Context / Explanation side panel */
  contextPanel: ReactNode
  /** Main configuration form */
  children: ReactNode
  className?: string
}

/**
 * Standardized SettingsPageLayout component.
 * Dual-panel split layout for system configuration screens (PayrollCycle, RolePermissions).
 * Keeps left guidance panel distinct from right action form.
 */
export function SettingsPageLayout({
  title,
  description,
  backHref,
  fallbackHref,
  onBack,
  contextPanel,
  children,
  className,
}: SettingsPageLayoutProps) {
  return (
    <PageContainer className={cn("space-y-6 pb-12", className)}>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        {(backHref || onBack) && (
          <BackButton backHref={backHref} fallbackHref={fallbackHref} onBack={onBack} />
        )}
        <PageHeader title={title} description={description} />
      </div>

      <div className="flex flex-col lg:flex-row rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Context Sidebar */}
        <div className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-6 md:p-8">
          {contextPanel}
        </div>

        {/* Configuration Form Body */}
        <div className="flex-1 p-6 md:p-8">{children}</div>
      </div>
    </PageContainer>
  )
}
