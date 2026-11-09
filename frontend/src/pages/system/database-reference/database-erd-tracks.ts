import type { NodeBox } from "./database-erd-collision"
import { isHorizontalClear, isVerticalClear } from "./database-erd-collision"

/**
 * Occupied horizontal track interval inside a horizontal street corridor.
 */
export interface HorizontalTrack {
  y: number
  minX: number
  maxX: number
  groupKey: string
}

/**
 * Occupied vertical track interval inside a vertical avenue corridor.
 */
export interface VerticalTrack {
  x: number
  minY: number
  maxY: number
  groupKey: string
}

export const TRACK_MIN_SEPARATION = 15
export const TRACK_OFFSETS = [0, 16, -16, 32, -32, 48, -48, 64, -64, 80, -80, 96, -96]

/**
 * Allocates a non-overlapping vertical track X coordinate in a vertical avenue.
 *
 * @param baseX - Center coordinate of the avenue corridor.
 * @param y1 - Start vertical coordinate.
 * @param y2 - End vertical coordinate.
 * @param groupKey - Shared bus identifier for grouped edges.
 * @param tracks - Existing vertical track reservations.
 * @param boxes - Table bounding boxes to avoid.
 * @returns Allocated X coordinate for the vertical trunk.
 */
export function allocateVerticalX(
  baseX: number,
  y1: number,
  y2: number,
  groupKey: string,
  tracks: VerticalTrack[],
  boxes: NodeBox[],
): number {
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  /**
   * Reuse existing bus trunk X if another branch of the same groupKey already claimed a clear lane nearby.
   */
  for (const t of tracks) {
    if (
      t.groupKey === groupKey &&
      Math.abs(t.x - baseX) <= 72 &&
      isVerticalClear(t.x, minY, maxY, boxes)
    ) {
      t.minY = Math.min(t.minY, minY)
      t.maxY = Math.max(t.maxY, maxY)
      return t.x
    }
  }

  for (const offset of TRACK_OFFSETS) {
    const candX = Math.round(baseX + offset)
    if (!isVerticalClear(candX, minY, maxY, boxes)) continue

    let hasConflict = false
    for (const t of tracks) {
      if (
        Math.abs(t.x - candX) < TRACK_MIN_SEPARATION &&
        t.maxY >= minY - 6 &&
        t.minY <= maxY + 6
      ) {
        hasConflict = true
        break
      }
    }
    if (!hasConflict) {
      tracks.push({ x: candX, minY, maxY, groupKey })
      return candX
    }
  }

  const fallbackX = Math.round(baseX)
  tracks.push({ x: fallbackX, minY, maxY, groupKey })
  return fallbackX
}

/**
 * Allocates a non-overlapping horizontal street Y coordinate avoiding obstacle boxes and parallel lines.
 *
 * @param x1 - Start horizontal coordinate.
 * @param x2 - End horizontal coordinate.
 * @param preferredY - Preferred midpoint Y coordinate.
 * @param groupKey - Shared bus identifier.
 * @param tracks - Existing horizontal track reservations.
 * @param boxes - Table bounding boxes to avoid.
 * @param streetCenters - Precomputed center Y coordinates of horizontal streets.
 * @param excludeA - Source table to ignore in collision detection.
 * @param excludeB - Target table to ignore in collision detection.
 * @returns Allocated Y coordinate for the horizontal segment.
 */
export function allocateHorizontalY(
  x1: number,
  x2: number,
  preferredY: number,
  groupKey: string,
  tracks: HorizontalTrack[],
  boxes: NodeBox[],
  streetCenters: number[],
  excludeA: string,
  excludeB: string,
): number {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)

  /**
   * Reuse an existing horizontal bus line in the same corridor if it belongs to the same PK bus group.
   */
  for (const t of tracks) {
    if (
      t.groupKey === groupKey &&
      Math.abs(t.y - preferredY) <= 96 &&
      isHorizontalClear(minX, maxX, t.y, boxes, excludeA, excludeB)
    ) {
      t.minX = Math.min(t.minX, minX)
      t.maxX = Math.max(t.maxX, maxX)
      return t.y
    }
  }

  const sortedStreets = [...streetCenters].sort(
    (a, b) => Math.abs(a - preferredY) - Math.abs(b - preferredY),
  )

  for (const center of sortedStreets) {
    for (const offset of TRACK_OFFSETS) {
      const candY = center + offset
      if (!isHorizontalClear(minX, maxX, candY, boxes, excludeA, excludeB)) continue

      let hasConflict = false
      for (const t of tracks) {
        if (
          Math.abs(t.y - candY) < TRACK_MIN_SEPARATION &&
          t.maxX >= minX - 6 &&
          t.minX <= maxX + 6
        ) {
          hasConflict = true
          break
        }
      }
      if (!hasConflict) {
        tracks.push({ y: candY, minX, maxX, groupKey })
        return candY
      }
    }
  }

  const fallbackY = Math.round(preferredY)
  tracks.push({ y: fallbackY, minX, maxX, groupKey })
  return fallbackY
}
