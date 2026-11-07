/**
 * Typography Scale & Text Styling Constants
 */

export const TYPOGRAPHY = {
  // ── 1. Page Header Level ──────────────────────────────────
  /** Primary page title (24px, Bold) */
  PAGE_TITLE: "text-2xl font-bold tracking-tight text-foreground",
  /** Page subtitle or descriptive context (14px, Regular/Muted) */
  PAGE_SUBTITLE: "text-sm text-muted-foreground",

  // ── 2. Toolbar & Interactive Controls ─────────────────────
  /** Standard text size for Inputs, Selects, and DatePickers (14px, Medium) */
  TOOLBAR_CONTROL: "text-sm font-medium text-foreground",
  /** Descriptive labels placed next to controls in toolbars (14px, Medium, Muted) */
  TOOLBAR_LABEL: "text-sm font-medium text-muted-foreground whitespace-nowrap",

  // ── 3. Data Table Typography ──────────────────────────────
  /** Table column header (12px, Uppercase, Semibold, Tracking wider) */
  TABLE_HEADER: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
  /** Primary text in table cells - e.g. Full name, Contract title (14px, Medium) */
  CELL_PRIMARY: "text-sm font-medium leading-5 text-foreground truncate",
  /** Secondary subtext in table cells - e.g. Username, Job role (12px, Muted) */
  CELL_SECONDARY: "text-xs leading-4 text-muted-foreground truncate",
  /** Technical ID, Code, or hash values (12px, Monospace) */
  CELL_CODE: "font-mono text-xs font-semibold text-muted-foreground",
  /** Currency and accounting numbers (14px, Monospace, Tabular numbers, Medium) */
  CELL_CURRENCY: "font-mono text-sm font-medium text-foreground tabular-nums whitespace-nowrap",
  /** Date primary value (14px, Tabular numbers, Medium) */
  CELL_DATE: "text-sm text-foreground tabular-nums font-medium",
  /** Time secondary subtext (12px, Tabular numbers, Muted) */
  CELL_TIME: "text-xs text-muted-foreground tabular-nums",
  /** Status badge pill text (12px, Medium) */
  STATUS_PILL: "text-xs font-medium",

  // ── 4. Forms, Modals & Drawers ────────────────────────────
  /** Modal and Drawer sheet title (18px, Bold) */
  MODAL_TITLE: "text-lg font-bold text-foreground",
  /** Modal and Drawer description (14px, Muted) */
  MODAL_DESCRIPTION: "text-sm text-muted-foreground",
  /** Form field label (14px, Medium) */
  FORM_LABEL: "text-sm font-medium text-foreground",
  /** Form helper subtext below inputs (12px, Muted) */
  FORM_HELPER: "text-xs text-muted-foreground",
  /** Form validation error message (12px, Medium, Destructive red) */
  FORM_ERROR: "text-xs font-medium text-destructive",

  // ── 5. Board & Kanban Typography ─────────────────────────
  /** Column Header primary title (14px, Semibold) */
  BOARD_COLUMN_TITLE: "text-sm font-semibold text-foreground",
  /** Column Header secondary date / subtext (12px, Medium, Muted) */
  BOARD_COLUMN_SUB: "text-xs font-medium text-muted-foreground",
  /** Card primary title / task name / candidate name (14px, Semibold) */
  BOARD_CARD_TITLE: "text-sm font-semibold text-foreground leading-snug",
  /** Card secondary subtext / role / department (12px, Muted) */
  BOARD_CARD_SUB: "text-xs text-muted-foreground truncate",
  /** Card technical time or date value (12px, Monospace, Tabular numbers) */
  BOARD_CARD_TIME: "font-mono text-xs font-medium tabular-nums",
} as const

export type TypographyToken = keyof typeof TYPOGRAPHY
