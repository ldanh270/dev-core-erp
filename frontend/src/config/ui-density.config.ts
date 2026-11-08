/**
 * UI Density & Control Sizing Configuration (Apple HIG & The Pill Rule)
 * Single Source of Truth for interactive control heights, paddings, typography, and border radius.
 */

export const CONTROL_SIZES = {
  /**
   * sm: Compact controls (Toolbar filter, pagination size selector, compact table buttons)
   * Content-driven with 32px baseline floor: min-h-8 + py-1.5 px-3 + text-xs leading-4
   */
  sm: "min-h-8 px-3 py-1.5 text-xs font-semibold leading-4 rounded-full",

  /**
   * default: Standard interactive controls (Search inputs, action buttons, modals)
   * Content-driven with 40px baseline floor: min-h-10 + py-[0.5625rem] px-4 + text-sm leading-5
   */
  default: "min-h-10 px-4 py-[0.5625rem] text-sm font-semibold leading-5 rounded-full",

  /**
   * lg: Prominent hero controls
   * Content-driven with 48px baseline floor: min-h-12 + py-[0.6875rem] px-5 + text-base leading-6
   */
  lg: "min-h-12 px-5 py-[0.6875rem] text-base font-semibold leading-6 rounded-full",
} as const

export type ControlSize = keyof typeof CONTROL_SIZES

export const CONTROL_HEIGHTS: Record<ControlSize, string> = {
  sm: "min-h-8",
  default: "min-h-10",
  lg: "min-h-12",
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
