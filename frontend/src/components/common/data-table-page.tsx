import { AppPagination } from "@/components/common/app-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { PageCard } from "@/components/common/page-card"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import type { DataTablePageProps } from "./data-table.types"

export type {
  DataTableColumn,
  DataTableTabItem,
  DataTablePaginationConfig,
  DataTablePageProps,
} from "./data-table.types"

/**
 * Master Enterprise Data Table Page component.
 * Combines viewport-locked internal scrolling, sticky thead, 400ms debounced search,
 * and pinned pagination into a single reusable Clean Architecture primitive.
 * Strictly adheres to 4px multiples design tokens (docs/component-sizing-standard.md).
 */
export function DataTablePage<T>({
  title,
  description,
  backHref,
  fallbackHref,
  onBack,
  backLabel,
  primaryAction,
  headerActions,
  variant = "viewport",
  density = "normal",
  tabs,
  search,
  filters,
  toolbarActions,
  columns,
  data,
  keyExtractor,
  renderRows,
  isLoading = false,
  loadingRowsCount = 8,
  emptyState,
  pagination,
  extraContent,
}: DataTablePageProps<T>) {
  const isCompact = density === "compact"
  // Multiples of 4px: Header h-12 (48px) vs compact h-10 (40px)
  const thClass = isCompact
    ? "h-10 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
    : "h-12 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider"

  // Multiples of 4px: Fixed cell padding & typography
  const tdClass = isCompact
    ? "px-4 text-sm"
    : "px-6 text-sm"

  const rowHeightClass = isCompact ? "h-12" : "h-16"

  const renderPrimaryAction = () => {
    if (!primaryAction) return null
    if (typeof primaryAction === "object" && "label" in primaryAction) {
      const { label, icon: Icon, onClick, disabled, variant: btnVariant = "default" } = primaryAction
      return (
        <Button
          onClick={onClick}
          disabled={disabled}
          variant={btnVariant}
          className="h-10 px-4 rounded-full gap-2 text-sm font-semibold shadow-xs"
        >
          {Icon && <Icon className="size-4" />}
          <span>{label}</span>
        </Button>
      )
    }
    return primaryAction
  }

  return (
    <PageContainer variant={variant === "viewport" ? "table" : "default"}>
      <PageHeader
        title={title}
        description={description}
        backHref={backHref}
        fallbackHref={fallbackHref}
        onBack={onBack}
        backLabel={backLabel}
        actions={
          <div className="flex items-center gap-3">
            {headerActions}
            {renderPrimaryAction()}
          </div>
        }
      />

      <PageCard
        padding="none"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
      >
        {tabs && (
          <nav className="flex items-center gap-1 border-b border-border bg-card px-6 h-11 overflow-x-auto shrink-0 relative">
            {tabs.items.map((tab) => {
              const isActive = tabs.activeTab === tab.id
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    tabs.onTabChange(tab.id)
                  }}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 h-11 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TabIcon && <TabIcon className="size-4" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full h-5 min-w-5 px-2 flex items-center justify-center text-xs font-semibold border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
              )
            })}
          </nav>
        )}

        {(search || filters || toolbarActions) && (
          <div className="flex flex-col gap-3 border-b border-border px-6 py-3 lg:flex-row lg:items-center justify-between bg-muted/15 shrink-0">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {search && (
                <SearchInput
                  placeholder={search.placeholder}
                  value={search.value}
                  debounceMs={search.debounceMs}
                  onSearch={search.onSearch}
                  className="w-full sm:max-w-xs"
                />
              )}
              {filters}
            </div>
            {toolbarActions && <div className="flex items-center gap-2 shrink-0">{toolbarActions}</div>}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-xs">
              <tr className={isCompact ? "h-10" : "h-12"}>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      thClass,
                      "whitespace-nowrap select-none",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.headerClassName,
                    )}
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: loadingRowsCount }).map((_, rIdx) => (
                  <tr key={`loading-row-${rIdx}`} className={rowHeightClass}>
                    {columns.map((col) => (
                      <td key={`loading-col-${col.id}`} className={tdClass}>
                        <Skeleton className="h-4 w-4/5 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8">
                    <EmptyState
                      icon={emptyState?.icon}
                      title={emptyState?.title || "Không có dữ liệu"}
                      description={emptyState?.description || "Chưa có bản ghi nào phù hợp với bộ lọc hiện tại."}
                      action={emptyState?.action}
                    />
                  </td>
                </tr>
              ) : renderRows ? (
                renderRows()
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={keyExtractor ? keyExtractor(item, idx) : idx}
                    className={cn(
                      "hover:bg-muted/25 transition-colors duration-100",
                      rowHeightClass,
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          tdClass,
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right",
                          col.className,
                        )}
                      >
                        {col.cell ? col.cell(item, idx) : col.accessor ? col.accessor(item) : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="shrink-0 bg-card border-t border-border">
            <AppPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.onPageChange}
              onItemsPerPageChange={pagination.onItemsPerPageChange}
              pageSizeOptions={pagination.pageSizeOptions}
            />
          </div>
        )}
      </PageCard>

      {extraContent}
    </PageContainer>
  )
}
