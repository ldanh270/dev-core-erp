import type { ErdPoint } from "./database-erd-layout"

// Bounding box of a rendered table card on the ERD canvas.
export interface NodeBox {
  name: string
  left: number
  right: number
  top: number
  bottom: number
}

// Occupied horizontal track interval inside a horizontal street corridor.
export interface HorizontalTrack {
  y: number
  minX: number
  maxX: number
  groupKey: string
}

// Occupied vertical track interval inside a vertical avenue corridor.
export interface VerticalTrack {
  x: number
  minY: number
  maxY: number
  groupKey: string
}

const OBSTACLE_CLEARANCE_X = 12
const OBSTACLE_CLEARANCE_Y = 12
const TRACK_MIN_SEPARATION = 15
const TRACK_OFFSETS = [0, 16, -16, 32, -32, 48, -48, 64, -64, 80, -80, 96, -96]

// Convert node positions and heights into bounding boxes for obstacle detection.
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

// Check whether a horizontal segment [x1, x2] at y intersects any non-endpoint table box.
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

  return boxes.every((box) => {
    if (box.name === excludeA || box.name === excludeB) return true
    const overlapsX = box.right > minX && box.left < maxX
    const overlapsY = y >= box.top - OBSTACLE_CLEARANCE_Y && y <= box.bottom + OBSTACLE_CLEARANCE_Y
    return !(overlapsX && overlapsY)
  })
}

// Check whether a vertical segment [y1, y2] at x intersects any table box.
export function isVerticalClear(
  x: number,
  y1: number,
  y2: number,
  boxes: NodeBox[],
): boolean {
  const minY = Math.min(y1, y2) + 2
  const maxY = Math.max(y1, y2) - 2
  if (maxY <= minY) return true

  return boxes.every((box) => {
    const overlapsX = x >= box.left - OBSTACLE_CLEARANCE_X && x <= box.right + OBSTACLE_CLEARANCE_X
    const overlapsY = box.bottom > minY && box.top < maxY
    return !(overlapsX && overlapsY)
  })
}

// Allocate a non-overlapping vertical track X coordinate in a vertical avenue.
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

  // Reuse existing bus trunk X if another branch of the same groupKey already claimed a clear lane nearby.
  const existing = tracks.find(
    (t) =>
      t.groupKey === groupKey &&
      Math.abs(t.x - baseX) <= 72 &&
      isVerticalClear(t.x, minY, maxY, boxes),
  )
  if (existing) {
    existing.minY = Math.min(existing.minY, minY)
    existing.maxY = Math.max(existing.maxY, maxY)
    return existing.x
  }

  for (const offset of TRACK_OFFSETS) {
    const candX = Math.round(baseX + offset)
    if (!isVerticalClear(candX, minY, maxY, boxes)) continue

    // Enforce TRACK_MIN_SEPARATION against ALL non-merged vertical tracks so parallel lines never stick together.
    const hasConflict = tracks.some(
      (t) =>
        Math.abs(t.x - candX) < TRACK_MIN_SEPARATION &&
        t.maxY >= minY - 6 &&
        t.minY <= maxY + 6,
    )
    if (!hasConflict) {
      tracks.push({ x: candX, minY, maxY, groupKey })
      return candX
    }
  }

  const fallbackX = Math.round(baseX)
  tracks.push({ x: fallbackX, minY, maxY, groupKey })
  return fallbackX
}

