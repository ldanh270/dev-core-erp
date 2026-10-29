/**
 * UI Density & Control Sizing Configuration (Apple HIG & The Pill Rule)
 * Single Source of Truth for interactive control heights, paddings, typography, and border radius.
 */

export const CONTROL_SIZES = {
  /**
   * sm: 36px (h-9) — Toolbar, Filter Bar, Table Actions, Matrix Controls
   */
  sm: "h-9 px-3.5 text-xs rounded-full",

  /**
   * default: 40px (h-10) — Standard Form Fields, Modals, Drawers, Popups
   */
  default: "h-10 px-4 text-sm rounded-full",

  /**
   * lg: 48px (h-12) — Prominent Auth Forms, Hero Inputs, Large Actions
   */
  lg: "h-12 px-6 text-base rounded-full",
} as const

export type ControlSize = keyof typeof CONTROL_SIZES

export const CONTROL_HEIGHTS: Record<ControlSize, string> = {
  sm: "h-9",
  default: "h-10",
  lg: "h-12",
}

/**
 * Type-safe helper to retrieve control classes without triggering object-injection linter warnings.
 */
export function getControlSizeClass(size?: ControlSize): string {
  switch (size) {
    case "sm":
      return CONTROL_SIZES.sm
    case "lg":
      return CONTROL_SIZES.lg
    case "default":
    default:
      return CONTROL_SIZES.default
  }
}
