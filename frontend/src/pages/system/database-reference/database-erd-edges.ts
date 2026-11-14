import {
  buildNodeBoxes,
  buildStreetCenters,
  waypointsToOrthogonalPath,
} from "./database-erd-collision"
import type { ErdEdge, ErdPoint } from "./database-erd-geometry"
import { ERD_NODE_WIDTH, FIRST_FIELD_ANCHOR_Y, MIN_NODE_HEIGHT } from "./database-erd-geometry"
import type { HorizontalTrack, VerticalTrack } from "./database-erd-tracks"
import type { EdgeDraft } from "./database-erd-waypoints"
import {
  buildOrthogonalWaypoints,
  getFieldOffsetY,
  resolveEndpoints,
} from "./database-erd-waypoints"
import type { TableDef } from "./database-reference.types"

export { getErdEdgeClassName } from "./database-erd-edge-style"

/**
 * Computes orthogonal relationship lines with PK bus merging and non-overlapping track allocation.
 *
 * @param tables - List of tables to route relationship lines for.
 * @param tableByName - Lookup map of table metadata by name.
 * @param positions - Current canvas coordinates of all tables.
 * @param heights - Computed rendered heights of all tables.
 * @param selectedTableName - Currently focused table for highlighting.
 * @param onlyConnectedToTable - Optional filter to limit edge recomputation during node drag.
 * @param previousEdges - Previous edge collection for incremental routing.
 * @returns Sorted collection of orthogonal relationship edges.
 */
export function createEdges(
  tables: TableDef[],
  tableByName: Map<string, TableDef>,
  positions: Map<string, ErdPoint>,
  heights: Map<string, number>,
  selectedTableName: string | null,
  onlyConnectedToTable?: string | null,
  previousEdges?: ErdEdge[],
): ErdEdge[] {
  const boxes = buildNodeBoxes(positions, heights, ERD_NODE_WIDTH, MIN_NODE_HEIGHT)
  const streetCenters = buildStreetCenters(boxes)
  const drafts: EdgeDraft[] = []
  const filterByTable = Boolean(onlyConnectedToTable && previousEdges && previousEdges.length > 0)

  for (const table of tables) {
    for (const relation of table.outgoingRelations) {
      if (
        filterByTable &&
        table.name !== onlyConnectedToTable &&
        relation.targetTable !== onlyConnectedToTable
      ) {
        continue
      }
      const sourcePos = positions.get(table.name)
      const targetPos = positions.get(relation.targetTable)
      const targetTable = tableByName.get(relation.targetTable)
      if (!sourcePos || !targetPos || !targetTable) continue

      const sourceOffsetY = getFieldOffsetY(table, relation.sourceColumn, false)
      const targetOffsetY = getFieldOffsetY(targetTable, relation.targetColumn, true)
      const { from, to, mode, baseTrunkX } = resolveEndpoints(
        table.name,
        relation.targetTable,
        sourcePos,
        targetPos,
        sourceOffsetY,
        targetOffsetY,
      )

      const tableAnchorY = sourcePos.y + FIRST_FIELD_ANCHOR_Y
      const corridorBucket = Math.round(baseTrunkX / 120)
      const verticalZone =
        tableAnchorY < to.y - 160 ? "top" : tableAnchorY > to.y + 160 ? "bottom" : "mid"
      const zonePortOffsetY = verticalZone === "top" ? -7 : verticalZone === "bottom" ? 7 : 0
      const adjustedTo =
        mode === "left-to-right" || mode === "right-to-left"
          ? { x: to.x, y: to.y + zonePortOffsetY }
          : to
      const preferredMidY = Math.round((tableAnchorY + adjustedTo.y) / 2)
      const busKey = `${corridorBucket}::${relation.targetTable}::${relation.targetColumn}::${mode}::${verticalZone}`
      const highlighted =
        table.name === selectedTableName || relation.targetTable === selectedTableName

      drafts.push({
        id: `${table.name}-${relation.sourceColumn}->${relation.targetTable}-${relation.targetColumn}`,
        sourceTable: table.name,
        targetTable: relation.targetTable,
        from,
        to: adjustedTo,
        preferredMidY,
        mode,
        baseTrunkX,
        busKey,
        highlighted,
        dimmed: selectedTableName !== null && !highlighted,
        crossModule: table.module !== targetTable.module,
      })
    }
  }

  /**
   * Sort shorter local lines first to claim inner avenue tracks closest to their nodes.
   */
  drafts.sort((a, b) => {
    const spanA = Math.abs(a.to.x - a.from.x) + Math.abs(a.to.y - a.from.y)
    const spanB = Math.abs(b.to.x - b.from.x) + Math.abs(b.to.y - b.from.y)
    return spanA - spanB
  })

  const verticalTracks: VerticalTrack[] = []
  const horizontalTracks: HorizontalTrack[] = []

  const edges = drafts.map((draft) => {
    const waypoints = buildOrthogonalWaypoints(
      draft,
      verticalTracks,
      horizontalTracks,
      boxes,
      streetCenters,
    )
    return {
      id: draft.id,
      sourceTable: draft.sourceTable,
      targetTable: draft.targetTable,
      from: draft.from,
      to: draft.to,
      path: waypointsToOrthogonalPath(waypoints),
      highlighted: draft.highlighted,
      dimmed: draft.dimmed,
      crossModule: draft.crossModule,
    }
  })

  if (filterByTable && previousEdges) {
    const updatedById = new Map(edges.map((edge) => [edge.id, edge]))
    return previousEdges.map((edge) => updatedById.get(edge.id) ?? edge)
  }

  /**
   * Render active highlighted paths last so they stay on top of dimmed lines.
   */
  return edges.sort((a, b) => Number(a.highlighted) - Number(b.highlighted))
}
