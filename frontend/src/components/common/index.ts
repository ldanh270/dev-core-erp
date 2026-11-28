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
export { DetailPageLayout, type DetailPageLayoutProps, type DetailTabItem } from "./detail-page-layout"
export { DashboardLayout, type DashboardLayoutProps } from "./dashboard-layout"
export { MatrixPageLayout, type MatrixPageLayoutProps } from "./matrix-page-layout"
export { BoardPageLayout, type BoardPageLayoutProps } from "./board-page-layout"
export { SettingsPageLayout, type SettingsPageLayoutProps } from "./settings-page-layout"
export { ErrorPageLayout, type ErrorPageLayoutProps, type QuickLinkItem } from "./error-page-layout"
export { AppPagination, type AppPaginationProps } from "./app-pagination"
export { SafeHtml } from "./safe-html"
export { DatePicker, type DatePickerProps } from "./date-picker"
export { DateRangePicker, type DateRangePickerProps } from "./date-range-picker"
export { formatDisplayDate, parseDate, formatDateToIso } from "./date-picker.utils"
export { TimePicker, type TimePickerProps } from "./time-picker"
export { DetailNotFound, type DetailNotFoundProps } from "./detail-not-found"
export {
  BoardContainer,
  BoardColumn,
  BoardColumnHeader,
  BoardCard,
  BoardAddColumnCard,
  BoardView,
  type BoardContainerProps,
  type BoardColumnProps,
  type BoardColumnHeaderProps,
  type BoardCardProps,
  type BoardAddColumnCardProps,
  type BoardViewProps,
} from "./board"
export {
  TABLE_COL_WIDTH,
  getTableColWidthPx,
  type TableColWidthKey,
} from "@/config/table-columns.config"
export { TYPOGRAPHY, type TypographyToken } from "@/config/typography.config"
export { LAYOUT_DIMENSIONS, ANIMATION_DURATION } from "@/config/layout.config"
