/**
 * @fileoverview Hook re-export managing ERD canvas pan, zoom, scale, and responsive viewport sizing.
 */

export {
  useDatabaseErdViewport,
  MIN_SCALE,
  MAX_SCALE,
  ZOOM_STEP,
} from "./hooks/use-database-erd-viewport"
export type { ViewportSize } from "./hooks/use-database-erd-viewport"
