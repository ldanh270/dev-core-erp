/**
 * Standard Table Column Widths & Layout Constants
 * Single Source of Truth for Data Table column sizing across all ERP modules.
 * Adheres strictly to docs/frontend-design-spec.md and 4px multiples design tokens.
 */

export const TABLE_COL_WIDTH = {
  /** Numeric Index column (#) */
  INDEX: 60,
  /** Short identifier code (e.g. Employee ID, Contract number) */
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
  /** Employee profile summary (Avatar + Full name + Username) */
  EMPLOYEE: 220,
} as const

export type TableColWidthKey = keyof typeof TABLE_COL_WIDTH

/**
 * Returns string with "px" suffix for standard width key (e.g. "100px").
 * Uses static lookup switch to prevent security/detect-object-injection warnings.
 */
export function getTableColWidthPx(key: TableColWidthKey): string {
  switch (key) {
    case "INDEX":
      return `${TABLE_COL_WIDTH.INDEX}px`
    case "CODE":
      return `${TABLE_COL_WIDTH.CODE}px`
    case "DATE":
      return `${TABLE_COL_WIDTH.DATE}px`
    case "CURRENCY":
      return `${TABLE_COL_WIDTH.CURRENCY}px`
    case "STATUS":
      return `${TABLE_COL_WIDTH.STATUS}px`
    case "ACTIONS":
      return `${TABLE_COL_WIDTH.ACTIONS}px`
    case "TITLE":
      return `${TABLE_COL_WIDTH.TITLE}px`
    case "TYPE":
      return `${TABLE_COL_WIDTH.TYPE}px`
    case "POSITION":
      return `${TABLE_COL_WIDTH.POSITION}px`
    case "CONTACT":
      return `${TABLE_COL_WIDTH.CONTACT}px`
    case "EMPLOYEE":
      return `${TABLE_COL_WIDTH.EMPLOYEE}px`
  }
}
