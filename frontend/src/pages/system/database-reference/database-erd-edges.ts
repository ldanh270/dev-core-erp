import type { TableDef } from "./database-reference.types"
import type { HorizontalTrack, NodeBox, VerticalTrack } from "./database-erd-collision"
import {
  allocateHorizontalY,
  allocateVerticalX,
  buildNodeBoxes,
  buildStreetCenters,
  isHorizontalClear,
  waypointsToOrthogonalPath,
} from "./database-erd-collision"
import type { ErdEdge, ErdPoint } from "./database-erd-layout"
import {
  DEFAULT_EDGE_ANCHOR_Y,
  ERD_NODE_WIDTH,
  FIELD_ANCHOR_STEP_Y,
  FIRST_FIELD_ANCHOR_Y,
  getLinkedColumns,
  MIN_NODE_HEIGHT,
} from "./database-erd-layout"

type RouteMode = "self" | "same-col" | "left-to-right" | "right-to-left"

interface EdgeDraft {
  id: string
  sourceTable: string
  targetTable: string
  from: ErdPoint
  to: ErdPoint
  preferredMidY: number
  mode: RouteMode
  baseTrunkX: number
  busKey: string
  highlighted: boolean
  dimmed: boolean
  crossModule: boolean
}

const ADJACENT_SPAN_THRESHOLD_X = 340
const SELF_LOOP_OFFSET_X = 28
const SAME_COL_OFFSET_X = 44
const TARGET_TRUNK_MARGIN_X = 64
const SOURCE_STUB_MARGIN_X = 48

// Resolve the vertical pixel offset for a specific column row inside a table card.
function getFieldOffsetY(table: TableDef, columnName: string, preferPk = false): number {
  const linkedCols = getLinkedColumns(table)
  let colIdx = linkedCols.findIndex((c) => c.name === columnName)
  if (colIdx < 0 && preferPk) {
    colIdx = linkedCols.findIndex((c) => c.isPk)
  }
  return colIdx >= 0 ? FIRST_FIELD_ANCHOR_Y + colIdx * FIELD_ANCHOR_STEP_Y : DEFAULT_EDGE_ANCHOR_Y
}

// Determine the orthogonal connection mode and port endpoints between two positioned tables.
function resolveEndpoints(
  sourceTable: string,
  targetTable: string,
  sourcePos: ErdPoint,
  targetPos: ErdPoint,
  sourceOffsetY: number,
  targetOffsetY: number,
): { from: ErdPoint; to: ErdPoint; mode: RouteMode; baseTrunkX: number } {
  const sy = sourcePos.y + sourceOffsetY
  const ty = targetPos.y + targetOffsetY

  if (sourceTable === targetTable) {
    const rightX = sourcePos.x + ERD_NODE_WIDTH
    return {
      from: { x: rightX, y: sy },
      to: { x: rightX, y: Math.abs(sy - ty) < 6 ? ty - 12 : ty },
      mode: "self",
      baseTrunkX: rightX + SELF_LOOP_OFFSET_X,
    }
  }

  if (Math.abs(sourcePos.x - targetPos.x) < 24) {
    const leftX = Math.min(sourcePos.x, targetPos.x)
    return {
      from: { x: sourcePos.x, y: sy },
      to: { x: targetPos.x, y: ty },
      mode: "same-col",
      baseTrunkX: leftX - SAME_COL_OFFSET_X,
    }
  }

  const isLeftToRight = sourcePos.x < targetPos.x
  const fromX = isLeftToRight ? sourcePos.x + ERD_NODE_WIDTH : sourcePos.x
  const toX = isLeftToRight ? targetPos.x : targetPos.x + ERD_NODE_WIDTH
  const spanX = Math.abs(toX - fromX)
  const baseTrunkX =
    spanX <= ADJACENT_SPAN_THRESHOLD_X
      ? (fromX + toX) / 2
      : isLeftToRight
        ? toX - TARGET_TRUNK_MARGIN_X
        : toX + TARGET_TRUNK_MARGIN_X

  return {
    from: { x: fromX, y: sy },
    to: { x: toX, y: ty },
    mode: isLeftToRight ? "left-to-right" : "right-to-left",
    baseTrunkX,
  }
}

// Build orthogonal Manhattan waypoints with interval-based track separation in both vertical avenues and horizontal streets.
function buildOrthogonalWaypoints(
  draft: EdgeDraft,
  verticalTracks: VerticalTrack[],
  horizontalTracks: HorizontalTrack[],
  boxes: NodeBox[],
  streetCenters: number[],
): ErdPoint[] {
  const { from, to, mode, baseTrunkX, busKey, sourceTable, targetTable } = draft

  if (mode === "self") {
    return [from, { x: baseTrunkX, y: from.y }, { x: baseTrunkX, y: to.y }, to]
  }

  if (mode === "same-col") {
    const trunkX = allocateVerticalX(baseTrunkX, from.y, to.y, busKey, verticalTracks, boxes)
    return [from, { x: trunkX, y: from.y }, { x: trunkX, y: to.y }, to]
  }

  const isAdjacentSpan = Math.abs(to.x - from.x) <= ADJACENT_SPAN_THRESHOLD_X
  const canGoDirect =
    isAdjacentSpan &&
    isHorizontalClear(from.x, baseTrunkX, from.y, boxes, sourceTable, targetTable)

  if (canGoDirect) {
    const trunkX = allocateVerticalX(baseTrunkX, from.y, to.y, busKey, verticalTracks, boxes)
    return [from, { x: trunkX, y: from.y }, { x: trunkX, y: to.y }, to]
  }

  const stubDir = mode === "left-to-right" ? 1 : -1
  const baseExitX = from.x + stubDir * SOURCE_STUB_MARGIN_X
  const corridorY = allocateHorizontalY(
    baseExitX,
    baseTrunkX,
    draft.preferredMidY,
    busKey,
    horizontalTracks,
    boxes,
    streetCenters,
    sourceTable,
    targetTable,
  )
  const sourceGroupKey = `src::${sourceTable}::${busKey}`
  const exitX = allocateVerticalX(
    baseExitX,
    from.y,
    corridorY,
    sourceGroupKey,
    verticalTracks,
    boxes,
  )
  const trunkX = allocateVerticalX(baseTrunkX, corridorY, to.y, busKey, verticalTracks, boxes)

  return [
    from,
    { x: exitX, y: from.y },
    { x: exitX, y: corridorY },
    { x: trunkX, y: corridorY },
    { x: trunkX, y: to.y },
    to,
  ]
}

// Compute orthogonal Draw.io-style edges with PK bus merging, non-overlapping track allocation, and obstacle avoidance.
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

  // Route shorter local edges first so they claim inner lanes closest to their tables.
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

  // Render dimmed/normal edges first and highlighted edges last so active paths stay on top.
  return edges.sort((a, b) => Number(a.highlighted) - Number(b.highlighted))
}

// Return semantic stroke classes for active, dimmed, cross-module dashed, or standard orthogonal lines.
export function getErdEdgeClassName(
  edge: Pick<ErdEdge, "highlighted" | "crossModule"> & { dimmed?: boolean },
): string {
  if (edge.highlighted) return "stroke-primary stroke-[2.5] opacity-100"
  if (edge.dimmed) return "stroke-muted-foreground/30 stroke-[1.25] opacity-35"
  if (edge.crossModule) {
    return "stroke-primary/75 stroke-[1.75] opacity-85 [stroke-dasharray:6_4]"
  }
  return "stroke-muted-foreground/75 stroke-[1.75] opacity-90"
}