// Allocate a non-overlapping horizontal street Y coordinate that avoids both obstacle boxes and parallel lines.
export function allocateHorizontalY(
  x1: number,
  x2: number,
  preferredY: number,
  groupKey: string,
  tracks: HorizontalTrack[],
  boxes: NodeBox[],
  excludeA: string,
  excludeB: string,
): number {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)

  // Reuse an existing horizontal bus line in the same corridor if it belongs to the same PK bus group.
  const existing = tracks.find(
    (t) =>
      t.groupKey === groupKey &&
      Math.abs(t.y - preferredY) <= 96 &&
      isHorizontalClear(minX, maxX, t.y, boxes, excludeA, excludeB),
  )
  if (existing) {
    existing.minX = Math.min(existing.minX, minX)
    existing.maxX = Math.max(existing.maxX, maxX)
    return existing.y
  }

  // Collect candidate horizontal street centers between row bands first, then preferredY.
  const streetCenters: number[] = []
  for (const box of boxes) {
    if (box.top - 60 > 16) streetCenters.push(box.top - 60)
    streetCenters.push(box.bottom + 60)
  }
  streetCenters.sort((a, b) => Math.abs(a - preferredY) - Math.abs(b - preferredY))
  const baseCandidates: number[] = [...streetCenters, Math.round(preferredY)]

  for (const baseCand of baseCandidates) {
    for (const offset of TRACK_OFFSETS) {
      const candY = Math.round(baseCand + offset)
      if (candY < 16) continue
      if (!isHorizontalClear(minX, maxX, candY, boxes, excludeA, excludeB)) continue

      // Enforce TRACK_MIN_SEPARATION against ALL non-merged horizontal tracks so parallel lines never clump.
      const hasConflict = tracks.some(
        (t) =>
          Math.abs(t.y - candY) < TRACK_MIN_SEPARATION &&
          t.maxX >= minX - 6 &&
          t.minX <= maxX + 6,
      )
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

// Remove duplicate or collinear intermediate points from an orthogonal waypoint chain.
function simplifyWaypoints(points: ErdPoint[]): ErdPoint[] {
  const deduped = points.filter((pt, idx) => {
    if (idx === 0) return true
    const prev = points.at(idx - 1)
    return !prev || Math.abs(pt.x - prev.x) > 0.5 || Math.abs(pt.y - prev.y) > 0.5
  })

  if (deduped.length <= 2) return deduped
  const firstPt = deduped.at(0)
  if (!firstPt) return deduped
  const result: ErdPoint[] = [firstPt]

  for (let i = 1; i < deduped.length - 1; i += 1) {
    const prev = result.at(-1)
    const curr = deduped.at(i)
    const next = deduped.at(i + 1)
    if (!prev || !curr || !next) continue
    const sameX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5
    const sameY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5
    if (!sameX && !sameY) {
      result.push(curr)
    }
  }

  const lastPt = deduped.at(-1)
  if (lastPt) result.push(lastPt)
  return result
}

// Convert orthogonal waypoints into an SVG path string with smooth rounded 90-degree corners.
export function waypointsToOrthogonalPath(rawPoints: ErdPoint[], cornerRadius = 6): string {
  const points = simplifyWaypoints(rawPoints)
  const first = points.at(0)
  if (!first) return ""
  if (points.length === 1) return `M ${first.x} ${first.y}`

  const parts: string[] = [`M ${Math.round(first.x)} ${Math.round(first.y)}`]

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points.at(i - 1)
    const curr = points.at(i)
    const next = points.at(i + 1)
    if (!prev || !curr || !next) continue

    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const len1 = Math.hypot(dx1, dy1)

    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y
    const len2 = Math.hypot(dx2, dy2)

    const r = Math.min(cornerRadius, len1 / 2, len2 / 2)
    if (r < 1.5) {
      parts.push(`L ${Math.round(curr.x)} ${Math.round(curr.y)}`)
      continue
    }

    const startX = curr.x - (dx1 / len1) * r
    const startY = curr.y - (dy1 / len1) * r
    const endX = curr.x + (dx2 / len2) * r
    const endY = curr.y + (dy2 / len2) * r

    parts.push(`L ${Math.round(startX * 10) / 10} ${Math.round(startY * 10) / 10}`)
    parts.push(
      `Q ${Math.round(curr.x)} ${Math.round(curr.y)} ${Math.round(endX * 10) / 10} ${Math.round(endY * 10) / 10}`,
    )
  }

  const last = points.at(-1)
  if (last) parts.push(`L ${Math.round(last.x)} ${Math.round(last.y)}`)
  return parts.join(" ")
}
