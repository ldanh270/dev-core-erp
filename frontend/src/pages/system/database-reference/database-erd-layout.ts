import type { TableDef } from "./database-reference.types"
import { createEdges } from "./database-erd-edges"
import {
  assignRanks,
  centerHubLayers,
  createDependencyMaps,
  getMaxNodesPerColumn,
  groupByRank,
  orderLayers,
  splitLargeLayers,
} from "./database-erd-ranking"
import {
  ERD_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  getNodeHeight,
} from "./database-erd-geometry"
import type {
  BaseErdLayout,
  ErdEdge,
  ErdLayout,
  ErdNode,
  ErdPoint,
} from "./database-erd-geometry"

export type { ErdPoint, ErdNode, ErdEdge, ErdLayout, BaseErdLayout }
export {
  ERD_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  DEFAULT_EDGE_ANCHOR_Y,
  FIRST_FIELD_ANCHOR_Y,
  FIELD_ANCHOR_STEP_Y,
  getLinkedColumns,
  isPrimaryErdTable,
  getNodeHeight,
} from "./database-erd-geometry"

const MIN_NODE_GAP_X = 240
const DEFAULT_NODE_GAP_Y = 124
const COMPACT_NODE_GAP_Y = 132
const CANVAS_MARGIN = 64

/**
 * Maps a node's local index in a column of length `layerLen` onto a distributed row index in `[0, maxRows - 1]`.
 */
function getDistributedRowIndex(localIdx: number, layerLen: number, maxRows: number): number {
  if (layerLen <= 1) return Math.floor(maxRows / 2)
  if (layerLen >= maxRows) return localIdx
  return Math.floor(((localIdx + 0.5) * maxRows) / layerLen)
}

/**
 * Computes topological ranking, radial wing clustering, and aligned row-band coordinates once per table set.
 *
 * @param tables - List of tables.
 * @param minWidth - Minimum target layout canvas width.
 * @returns Cached base layout geometry.
 */
export function createBaseErdLayout(tables: TableDef[], minWidth = 0): BaseErdLayout {
  const visibleTables = tables
  const visibleNames = new Set(visibleTables.map((table) => table.name))
  const tableByName = new Map(visibleTables.map((table) => [table.name, table]))
  const dependencies = createDependencyMaps(visibleTables, visibleNames)
  const ranks = assignRanks(visibleTables, dependencies.parents, dependencies.children)
  const rawLayers = groupByRank(
    visibleTables,
    ranks,
    dependencies.parents,
    dependencies.children,
  )

  orderLayers(rawLayers, dependencies.parents, dependencies.children)
  const maxNodesPerColumn = getMaxNodesPerColumn(visibleTables.length)
  const splitLayers = splitLargeLayers(rawLayers, maxNodesPerColumn)
  const layers = centerHubLayers(
    splitLayers,
    visibleTables,
    dependencies.parents,
    dependencies.children,
    maxNodesPerColumn,
  )
  orderLayers(layers, dependencies.parents, dependencies.children)

  const widestLayer = layers.length
  const horizontalGap =
    widestLayer > 1
      ? Math.max(
          MIN_NODE_GAP_X,
          (minWidth - CANVAS_MARGIN * 2 - widestLayer * ERD_NODE_WIDTH) / (widestLayer - 1),
        )
      : MIN_NODE_GAP_X

  const nodeGapY = visibleTables.length <= 12 ? COMPACT_NODE_GAP_Y : DEFAULT_NODE_GAP_Y
  const heights = new Map(visibleTables.map((t) => [t.name, getNodeHeight(t)]))
  const maxRows = Math.max(1, ...layers.map((layer) => layer.length))

  /**
   * Compute aligned row-band Y coordinates so every gap between rows forms a clear horizontal street across all columns.
   */
  const rowBandTops: number[] = []
  let cursorY = CANVAS_MARGIN

  for (let rowIdx = 0; rowIdx < maxRows; rowIdx += 1) {
    rowBandTops.push(cursorY)
    let rowMaxHeight = MIN_NODE_HEIGHT
    for (const layer of layers) {
      layer.forEach((tableName, localIdx) => {
        if (getDistributedRowIndex(localIdx, layer.length, maxRows) === rowIdx) {
          rowMaxHeight = Math.max(rowMaxHeight, heights.get(tableName) ?? MIN_NODE_HEIGHT)
        }
      })
    }
    cursorY += rowMaxHeight + nodeGapY
  }

  const basePositions = new Map<string, ErdPoint>()
  layers.forEach((layer, colIdx) => {
    const x = CANVAS_MARGIN + colIdx * (ERD_NODE_WIDTH + horizontalGap)

    layer.forEach((tableName, localIdx) => {
      const targetRowIdx = getDistributedRowIndex(localIdx, layer.length, maxRows)
      const bandY = rowBandTops.at(targetRowIdx) ?? CANVAS_MARGIN
      basePositions.set(tableName, { x, y: bandY })
    })
  })

  return {
    visibleTables,
    tableByName,
    basePositions,
    heights,
    baseWidth:
      CANVAS_MARGIN * 2 + widestLayer * ERD_NODE_WIDTH + Math.max(0, widestLayer - 1) * horizontalGap,
    baseHeight: cursorY - nodeGapY + CANVAS_MARGIN,
  }
}

