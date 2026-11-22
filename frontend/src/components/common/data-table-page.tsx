import { AppPagination } from "@/components/common/app-pagination"
import { PageCard } from "@/components/common/page-card"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { DataTableGrid } from "./data-table/data-table-grid"
import type { DataTablePageProps, DataTableTabItem } from "./data-table.types"

export type {
  DataTableColumn,
  DataTableTabItem,
  DataTablePaginationConfig,
  DataTablePageProps,
} from "./data-table.types"

interface DataTableHeaderCardProps {
  title?: string
  description?: string
  cardIcon?: LucideIcon
  cardIconClassName?: string
  headerActions?: ReactNode
}

function DataTableHeaderCard({
  title,
  description,
  cardIcon: CardIcon,
  cardIconClassName,
  headerActions,
}: DataTableHeaderCardProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-card shrink-0">
      <div className="flex items-center gap-2.5">
        {CardIcon && (
          <div className={cn("rounded-full p-2 text-primary bg-primary/10", cardIconClassName)}>
            <CardIcon className="size-4" />
          </div>
        )}
        <div>
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {headerActions}
    </div>
  )
}

interface DataTableTabsProps {
  items: DataTableTabItem[]
  activeTab: string
  onTabChange: (id: string) => void
}

function DataTableTabs({ items, activeTab, onTabChange }: DataTableTabsProps) {
  return (
    <nav className="flex items-center gap-1 border-b border-border bg-card px-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 relative">
      {items.map((tab) => {
        const isActive = activeTab === tab.id
        const TabIcon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              onTabChange(tab.id)
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
  )
}

/**
 * Data Table Page component with viewport scrolling, tabs, and pagination.
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
  subHeader,
  variant = "viewport",
  cardIcon,
  cardIconClassName,
  className,
  containerClassName,
  density = "normal",
  tabs,
  search,
  filters,
  toolbarActions,
  columns,
  data,
  keyExtractor,
  renderRows,
  onRowClick,
  onRowContextMenu,
  rowClassName,
  isLoading = false,
  loadingRowsCount = 8,
  emptyState,
  pagination,
  extraContent,
}: DataTablePageProps<T>) {
  const hasActiveSearch = Boolean(search?.value && search.value.trim().length > 0)

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

  const cardElement = (
    <PageCard
      padding="none"
      className={cn(
        "flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      {/* Header section when rendered as an embedded card */}
      {variant === "card" && (title || headerActions) && (
        <DataTableHeaderCard
          title={title}
          description={description}
          cardIcon={cardIcon}
          cardIconClassName={cardIconClassName}
          headerActions={headerActions}
        />
      )}

      {/* Tab navigation */}
      {tabs && (
        <DataTableTabs
          items={tabs.items}
          activeTab={tabs.activeTab}
          onTabChange={tabs.onTabChange}
        />
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

      {/* Table grid viewport */}
      <DataTableGrid
        columns={columns}
        data={data}
        isLoading={isLoading}
        loadingRowsCount={loadingRowsCount}
        density={density}
        keyExtractor={keyExtractor}
        renderRows={renderRows}
        onRowClick={onRowClick}
        onRowContextMenu={onRowContextMenu}
        rowClassName={rowClassName}
        emptyState={emptyState}
        hasActiveSearch={hasActiveSearch}
        searchValue={search?.value}
      />

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
  )

  if (variant === "card") {
    return cardElement
  }

  return (
    <PageContainer
      variant={variant === "viewport" ? "table" : "default"}
      className={containerClassName}
    >
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

      {subHeader}

      {cardElement}

      {extraContent}
    </PageContainer>
  )
}
