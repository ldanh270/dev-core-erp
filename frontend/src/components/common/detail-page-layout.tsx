import { BackButton } from "@/components/common/back-button"
import { PageContainer } from "@/components/common/page-container"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"

export interface DetailTabItem {
  id: string
  label: string
  count?: number | string
  icon?: LucideIcon
}

export interface DetailPageLayoutProps {
  /** Main title of the entity (e.g. Employee Name, Project Name) */
  title: string
  /** Subtitle or secondary identifier (e.g. Employee ID, Code) */
  subtitle?: string
  /** Optional back navigation URL or callback */
  backHref?: string
  fallbackHref?: string
  onBack?: () => void
  backLabel?: string
  /** Entity avatar or badge visual node */
  avatar?: ReactNode
  /** Entity status badge pill */
  statusBadge?: ReactNode
  /** Action buttons (Edit, Delete, More dropdown...) */
  actions?: ReactNode
  /** Optional summary metadata tags */
  metadata?: ReactNode
  /** Navigation tabs configuration */
  tabs?: {
    items: DetailTabItem[]
    activeTab: string
    onTabChange: (id: string) => void
  }
  /** Optional overview/summary sidebar panel */
  sidebar?: ReactNode
  /** Sidebar positioning relative to content (default: "left") */
  sidebarPosition?: "left" | "right"
  /** Main tab body content */
  children: ReactNode
  /** Loading skeleton state */
  isLoading?: boolean
  className?: string
}

/**
 * Standardized DetailPageLayout component.
 * Provides unified header, metadata pills, tabs, overview side panel, and responsive main view.
 * Adheres strictly to docs/frontend-design-spec.md and SOLID presentation principles.
 */
export function DetailPageLayout({
  title,
  subtitle,
  backHref,
  fallbackHref,
  onBack,
  backLabel,
  avatar,
  statusBadge,
  actions,
  metadata,
  tabs,
  sidebar,
  sidebarPosition = "left",
  children,
  className,
}: DetailPageLayoutProps) {
  return (
    <PageContainer className={cn("flex flex-col gap-6", className)}>
      {/* Header section with back navigation and primary actions */}
      <div className="flex flex-col gap-4 border-b border-border pb-6">
        {(backHref || onBack) && (
          <div>
            <BackButton
              backHref={backHref}
              fallbackHref={fallbackHref}
              onBack={onBack}
              label={backLabel}
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatar}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {statusBadge}
              </div>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {metadata && <div className="pt-2">{metadata}</div>}

        {/* Tab navigation */}
        {tabs && tabs.items.length > 0 && (
          <div className="pt-4">
            <Tabs value={tabs.activeTab} onValueChange={tabs.onTabChange}>
              <TabsList className="bg-muted/60 p-1 rounded-full inline-flex border border-border">
                {tabs.items.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-full px-4 py-1.5 text-xs md:text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      {Icon && <Icon className="size-4 mr-2" />}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground">
                          {tab.count}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Main content body with optional sidebar */}
      <div className="flex-1">
        {sidebar ? (
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 gap-6",
              sidebarPosition === "right" && "lg:flex lg:flex-row-reverse",
            )}
          >
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">{sidebar}</div>
            <div className="lg:col-span-8 xl:col-span-9">{children}</div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
    </PageContainer>
  )
}