/**
 * Merges manual drag overrides onto cached base layout and routes orthogonal edges without re-ranking tables.
 *
 * @param base - Cached base layout.
 * @param selectedTableName - Currently highlighted table.
 * @param positionOverrides - Map of user-dragged node coordinates.
 * @param onlyConnectedToTable - Dragged table name for incremental edge routing.
 * @param previousEdges - Previous collection of routed edges.
 * @returns Complete ERD graph with nodes and orthogonal edges.
 */
export function buildErdLayoutFromBase(
  base: BaseErdLayout,
  selectedTableName: string | null,
  positionOverrides: ReadonlyMap<string, ErdPoint> = new Map(),
  onlyConnectedToTable?: string | null,
  previousEdges?: ErdEdge[],
): ErdLayout {
  const { visibleTables, tableByName, basePositions, heights, baseWidth, baseHeight } = base
  const positions = new Map(basePositions)

  for (const [tableName, position] of positionOverrides) {
    if (positions.has(tableName)) positions.set(tableName, position)
  }

  let width = baseWidth
  let height = baseHeight
  for (const [name, position] of positions) {
    width = Math.max(width, position.x + ERD_NODE_WIDTH + CANVAS_MARGIN)
    height = Math.max(height, position.y + (heights.get(name) ?? MIN_NODE_HEIGHT) + CANVAS_MARGIN)
  }

  const fallbackPos: ErdPoint = { x: CANVAS_MARGIN, y: CANVAS_MARGIN }
  return {
    nodes: visibleTables.map((table) => ({
      table,
      position: positions.get(table.name) ?? fallbackPos,
    })),
    edges: createEdges(
      visibleTables,
      tableByName,
      positions,
      heights,
      selectedTableName,
      onlyConnectedToTable,
      previousEdges,
    ),
    width,
    height,
  }
}

/**
 * Places tables on a Manhattan row-band grid so unobstructed horizontal streets exist between every row.
 *
 * @param tables - Table list.
 * @param selectedTableName - Highlighted table name.
 * @param minWidth - Canvas minimum width.
 * @param positionOverrides - Drag overrides map.
 * @returns Fully computed ERD layout.
 */
export function createErdLayout(
  tables: TableDef[],
  selectedTableName: string | null,
  minWidth = 0,
  positionOverrides: ReadonlyMap<string, ErdPoint> = new Map(),
): ErdLayout {
  return buildErdLayoutFromBase(
    createBaseErdLayout(tables, minWidth),
    selectedTableName,
    positionOverrides,
  )
}
