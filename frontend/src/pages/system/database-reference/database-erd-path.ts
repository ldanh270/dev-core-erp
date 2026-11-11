import type { ErdPoint } from "./database-erd-geometry"

const CORNER_RADIUS = 7

/**
 * Converts a sequence of orthogonal points into an SVG path string with rounded filleted corners.
 *
 * @param points - Array of orthogonal Manhattan waypoints.
 * @returns SVG path definition string (`M ... L ... Q ...`).
 */
export function waypointsToOrthogonalPath(points: ErdPoint[]): string {
  if (points.length < 2) return ""

  const first = points.at(0)
  if (!first) return ""

  let d = `M ${first.x} ${first.y}`

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points.at(i - 1)
    const curr = points.at(i)
    const next = points.at(i + 1)
    if (!prev || !curr || !next) continue

    const inDx = curr.x - prev.x
    const inDy = curr.y - prev.y
    const outDx = next.x - curr.x
    const outDy = next.y - curr.y

    const inLen = Math.abs(inDx) + Math.abs(inDy)
    const outLen = Math.abs(outDx) + Math.abs(outDy)
    const r = Math.min(CORNER_RADIUS, inLen / 2, outLen / 2)

    if (r < 2) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const inUx = inDx === 0 ? 0 : Math.sign(inDx)
    const inUy = inDy === 0 ? 0 : Math.sign(inDy)
    const outUx = outDx === 0 ? 0 : Math.sign(outDx)
    const outUy = outDy === 0 ? 0 : Math.sign(outDy)

    const startX = curr.x - inUx * r
    const startY = curr.y - inUy * r
    const endX = curr.x + outUx * r
    const endY = curr.y + outUy * r

    d += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`
  }

  const last = points.at(-1)
  if (last) d += ` L ${last.x} ${last.y}`
  return d
}
