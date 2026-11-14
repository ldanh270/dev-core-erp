import type { ErdPoint } from "./database-erd-geometry"
import type { HorizontalTrack, VerticalTrack } from "./database-erd-tracks"

export type { HorizontalTrack, VerticalTrack }
export {
  allocateHorizontalY,
  allocateVerticalX,
  TRACK_MIN_SEPARATION,
  TRACK_OFFSETS,
} from "./database-erd-tracks"
export { waypointsToOrthogonalPath } from "./database-erd-path"

/**
 * Bounding box of a rendered table card on the ERD canvas.
 */
export interface NodeBox {
  name: string
  left: number
  right: number
  top: number
  bottom: number
}

const OBSTACLE_CLEARANCE_X = 12
const OBSTACLE_CLEARANCE_Y = 12

/**
 * Converts node positions and heights into bounding boxes for obstacle detection.
 *
 * @param positions - Current coordinates of tables.
 * @param heights - Computed rendered heights.
 * @param nodeWidth - Fixed node width in pixels.
 * @param defaultHeight - Fallback height if not found in map.
 * @returns Array of table bounding boxes.
 */
export function buildNodeBoxes(
  positions: Map<string, ErdPoint>,
  heights: Map<string, number>,
  nodeWidth: number,
  defaultHeight: number,
): NodeBox[] {
  const boxes: NodeBox[] = []
  for (const [name, pos] of positions) {
    const h = heights.get(name) ?? defaultHeight
    boxes.push({
      name,
      left: pos.x,
      right: pos.x + nodeWidth,
      top: pos.y,
      bottom: pos.y + h,
    })
  }
  return boxes
}

/**
 * Precomputes horizontal street center Y coordinates between row bands once per layout pass.
 *
 * @param boxes - Collection of table obstacle boxes.
 * @returns Array of deduplicated street center Y values.
 */
export function buildStreetCenters(boxes: NodeBox[]): number[] {
  const uniqueCenters = new Set<number>()
  for (const box of boxes) {
    if (box.top - 60 > 16) uniqueCenters.add(Math.round((box.top - 60) / 4) * 4)
    uniqueCenters.add(Math.round((box.bottom + 60) / 4) * 4)
  }
  return [...uniqueCenters]
}

/**
 * Checks whether a horizontal segment [x1, x2] at y intersects any non-endpoint table box.
 *
 * @param x1 - Start horizontal coordinate.
 * @param x2 - End horizontal coordinate.
 * @param y - Vertical coordinate.
 * @param boxes - Table bounding boxes.
 * @param excludeA - Source table to ignore.
 * @param excludeB - Target table to ignore.
 * @returns True if segment has clear line of sight.
 */
export function isHorizontalClear(
  x1: number,
  x2: number,
  y: number,
  boxes: NodeBox[],
  excludeA: string,
  excludeB: string,
): boolean {
  const minX = Math.min(x1, x2) + OBSTACLE_CLEARANCE_X
  const maxX = Math.max(x1, x2) - OBSTACLE_CLEARANCE_X
  if (maxX <= minX) return true

  for (const box of boxes) {
    if (box.name === excludeA || box.name === excludeB) continue
    if (
      box.right > minX &&
      box.left < maxX &&
      y >= box.top - OBSTACLE_CLEARANCE_Y &&
      y <= box.bottom + OBSTACLE_CLEARANCE_Y
    ) {
      return false
    }
  }
  return true
}

/**
 * Checks whether a vertical segment [y1, y2] at x intersects any table box.
 *
 * @param x - Horizontal coordinate.
 * @param y1 - Start vertical coordinate.
 * @param y2 - End vertical coordinate.
 * @param boxes - Table bounding boxes.
 * @returns True if segment has clear line of sight.
 */
export function isVerticalClear(x: number, y1: number, y2: number, boxes: NodeBox[]): boolean {
  const minY = Math.min(y1, y2) + 2
  const maxY = Math.max(y1, y2) - 2
  if (maxY <= minY) return true

  for (const box of boxes) {
    if (
      x >= box.left - OBSTACLE_CLEARANCE_X &&
      x <= box.right + OBSTACLE_CLEARANCE_X &&
      box.bottom > minY &&
      box.top < maxY
    ) {
      return false
    }
  }
  return true
}
