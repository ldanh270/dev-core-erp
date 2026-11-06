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
}

/** Renders shared pagination controls with optional page-size selection. */
export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
}: AppPaginationProps) {
  if (totalPages <= 1 && !totalItems) return null

  // Build page number array (maximum 5 pages around the current page)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    pages.push(1)

    if (currentPage > 3) {
      pages.push("ellipsis")
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis")
    }

    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const startItemIndex = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItemIndex = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0

  const effectivePageSizeOptions = Array.from(
    new Set([...pageSizeOptions, itemsPerPage]),
  ).sort((a, b) => a - b)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border text-xs text-muted-foreground">
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
            {totalItems === 0 ? "0" : `${startItemIndex}-${endItemIndex}`} trên{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>
          </div>
        )}
      </div>

      {/* Page navigation controls */}
      <div className={totalPages <= 1 ? "hidden sm:block opacity-0 pointer-events-none" : ""}>
        <Pagination className="justify-end">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Trước"
                aria-label="Đi đến trang trước"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) onPageChange(currentPage - 1)
                }}
                className={cn(
                  "text-xs font-medium text-muted-foreground hover:text-foreground",
                  currentPage <= 1 && "opacity-50 cursor-not-allowed",
                )}
                aria-disabled={currentPage <= 1}
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

              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(page)
                    }}
                    className={cn(
                      "aspect-square min-w-8 min-h-8 p-1.5 rounded-full text-xs flex items-center justify-center transition-colors",
                      page === currentPage
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
                  if (currentPage < totalPages) onPageChange(currentPage + 1)
                }}
                className={cn(
                  "text-xs font-medium text-muted-foreground hover:text-foreground",
                  currentPage >= totalPages && "opacity-50 cursor-not-allowed",
                )}
                aria-disabled={currentPage >= totalPages}
                title="Trang sau"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
