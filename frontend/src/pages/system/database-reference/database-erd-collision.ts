import type { TableDef } from "./database-reference.types"
import type { ErdPoint } from "./database-erd-layout"

const DEFAULT_EDGE_ANCHOR_Y = 40
const MIN_NODE_HEIGHT = 120
const COLLISION_PADDING_Y = 12
const COLLISION_SHIFT_CLEARANCE_Y = 28
const ERD_NODE_WIDTH = 280

// Detect straight edges that cross intermediate columns and push intersecting nodes downward.
export function avoidLineCollisions(
  layers: string[][],
  tables: TableDef[],
  positions: Map<string, ErdPoint>,
  heights: Map<string, number>,
): void {
  for (const table of tables) {
    for (const rel of table.outgoingRelations) {
      const fromPos = positions.get(table.name)
      const toPos = positions.get(rel.targetTable)
      if (!fromPos || !toPos || Math.abs(fromPos.x - toPos.x) <= ERD_NODE_WIDTH) continue
      const minX = Math.min(fromPos.x, toPos.x) + ERD_NODE_WIDTH
      const maxX = Math.max(fromPos.x, toPos.x)
      const y1 = fromPos.y + DEFAULT_EDGE_ANCHOR_Y
      const y2 = toPos.y + DEFAULT_EDGE_ANCHOR_Y

      for (const layer of layers) {
        const firstPos = positions.get(layer.at(0) ?? "")
        if (!firstPos || firstPos.x < minX || firstPos.x >= maxX) continue
        const t = (firstPos.x + ERD_NODE_WIDTH / 2 - fromPos.x) / (toPos.x - fromPos.x)
        const lineY = y1 + t * (y2 - y1)

        for (let i = 0; i < layer.length; i += 1) {
          const nodeName = layer.at(i)
          if (!nodeName) continue
          const nodePos = positions.get(nodeName)
          const nodeH = heights.get(nodeName) ?? MIN_NODE_HEIGHT
          if (
            nodePos &&
            lineY >= nodePos.y - COLLISION_PADDING_Y &&
            lineY <= nodePos.y + nodeH + COLLISION_PADDING_Y
          ) {
            const shift = lineY - nodePos.y + COLLISION_SHIFT_CLEARANCE_Y
            for (let j = i; j < layer.length; j += 1) {
              const shiftedName = layer.at(j)
              const p = shiftedName ? positions.get(shiftedName) : undefined
              if (p && shiftedName) positions.set(shiftedName, { x: p.x, y: p.y + shift })
            }
          }
        }
      }
    }
  }
}
