import type { NodeBox } from "./database-erd-collision"
import { isHorizontalClear } from "./database-erd-collision"
import type { ErdPoint } from "./database-erd-geometry"
import {
  DEFAULT_EDGE_ANCHOR_Y,
  ERD_NODE_WIDTH,
  FIELD_ANCHOR_STEP_Y,
  FIRST_FIELD_ANCHOR_Y,
  getLinkedColumns,
} from "./database-erd-geometry"
import type { HorizontalTrack, VerticalTrack } from "./database-erd-tracks"
import { allocateHorizontalY, allocateVerticalX } from "./database-erd-tracks"
import type { TableDef } from "./database-reference.types"

export type RouteMode = "self" | "same-col" | "left-to-right" | "right-to-left"

export interface EdgeDraft {
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

/**
 * Resolves the vertical pixel offset for a specific column row inside a table card.
 *
 * @param table - Table definition containing columns.
 * @param columnName - Name of the field to anchor.
 * @param preferPk - Whether to fallback to PK row when target column is hidden.
 * @returns Vertical offset from table top.
 */
export function getFieldOffsetY(table: TableDef, columnName: string, preferPk = false): number {
  const linkedCols = getLinkedColumns(table)
  let colIdx = linkedCols.findIndex((c) => c.name === columnName)
  if (colIdx < 0 && preferPk) {
    colIdx = linkedCols.findIndex((c) => c.isPk)
  }
  return colIdx >= 0 ? FIRST_FIELD_ANCHOR_Y + colIdx * FIELD_ANCHOR_STEP_Y : DEFAULT_EDGE_ANCHOR_Y
}

/**
 * Determines the orthogonal connection mode and port endpoints between two positioned tables.
 *
 * @param sourceTable - Source table name.
 * @param targetTable - Target referenced table name.
 * @param sourcePos - Source table coordinates.
 * @param targetPos - Target table coordinates.
 * @param sourceOffsetY - Port offset within source node.
 * @param targetOffsetY - Port offset within target node.
 * @returns Routing geometry mode and start/end coordinates.
 */
export function resolveEndpoints(
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

/**
 * Builds orthogonal Manhattan waypoints with interval-based track separation in avenues and streets.
 *
 * @param draft - Edge specifications and endpoints.
 * @param verticalTracks - Existing vertical avenue tracks.
 * @param horizontalTracks - Existing horizontal street tracks.
 * @param boxes - Table bounding boxes to route around.
 * @param streetCenters - Precomputed center Y coordinates of horizontal streets.
 * @returns Array of orthogonal 2D waypoints.
 */
export function buildOrthogonalWaypoints(
  draft: EdgeDraft,
  verticalTracks: VerticalTrack[],
  horizontalTracks: HorizontalTrack[],
  boxes: NodeBox[],
  streetCenters: number[],
): ErdPoint[] {
  const { from, to, mode, baseTrunkX, preferredMidY, busKey, sourceTable, targetTable } = draft

  if (mode === "self") {
    const loopX = allocateVerticalX(
      baseTrunkX,
      from.y - 18,
      to.y + 18,
      busKey,
      verticalTracks,
      boxes,
    )
    return [from, { x: loopX, y: from.y }, { x: loopX, y: to.y }, to]
  }

  if (mode === "same-col") {
    const avenueX = allocateVerticalX(baseTrunkX, from.y, to.y, busKey, verticalTracks, boxes)
    return [from, { x: avenueX, y: from.y }, { x: avenueX, y: to.y }, to]
  }

  const trunkX = allocateVerticalX(baseTrunkX, from.y, to.y, busKey, verticalTracks, boxes)
  const isDirectClear = isHorizontalClear(
    from.x,
    to.x,
    preferredMidY,
    boxes,
    sourceTable,
    targetTable,
  )

  if (isDirectClear) {
    const streetY = allocateHorizontalY(
      from.x,
      to.x,
      preferredMidY,
      busKey,
      horizontalTracks,
      boxes,
      streetCenters,
      sourceTable,
      targetTable,
    )
    return [from, { x: trunkX, y: from.y }, { x: trunkX, y: streetY }, { x: to.x, y: streetY }, to]
  }

  const stubX =
    mode === "left-to-right" ? from.x + SOURCE_STUB_MARGIN_X : from.x - SOURCE_STUB_MARGIN_X
  const streetY = allocateHorizontalY(
    stubX,
    trunkX,
    preferredMidY,
    busKey,
    horizontalTracks,
    boxes,
    streetCenters,
    sourceTable,
    targetTable,
  )

  return [
    from,
    { x: stubX, y: from.y },
    { x: stubX, y: streetY },
    { x: trunkX, y: streetY },
    { x: trunkX, y: to.y },
    to,
  ]
}
