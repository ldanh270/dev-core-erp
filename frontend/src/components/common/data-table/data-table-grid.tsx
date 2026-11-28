import { EmptyState } from "@/components/common/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

import { type ReactNode, useMemo } from "react"

import { Inbox, type LucideIcon } from "lucide-react"

import {
  type StickyLayoutResult,
  computeStickyLayout,
  getStickyCellProps,
} from "../data-table-sticky"
import type { DataTableColumn } from "../data-table.types"

interface DataTableLoadingRowProps<T> {
  count: number
  columns: DataTableColumn<T>[]
  stickyLayout: StickyLayoutResult
  isLg: boolean
  tdClass: string
}

/**
 * Mirror the exact sticky column coordinates on skeleton rows during loading
 * to prevent cumulative layout shifts (CLS) when table data resolves.
 */
function DataTableLoadingRow<T>({
  count,
  columns,
  stickyLayout,
  isLg,
  tdClass,
}: DataTableLoadingRowProps<T>) {
  return (
    <>
      {Array.from({ length: count }).map((_, rIdx) => (
        <tr key={`loading-row-${rIdx}`}>
          {columns.map((col) => {
            const stickyProps = getStickyCellProps(col, stickyLayout, { isDesktop: isLg })
            return (
              <td
                key={`loading-col-${col.id}`}
                className={cn(tdClass, "border-b border-border bg-card", stickyProps.className)}
                style={stickyProps.style}
              >
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

interface DataTableEmptyRowProps {
  colSpan: number
  hasActiveSearch?: boolean
  searchValue?: string
  emptyState?: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: ReactNode
  }
}

/**
 * Context-aware empty state row:
 * - Search active: prompts user that keyword returned zero matches.
 * - Idle / No data: prompts default empty state with optional create action.
 */
function DataTableEmptyRow({
  colSpan,
  hasActiveSearch,
  searchValue,
  emptyState,
}: DataTableEmptyRowProps) {
  return (
    <tr className="h-full">
      <td colSpan={colSpan} className="h-full p-4">
        <div className="flex h-full min-h-[360px] items-center justify-center">
          {hasActiveSearch ? (
            <EmptyState
              icon={emptyState?.icon || Inbox}
              title="Không tìm thấy kết quả phù hợp"
              description={`Không có bản ghi nào khớp với từ khóa "${searchValue}".`}
            />
          ) : (
            <EmptyState
              icon={emptyState?.icon || Inbox}
              title={emptyState?.title || "Không có dữ liệu"}
              description={emptyState?.description || "Chưa có bản ghi nào được ghi nhận."}
              action={emptyState?.action}
            />
          )}
        </div>
      </td>
    </tr>
  )
}

export interface DataTableGridProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  loadingRowsCount?: number
  density?: "normal" | "compact"
  keyExtractor?: (item: T, index: number) => string | number
  renderRows?: () => ReactNode
  onRowClick?: (item: T, index: number) => void
  onRowContextMenu?: (e: React.MouseEvent, item: T, index: number) => void
  rowClassName?: (item: T, index: number) => string | undefined
  emptyState?: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: ReactNode
  }
  hasActiveSearch?: boolean
  searchValue?: string
}

/**
 * Core table engine rendering the viewport grid.
 * Handles GPU sticky coordinate layout, responsive column degradation (hideBelow),
 * row density sizing, and keyboard a11y navigation.
 */
export function DataTableGrid<T>({
  columns,
  data,
  isLoading = false,
  loadingRowsCount = 8,
  density = "normal",
  keyExtractor,
  renderRows,
  onRowClick,
  onRowContextMenu,
  rowClassName,
  emptyState,
  hasActiveSearch = false,
  searchValue = "",
}: DataTableGridProps<T>) {
  const isCompact = density === "compact"
  // Row height tokens: 40px/60px (normal), 40px/48px (compact)
  const thClass = isCompact
    ? "h-10 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-middle"
    : "h-10 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider align-middle"

  const tdClass = isCompact
    ? "h-12 px-3 py-2 text-sm align-middle"
    : "h-[60px] px-4 py-2.5 text-sm align-middle"

  // Progressive column visibility based on screen breakpoints
  const isMd = useMediaQuery("(min-width: 768px)")
  const isLg = useMediaQuery("(min-width: 1024px)")
  const isXl = useMediaQuery("(min-width: 1280px)")

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.hideBelow === "md" && !isMd) return false
      if (col.hideBelow === "lg" && !isLg) return false
      if (col.hideBelow === "xl" && !isXl) return false
      return true
    })
  }, [columns, isMd, isLg, isXl])

  // Pure mathematical sticky coordinate map (left/right offsets) on visible set only
  const stickyLayout = useMemo(() => computeStickyLayout(visibleColumns), [visibleColumns])

  return (
    <div className="relative flex-1 min-h-0 overflow-auto">
      <table
        className={cn(
          "w-full border-separate border-spacing-0 text-left",
          stickyLayout.totalMinWidth && "table-fixed",
          !isLoading && data.length === 0 && "min-h-full",
        )}
        style={
          stickyLayout.totalMinWidth ? { minWidth: `${stickyLayout.totalMinWidth}px` } : undefined
        }
      >
        {/* colgroup enforces pixel column widths when sticky layout is active */}
        {stickyLayout.totalMinWidth && (
          <colgroup>
            {visibleColumns.map((col) => (
              <col key={`col-${col.id}`} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
        )}

        <thead className="sticky top-0 z-20 bg-card shadow-xs">
          <tr>
            {visibleColumns.map((col) => {
              const stickyProps = getStickyCellProps(col, stickyLayout, {
                isHeader: true,
                isDesktop: isLg,
              })
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

        <tbody
          className={cn("divide-y divide-border", !isLoading && data.length === 0 && "h-full")}
        >
          {isLoading ? (
            <DataTableLoadingRow
              count={loadingRowsCount}
              columns={visibleColumns}
              stickyLayout={stickyLayout}
              isLg={isLg}
              tdClass={tdClass}
            />
          ) : data.length === 0 ? (
            <DataTableEmptyRow
              colSpan={visibleColumns.length}
              hasActiveSearch={hasActiveSearch}
              searchValue={searchValue}
              emptyState={emptyState}
            />
          ) : renderRows ? (
            renderRows()
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(item, idx) : idx}
                className={cn(
                  "group hover:bg-muted/25",
                  onRowClick && "cursor-pointer",
                  rowClassName ? rowClassName(item, idx) : undefined,
                )}
                onClick={onRowClick ? () => onRowClick(item, idx) : undefined}
                onContextMenu={onRowContextMenu ? (e) => onRowContextMenu(e, item, idx) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onRowClick(item, idx)
                        }
                      }
                    : undefined
                }
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
  )
}
