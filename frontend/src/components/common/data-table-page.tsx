import { AppPagination } from "@/components/common/app-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { PageCard } from "@/components/common/page-card"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

import { useMemo } from "react"

import { RotateCcw, SearchX } from "lucide-react"

import { computeStickyLayout, getStickyCellProps } from "./data-table-sticky"
import type { DataTablePageProps } from "./data-table.types"

export type {
  DataTableColumn,
  DataTableTabItem,
  DataTablePaginationConfig,
  DataTablePageProps,
} from "./data-table.types"

/**
 * Master Enterprise Data Table Page component.
 * Combines viewport-locked internal scrolling, sticky thead, sticky left columns (>= lg),
 * 400ms debounced search, smart context-aware empty state, and pinned pagination into a single reusable Clean Architecture primitive.
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
  onResetFilters,
}: DataTablePageProps<T>) {
  const isCompact = density === "compact"
  // In W3C CSS Table Model, 'height' on th/td natively acts as minimum height (never clips, auto-expands on multi-line)
  // while guaranteeing clean integer rendering (exact 40px for header, 60px for data rows) in DevTools.
  const thClass = isCompact
    ? "h-10 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-middle"
    : "h-10 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-middle"

  // Standard row cell height: 60px standard, 48px compact
  const tdClass = isCompact ? "h-12 px-3 py-2 text-sm align-middle" : "h-[60px] px-4 py-2.5 text-sm align-middle"

  // Responsive breakpoint hooks for progressive column visibility
  const isMd = useMediaQuery("(min-width: 768px)")
  const isLg = useMediaQuery("(min-width: 1024px)")
  const isXl = useMediaQuery("(min-width: 1280px)")

  // Sticky Column Integrity Law: Columns hidden by breakpoints are filtered out
  // BEFORE computing sticky offsets, colgroup, and totalMinWidth
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.hideBelow === "md" && !isMd) return false
      if (col.hideBelow === "lg" && !isLg) return false
      if (col.hideBelow === "xl" && !isXl) return false
      return true
    })
  }, [columns, isMd, isLg, isXl])

  // Compute sticky offsets and table minWidth using pure utility on visibleColumns
  const stickyLayout = useMemo(() => computeStickyLayout(visibleColumns), [visibleColumns])

  const hasActiveSearch = Boolean(search?.value && search.value.trim().length > 0)

  const handleResetSearchAndFilters = () => {
    if (search?.onClear) {
      search.onClear()
    }
    if (search?.onSearch) {
      search.onSearch("")
    }
    if (onResetFilters) {
      onResetFilters()
    }
  }

  const renderPrimaryAction = () => {
    if (!primaryAction) return null
    if (typeof primaryAction === "object" && "label" in primaryAction) {
      const {
        label,
        icon: Icon,
        onClick,
        disabled,
        variant: btnVariant = "default",
      } = primaryAction
      return (
        <Button
          onClick={onClick}
          disabled={disabled}
          variant={btnVariant}
          className="rounded-full shadow-xs"
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

      {/* Table container */}
      <PageCard
        padding="none"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
      >
        {/* Tab navigation */}
        {tabs && (
          <nav className="flex items-center gap-1 border-b border-border bg-card px-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 relative">
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
                    "relative flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-medium leading-5 transition-colors whitespace-nowrap cursor-pointer",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TabIcon && <TabIcon className="size-4 shrink-0" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full h-5 min-w-5 px-2 flex items-center justify-center text-xs font-semibold border leading-none",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              )
            })}
          </nav>
        )}

        {/* Toolbar & filters */}
        {(search || filters || toolbarActions) && (
          <div className="relative z-30 flex flex-col gap-2.5 border-b border-border px-4 py-3 sm:flex-row sm:items-center justify-between bg-card shrink-0">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {search && (
                <SearchInput
                  placeholder={search.placeholder}
                  value={search.value}
                  debounceMs={search.debounceMs}
                  onSearch={search.onSearch}
                  onClear={search.onClear}
                  className="w-full sm:max-w-xs"
                />
              )}
              {filters}
            </div>
            {toolbarActions && (
              <div className="flex items-center gap-2 shrink-0">{toolbarActions}</div>
            )}
          </div>
        )}

        {/* Table viewport */}
        <div className="relative flex-1 min-h-0 overflow-auto overscroll-contain app-scrollbar">
          <table
            className={cn(
              "w-full border-separate border-spacing-0 text-left",
              stickyLayout.totalMinWidth && "table-fixed",
            )}
            style={
              stickyLayout.totalMinWidth
                ? { minWidth: `${stickyLayout.totalMinWidth}px` }
                : undefined
            }
          >
            {/* Column width synchronization */}
            {stickyLayout.totalMinWidth && (
              <colgroup>
                {visibleColumns.map((col) => (
                  <col key={`col-${col.id}`} style={col.width ? { width: col.width } : undefined} />
                ))}
              </colgroup>
            )}
            {/* Table header */}
            <thead className="bg-card">
              <tr>
                {visibleColumns.map((col) => {
                  const stickyProps = getStickyCellProps(col, stickyLayout, { isHeader: true, isDesktop: isLg })
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        thClass,
                        "border-b border-border bg-card whitespace-nowrap select-none",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right",
                        stickyProps.className,
                        col.headerClassName,
                      )}
                      style={stickyProps.style}
                    >
                      {col.header}
                    </th>
                  )
                })}
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="divide-y divide-border">
              {isLoading ? (
                /* Loading skeleton */
                Array.from({ length: loadingRowsCount }).map((_, rIdx) => (
                  <tr key={`loading-row-${rIdx}`}>
                    {visibleColumns.map((col) => {
                      const stickyProps = getStickyCellProps(col, stickyLayout, { isDesktop: isLg })
                      return (
                        <td
                          key={`loading-col-${col.id}`}
                          className={cn(
                            tdClass,
                            "border-b border-border bg-card",
                            stickyProps.className,
                          )}
                          style={stickyProps.style}
                        >
                          <Skeleton className="h-4 w-4/5 rounded-md" />
                        </td>
                      )
                    })}
                  </tr>
                ))
              ) : data.length === 0 ? (
                /* Smart Context-Aware Empty State */
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 px-4">
                    {hasActiveSearch ? (
                      <EmptyState
                        icon={SearchX}
                        title="Không tìm thấy kết quả phù hợp"
                        description={`Không có bản ghi nào khớp với từ khóa "${search?.value}".`}
                        action={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetSearchAndFilters}
                            className="rounded-full gap-1.5"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Đặt lại bộ lọc</span>
                          </Button>
                        }
                      />
                    ) : (
                      <EmptyState
                        icon={emptyState?.icon}
                        title={emptyState?.title || "Không có dữ liệu"}
                        description={
                          emptyState?.description ||
                          "Chưa có bản ghi nào được ghi nhận."
                        }
                        action={emptyState?.action}
                      />
                    )}
                  </td>
                </tr>
              ) : renderRows ? (
                /* Custom row renderer */
                renderRows()
              ) : (
                /* Data rows */
                data.map((item, idx) => (
                  <tr
                    key={keyExtractor ? keyExtractor(item, idx) : idx}
                    className="group hover:bg-muted/25"
                  >
                    {visibleColumns.map((col) => {
                      const stickyProps = getStickyCellProps(col, stickyLayout, { isDesktop: isLg })
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            tdClass,
                            "border-b border-border bg-card group-hover:bg-muted",
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right",
                            stickyProps.className,
                            col.className,
                          )}
                          style={stickyProps.style}
                        >
                          {(() => {
                            const content = col.cell
                              ? col.cell(item, idx)
                              : col.accessor
                                ? col.accessor(item)
                                : null
                            if (col.truncate) {
                              return (
                                <div
                                  className="min-w-0 truncate"
                                  title={typeof content === "string" ? content : undefined}
                                >
                                  {content}
                                </div>
                              )
                            }
                            return content
                          })()}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
