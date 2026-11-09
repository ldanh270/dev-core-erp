import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface DataTableColumn<T> {
  id: string
  header: ReactNode | string
  className?: string
  headerClassName?: string
  accessor?: (item: T) => ReactNode
  cell?: (item: T, index: number) => ReactNode
  align?: "left" | "center" | "right"
  width?: string
  minWidth?: string
  /** Enables sticky column positioning from tablet breakpoint (>= 768px). Offset is automatically computed based on preceding sticky columns. */
  sticky?: boolean
  /** Backward-compatible alias for sticky */
  stickyLeft?: boolean
  /** Optional manual left offset override. If omitted, offset is automatically calculated. */
  stickyLeftOffset?: string
  /** Hides column below specified breakpoint */
  hideBelow?: "md" | "lg" | "xl"
  /** Enables text truncation with ellipsis and native tooltip on cell text */
  truncate?: boolean
}

export interface DataTableTabItem {
  id: string
  label: string
  count?: number | string
  icon?: LucideIcon
}

export interface DataTablePaginationConfig {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (limit: number) => void
  pageSizeOptions?: number[]
}

export interface DataTablePageProps<T> {
  title: string
  description?: string
  backHref?: string
  fallbackHref?: string
  onBack?: () => void
  backLabel?: string
  primaryAction?:
    | {
        label: string
        icon?: LucideIcon
        onClick: () => void
        disabled?: boolean
        variant?: "default" | "outline" | "secondary"
      }
    | ReactNode
  headerActions?: ReactNode
  subHeader?: ReactNode
  variant?: "viewport" | "fluid" | "card"
  cardIcon?: LucideIcon
  cardIconClassName?: string
  className?: string
  // Optional className forwarded to the outer PageContainer wrapper.
  containerClassName?: string
  density?: "normal" | "compact"
  tabs?: {
    items: DataTableTabItem[]
    activeTab: string
    onTabChange: (id: string) => void
  }
  search?: {
    placeholder?: string
    value?: string
    debounceMs?: number
    onSearch: (value: string) => void
    onClear?: () => void
  }
  onResetFilters?: () => void
  filters?: ReactNode
  toolbarActions?: ReactNode
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor?: (item: T, index: number) => string | number
  renderRows?: () => ReactNode
  onRowClick?: (item: T, index: number) => void
  onRowContextMenu?: (e: React.MouseEvent, item: T, index: number) => void
  rowClassName?: (item: T, index: number) => string | undefined
  isLoading?: boolean
  loadingRowsCount?: number
  emptyState?: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: ReactNode
  }
  pagination?: DataTablePaginationConfig
  extraContent?: ReactNode
}

