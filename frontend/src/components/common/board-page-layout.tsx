import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export interface BoardPageLayoutProps {
  /** Board title */
  title: string
  /** Subtitle or description */
  description?: string
  /** Toolbar filters (assignee, project, status) */
  filters?: ReactNode
  /** Action buttons */
  actions?: ReactNode
  /** Kanban / capacity columns horizontally scrollable */
  children: ReactNode
  className?: string
}

/**
 * Standardized BoardPageLayout component.
 * Horizontal scrolling layout primitive for Kanban and Resource Capacity Boards.
 */
export function BoardPageLayout({
  title,
  description,
  filters,
  actions,
  children,
  className,
}: BoardPageLayoutProps) {
  return (
    <PageContainer
      className={cn("flex flex-col h-[calc(100vh-4rem)] overflow-hidden gap-4 pb-4", className)}
    >
      {/* Board Header with Search/Filter Toolbar and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-border pb-4">
        <PageHeader title={title} description={description} />
        {(filters || actions) && (
          <div className="flex items-center gap-3 flex-wrap">
            {filters}
            {actions}
          </div>
        )}
      </div>

      {/* Horizontal Scrolling Board Columns Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">{children}</div>
    </PageContainer>
  )
}
