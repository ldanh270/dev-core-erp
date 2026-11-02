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
  const thHeight = isCompact ? "h-9 px-4 py-2 text-[10px]" : "h-11 px-5 py-3 text-[11px]"
  const tdPadding = isCompact ? "px-4 py-2 text-xs" : "px-5 py-3 text-[13px]"

  const renderPrimaryAction = () => {
    if (!primaryAction) return null
    if (typeof primaryAction === "object" && "label" in primaryAction) {
      const { label, icon: Icon, onClick, disabled, variant: btnVariant = "default" } = primaryAction
      return (
        <Button
          onClick={onClick}
          disabled={disabled}
          variant={btnVariant}
          size="sm"
          className="rounded-full gap-1.5 font-semibold shadow-xs"
        >
          {Icon && <Icon className="size-3.5" />}
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
          <div className="flex items-center gap-2">
            {headerActions}
            {renderPrimaryAction()}
          </div>
        }
      />

      <PageCard
        padding="none"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs"
      >
        {tabs && (
          <nav className="flex items-center gap-1 border-b border-border bg-card px-4 pt-1.5 overflow-x-auto shrink-0">
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
                    "relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TabIcon && <TabIcon className="size-3.5" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-semibold border",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                </button>
              )
            })}
          </nav>
        )}

        {(search || filters || toolbarActions) && (
          <div className="flex flex-col gap-3 border-b border-border p-3.5 sm:p-4 lg:flex-row lg:items-center justify-between bg-muted/15 shrink-0">
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
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

        <div className="flex-1 min-h-[350px] md:min-h-0 overflow-auto overscroll-contain">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-xs">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "font-semibold text-muted-foreground whitespace-nowrap select-none",
                      thHeight,
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
                  <tr key={`loading-row-${rIdx}`}>
                    {columns.map((col) => (
                      <td key={`loading-col-${col.id}`} className={tdPadding}>
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
                    className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors duration-100"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          tdPadding,
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
          <div className="shrink-0 bg-card">
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
