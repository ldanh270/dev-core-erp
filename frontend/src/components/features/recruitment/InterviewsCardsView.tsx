import {
  AppPagination,
  DataTableToolbar,
  PageCard,
  PageContainer,
  PageHeader,
} from "@/components/common"
import type {
  DataTablePaginationConfig,
  DataTableTabItem,
  DataTablePageProps,
} from "@/components/common/data-table.types"
import { Button } from "@/components/ui/button"
import type { InterviewRound } from "@/types/recruitment.types"
import type { ReactNode } from "react"

import { InterviewsCardsGrid } from "./InterviewsCardsGrid"

export interface InterviewsCardsViewProps {
  title: string
  description?: string
  primaryAction?: DataTablePageProps<InterviewRound>["primaryAction"]
  viewToggle: ReactNode
  tabs?: {
    items: DataTableTabItem[]
    activeTab: string
    onTabChange: (id: string) => void
  }
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  interviews: InterviewRound[]
  isLoading: boolean
  hasFilter: boolean
  onViewDetails: (interview: InterviewRound) => void
  pagination: DataTablePaginationConfig
}

/**
 * Pure UI presentational view rendering interviews in a card-grid format,
 * supporting search toolbars, tab filters, view mode toggle, and pagination.
 */
export function InterviewsCardsView({
  title,
  description,
  primaryAction,
  viewToggle,
  tabs,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  interviews,
  isLoading,
  hasFilter,
  onViewDetails,
  pagination,
}: InterviewsCardsViewProps) {
  const renderedAction =
    primaryAction && typeof primaryAction === "object" && "label" in primaryAction ? (
      <Button
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
        variant={primaryAction.variant ?? "default"}
        className="rounded-full shadow-xs cursor-pointer"
      >
        {primaryAction.icon && <primaryAction.icon className="size-4" />}
        <span>{primaryAction.label}</span>
      </Button>
    ) : (
      (primaryAction as ReactNode)
    )

  return (
    <PageContainer variant="table">
      <PageHeader title={title} description={description} actions={renderedAction} />

      <PageCard padding="sm" className="p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
        {tabs && (
          <nav
            aria-label="Lọc theo kết quả phỏng vấn"
            className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background shrink-0"
          >
            {tabs.items.map((tab) => {
              const isActive = tabs.activeTab === tab.id
              const count = tab.count ?? 0
              return (
                <button
                  key={tab.id}
                  onClick={() => tabs.onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                  )}
                </button>
              )
            })}
          </nav>
        )}

        <DataTableToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          actions={viewToggle}
        />

        <div className="flex-1 min-h-0 overflow-auto p-6">
          <InterviewsCardsGrid
            interviews={interviews}
            isLoading={isLoading}
            hasFilter={hasFilter}
            onViewDetails={onViewDetails}
          />
        </div>

        <div className="border-t border-border shrink-0">
          <AppPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onItemsPerPageChange={pagination.onItemsPerPageChange}
          />
        </div>
      </PageCard>
    </PageContainer>
  )
}
