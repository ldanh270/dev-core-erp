/**
 * Centralized Layout Dimension Constants
 * Semantic tokens for containers, panels, modals, and responsive drawer shells.
 * Follows 4px / 8px Tailwind grid multiples.
 */

export const LAYOUT_DIMENSIONS = {
  /** Side context panel for settings / split screens */
  SIDE_PANEL_MD: "384px", // w-96
  SIDE_PANEL_SM: "320px", // w-80

  /** Modal max-width limits */
  MODAL_MAX_WIDTH: {
    SM: "480px",
    MD: "560px",
    LG: "720px",
    XL: "960px",
  },

  /** Full-page form max width container */
  FORM_MAX_WIDTH: {
    COMPACT: "768px",  // max-w-3xl
    STANDARD: "896px", // max-w-4xl
    WIDE: "1024px",    // max-w-5xl
  },

  /** Drawer widths */
  DRAWER_WIDTH: {
    MD: "480px",
    LG: "640px",
    XL: "800px",
  },
} as const

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  KANBAN_DROP: 300,
} as const
