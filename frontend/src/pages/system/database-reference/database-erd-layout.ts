import type { ColumnDef, TableDef } from "./database-reference.types"
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

// 2D coordinate in the ERD graph space.
export interface ErdPoint {
  x: number
  y: number
}

// Positioned ERD table node.
export interface ErdNode {
  table: TableDef
  position: ErdPoint
}

// Orthogonal edge connecting a foreign-key column row to its target primary-key column row.
export interface ErdEdge {
  id: string
  sourceTable: string
  targetTable: string
  from: ErdPoint
  to: ErdPoint
  path: string
  highlighted: boolean
  dimmed: boolean
  crossModule: boolean
}

// Complete computed ERD layout including nodes, orthogonal edges, and bounding dimensions.
export interface ErdLayout {
  nodes: ErdNode[]
  edges: ErdEdge[]
  width: number
  height: number
}

// Precomputed topological grid layout cached independently of manual node drag overrides.
export interface BaseErdLayout {
  visibleTables: TableDef[]
  tableByName: Map<string, TableDef>
  basePositions: Map<string, ErdPoint>
  heights: Map<string, number>
  baseWidth: number
  baseHeight: number
}

// Layout geometry constants synchronized with DatabaseErdNode DOM row heights.
export const ERD_NODE_WIDTH = 280
export const MIN_NODE_HEIGHT = 84
export const DEFAULT_EDGE_ANCHOR_Y = 56
export const FIRST_FIELD_ANCHOR_Y = 56
export const FIELD_ANCHOR_STEP_Y = 24

const NODE_BASE_CHROME_HEIGHT = 52
const NODE_LINKED_ROW_HEIGHT = 24
const MIN_NODE_GAP_X = 240
const DEFAULT_NODE_GAP_Y = 124
const COMPACT_NODE_GAP_Y = 132
const CANVAS_MARGIN = 64

// Map a node's local index in a column of length `layerLen` onto a distributed row index in `[0, maxRows - 1]`.
function getDistributedRowIndex(localIdx: number, layerLen: number, maxRows: number): number {
  if (layerLen <= 1) return Math.floor(maxRows / 2)
  if (layerLen >= maxRows) return localIdx
  return Math.floor(((localIdx + 0.5) * maxRows) / layerLen)
}

// Return all primary/foreign key and referenced target columns without truncation.
export function getLinkedColumns(table: TableDef): ColumnDef[] {
  const incomingTargets = new Set(table.incomingRelations.map((rel) => rel.targetColumn))
  return table.columns.filter(
    (column) => column.isPk || column.isFk || incomingTargets.has(column.name),
  )
}

// Identify core/parent tables (referenced by other tables or standalone roots) vs FK child tables.
export function isPrimaryErdTable(table: TableDef): boolean {
  return table.incomingRelations.length > 0 || table.outgoingRelations.length === 0
}

// Compute exact node height from the full count of displayed linked columns.
export function getNodeHeight(table: TableDef): number {
  const linkedCount = Math.max(1, getLinkedColumns(table).length)
  return Math.max(MIN_NODE_HEIGHT, NODE_BASE_CHROME_HEIGHT + linkedCount * NODE_LINKED_ROW_HEIGHT)
}

// Compute topological ranking, radial wing clustering, and aligned row-band coordinates once per table set.
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

  // Compute aligned row-band Y coordinates so every gap between rows forms a clear horizontal street across all columns.
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

// Merge manual drag overrides onto a cached base layout and route orthogonal edges without re-ranking tables.
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

// Place tables on a Manhattan row-band grid so unobstructed horizontal streets exist between every row.
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
