import { Input } from "@/components/ui/input"

import { Search } from "lucide-react"

interface DataTableToolbarProps {
  searchQuery?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
}

/**
 * DataTableToolbar — Standard toolbar for data tables with search and actions.
 */
export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border bg-muted/20">
      <div className="flex items-center gap-3 flex-1">
        {onSearchChange && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              size="sm"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-background shadow-none"
            />
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{actions}</div>}
    </div>
  )
}

