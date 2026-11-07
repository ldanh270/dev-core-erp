/**
 * Standard Table Column Widths & Layout Constants
 * Single Source of Truth for Data Table column sizing across all ERP modules.
 * Adheres to 4px multiples design tokens (docs/component-sizing-standard.md).
 */

export const TABLE_COL_WIDTH = {
  /** Numeric Index column (#) */
  INDEX: 60,
  /** Short identifier code (Mã NV, Mã HĐ, etc.) */
  CODE: 100,
  /** Standard Date column (DD/MM/YYYY) */
  DATE: 130,
  /** Currency formatted numbers (VND, right-aligned) */
  CURRENCY: 140,
  /** Status pill badge column */
  STATUS: 140,
  /** Row action menu / button column (Dropdown trigger ...) */
  ACTIONS: 100,
  /** Entity title / summary text */
  TITLE: 240,
  /** General category / type label */
  TYPE: 160,
  /** Position / Job role column */
  POSITION: 160,
  /** Contact info (phone, email) */
  CONTACT: 220,
  /** Employee profile summary (avatar + name + username) */
  EMPLOYEE: 220,
} as const

export type TableColWidthKey = keyof typeof TABLE_COL_WIDTH

/**
 * Returns string with "px" suffix for standard width key (e.g. "100px")
 */
export function getTableColWidthPx(key: TableColWidthKey): string {
  return `${TABLE_COL_WIDTH[key]}px`
}
