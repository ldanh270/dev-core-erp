import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface IssuesPaginationProps {
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  setPageSize: (size: number) => void
  totalItems: number
  totalPages: number
  startRange: number
  endRange: number
}

/** Pagination and page size navigation component for task issue lists. */
export function IssuesPagination({
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalItems,
  totalPages,
  startRange,
  endRange,
}: IssuesPaginationProps) {
  if (totalItems === 0) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
      <span className="text-xs text-muted-foreground font-semibold">
        Hiện tổng: {startRange}-{endRange}/{totalItems}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-full p-0.5">
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1))
            }}
            className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
          >
            «
          </Button>
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="text-xs text-muted-foreground font-semibold px-2"
                >
                  ...
                </span>
              )
            }
            const pageNum = p as number
            const isCurrent = pageNum === currentPage
            return (
              <Button
                key={`page-${pageNum}`}
                variant={isCurrent ? "default" : "ghost"}
                size="icon"
                onClick={() => {
                  setCurrentPage(pageNum)
                }}
                className={`rounded-full size-7 p-0 text-xs font-bold ${
                  isCurrent
                    ? "bg-primary text-primary-foreground hover:bg-primary/95"
                    : "hover:bg-background"
                }`}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }}
            className="rounded-full size-7 p-0 text-xs font-bold disabled:opacity-40 hover:bg-background"
          >
            »
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-semibold">Mỗi trang:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => {
            setPageSize(Number(val))
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-16 h-8 border-border rounded-full text-xs font-bold bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover">
            {["10", "25", "50", "100"].map((size) => (
              <SelectItem key={size} value={size} className="rounded-lg text-xs font-semibold">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
