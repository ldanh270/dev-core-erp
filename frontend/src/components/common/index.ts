/**
 * Common UI primitives barrel export.
 * Import from "@/components/common" everywhere.
 */
export { PageCard } from "./page-card"
export { PageContainer, type PageContainerVariant } from "./page-container"
export { SectionHeader } from "./section-header"
export { StatRow } from "./stat-row"
export { IconBox } from "./icon-box"
export { StatusPill } from "./status-pill"
export { EmptyState, type EmptyStateProps } from "./empty-state"
export { PageHeader, type PageHeaderProps } from "./page-header"
export { BackButton, type BackButtonProps } from "./back-button"
export { SearchInput, type SearchInputProps } from "./search-input"
export {
  DataTablePage,
  type DataTableColumn,
  type DataTableTabItem,
  type DataTablePaginationConfig,
  type DataTablePageProps,
} from "./data-table-page"
export { DataTableToolbar } from "./data-table-toolbar"
export { AppDrawer } from "./app-drawer"
export { AppModal } from "./app-modal"
export { ConfirmProvider, useConfirm } from "./confirm-provider"
export { EntityFormPage } from "./entity-form-page"
export { AppPagination, type AppPaginationProps } from "./app-pagination"
export { SafeHtml } from "./safe-html"
export { DatePicker, DateRangePicker } from "./date-picker"
export { TimePicker, type TimePickerProps } from "./time-picker"
export { TABLE_COL_WIDTH, getTableColWidthPx, type TableColWidthKey } from "@/config/table-columns.config"
