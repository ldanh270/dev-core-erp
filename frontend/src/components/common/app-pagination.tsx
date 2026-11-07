import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AppPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  onItemsPerPageChange?: (limit: number) => void
  pageSizeOptions?: number[]
  className?: string
}

/** Renders shared pagination controls with optional page-size selection. Always visible across all states. */
export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: AppPaginationProps) {
  const effectiveTotalPages = Math.max(1, totalPages || 1)
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), effectiveTotalPages)
  const safeTotalItems = totalItems ?? 0

  // Build page number array (maximum 5 pages around the current page)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []

    if (effectiveTotalPages <= 5) {
      for (let i = 1; i <= effectiveTotalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    pages.push(1)

    if (safeCurrentPage > 3) {
      pages.push("ellipsis")
    }

    const start = Math.max(2, safeCurrentPage - 1)
    const end = Math.min(effectiveTotalPages - 1, safeCurrentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (safeCurrentPage < effectiveTotalPages - 2) {
      pages.push("ellipsis")
    }

    if (effectiveTotalPages > 1) {
      pages.push(effectiveTotalPages)
    }

    return pages
  }

  const startItemIndex = safeTotalItems > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0
  const endItemIndex = safeTotalItems > 0 ? Math.min(safeCurrentPage * itemsPerPage, safeTotalItems) : 0

  const effectivePageSizeOptions = Array.from(
    new Set([...pageSizeOptions, itemsPerPage]),
  ).sort((a, b) => a - b)

  const isPrevDisabled = safeCurrentPage <= 1
  const isNextDisabled = safeCurrentPage >= effectiveTotalPages

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border text-xs text-muted-foreground shrink-0 bg-card",
        className,
      )}
    >
      {/* Page size selector & total items counter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 text-muted-foreground">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Hiển thị</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                onItemsPerPageChange(Number(val))
              }}
            >
              <SelectTrigger size="sm" className="w-20 bg-background rounded-full text-xs font-medium px-3 shadow-none border-border">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent>
                {effectivePageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {totalItems !== undefined && (
          <div className="text-center sm:text-left text-xs font-medium text-muted-foreground">
            {safeTotalItems === 0 ? "0" : `${startItemIndex}-${endItemIndex}`} trên{" "}
            <span className="font-semibold text-foreground">{safeTotalItems}</span>
          </div>
        )}
      </div>

      {/* Page navigation controls - always visible for structural consistency */}
      <div className="flex items-center">
        <Pagination className="justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Trước"
                aria-label="Đi đến trang trước"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isPrevDisabled) onPageChange(safeCurrentPage - 1)
                }}
                className={cn(
                  "text-xs font-medium text-muted-foreground hover:text-foreground",
                  isPrevDisabled && "opacity-50 pointer-events-none cursor-not-allowed",
                )}
                aria-disabled={isPrevDisabled}
                title="Trang trước"
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              const isPageActive = page === safeCurrentPage

              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    href="#"
                    isActive={isPageActive}
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page !== safeCurrentPage) onPageChange(page)
                    }}
                    className={cn(
                      "aspect-square min-w-8 min-h-8 p-1.5 rounded-full text-xs flex items-center justify-center transition-colors",
                      isPageActive
                        ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                        : "font-medium text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                text="Sau"
                aria-label="Đi đến trang sau"
                onClick={(e) => {
                  e.preventDefault()
                  if (!isNextDisabled) onPageChange(safeCurrentPage + 1)
                }}
                className={cn(
                  "text-xs font-medium text-muted-foreground hover:text-foreground",
                  isNextDisabled && "opacity-50 pointer-events-none cursor-not-allowed",
                )}
                aria-disabled={isNextDisabled}
                title="Trang sau"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
