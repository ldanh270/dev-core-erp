/**
 * UI Density & Control Sizing Configuration (Apple HIG & The Pill Rule)
 * Single Source of Truth for interactive control heights, paddings, typography, and border radius.
 */

export const CONTROL_SIZES = {
  /**
   * sm: ~30px (16px leading + 12px py + 2px border) — Toolbar, Filter Bar, Compact Table Actions
   */
  sm: "px-3 py-1.5 text-xs font-semibold leading-4 rounded-full",

  /**
   * default: 40px (exact 40px: 20px leading + 18px py + 2px border) — Standard Form Fields, Modals, Drawers
   */
  default: "px-3.5 py-[0.5625rem] text-sm leading-5 rounded-full",

  /**
   * lg: ~48px (24px leading + 22px py + 2px border) — Prominent Auth Forms, Hero Inputs
   */
  lg: "px-5 py-[0.6875rem] text-base leading-6 rounded-full",
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
