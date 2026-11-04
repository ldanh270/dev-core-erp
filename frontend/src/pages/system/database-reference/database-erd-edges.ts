import type { TableDef } from "./database-reference.types"
import type { ErdEdge, ErdPoint } from "./database-erd-layout"
import {
  DEFAULT_EDGE_ANCHOR_Y,
  ERD_NODE_WIDTH,
  FIELD_ANCHOR_STEP_Y,
  FIRST_FIELD_ANCHOR_Y,
  getLinkedColumns,
  MIN_NODE_HEIGHT,
} from "./database-erd-layout"

interface EdgeDraft {
  id: string
  sourceTable: string
  targetTable: string
  from: ErdPoint
  sourceIsLeft: boolean
  sourceY: number
  highlighted: boolean
  crossModule: boolean
}

// Compute straight-line edge endpoints with distributed target anchor slots to eliminate spider-web clustering.
export function createEdges(
  tables: TableDef[],
  tableByName: Map<string, TableDef>,
  positions: Map<string, ErdPoint>,
  heights: Map<string, number>,
  selectedTableName: string | null,
): ErdEdge[] {
  const rawEdges: EdgeDraft[] = []

  for (const table of tables) {
    const linkedCols = getLinkedColumns(table)
    for (const relation of table.outgoingRelations) {
      const source = positions.get(table.name)
      const target = positions.get(relation.targetTable)
      const targetTable = tableByName.get(relation.targetTable)
      if (!source || !target || !targetTable) continue

      const colIdx = linkedCols.findIndex((c) => c.name === relation.sourceColumn)
      const sourceOffsetY =
        colIdx >= 0 ? FIRST_FIELD_ANCHOR_Y + colIdx * FIELD_ANCHOR_STEP_Y : DEFAULT_EDGE_ANCHOR_Y
      const sourceIsLeft = source.x < target.x

      rawEdges.push({
        id: `${table.name}-${relation.sourceColumn}->${relation.targetTable}`,
        sourceTable: table.name,
        targetTable: relation.targetTable,
        from: { x: source.x + (sourceIsLeft ? ERD_NODE_WIDTH : 0), y: source.y + sourceOffsetY },
        sourceIsLeft,
        sourceY: source.y + sourceOffsetY,
        highlighted: table.name === selectedTableName || relation.targetTable === selectedTableName,
        crossModule: table.module !== targetTable.module,
      })
    }
  }

  // Group incoming edges by target table and incoming side (left or right)
  const leftIncoming = new Map<string, EdgeDraft[]>()
  const rightIncoming = new Map<string, EdgeDraft[]>()

  for (const edge of rawEdges) {
    const map = edge.sourceIsLeft ? leftIncoming : rightIncoming
    const list = map.get(edge.targetTable) ?? []
    list.push(edge)
    map.set(edge.targetTable, list)
  }

  // Assign distinct evenly spaced vertical anchor points for edges entering the same table side
  const targetOffsetYMap = new Map<string, number>()

  const assignOffsets = (map: Map<string, EdgeDraft[]>) => {
    for (const [targetName, edgeList] of map) {
      edgeList.sort((a, b) => a.sourceY - b.sourceY)
      const targetH = heights.get(targetName) ?? MIN_NODE_HEIGHT
      const startY = 36
      const endY = Math.max(startY + 20, targetH - 24)
      const count = edgeList.length

      edgeList.forEach((edge, idx) => {
        const offset = count === 1 ? DEFAULT_EDGE_ANCHOR_Y : startY + (idx / (count - 1)) * (endY - startY)
        targetOffsetYMap.set(edge.id, offset)
      })
    }
  }

  assignOffsets(leftIncoming)
  assignOffsets(rightIncoming)

  return rawEdges.map((edge) => {
    const target = positions.get(edge.targetTable) ?? { x: 0, y: 0 }
    const offsetY = targetOffsetYMap.get(edge.id) ?? DEFAULT_EDGE_ANCHOR_Y
    return {
      id: edge.id,
      from: edge.from,
      to: { x: target.x + (edge.sourceIsLeft ? 0 : ERD_NODE_WIDTH), y: target.y + offsetY },
      highlighted: edge.highlighted,
      crossModule: edge.crossModule,
    }
  })
}
// Return semantic stroke classes for active, cross-module dashed, or standard relationship lines.
export function getErdEdgeClassName(edge: Pick<ErdEdge, 'highlighted' | 'crossModule'>): string {
  if (edge.highlighted) return 'stroke-primary stroke-[2.5] opacity-100'
  if (edge.crossModule) {
    return 'stroke-primary/75 stroke-2 opacity-90 [stroke-dasharray:7_4]'
  }
  return 'stroke-muted-foreground/65 stroke-[1.75] opacity-80'
}
