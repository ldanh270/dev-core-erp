import type { ColumnDef, TableDef } from "./database-reference.types"
import { avoidLineCollisions } from "./database-erd-collision"
import { createEdges } from "./database-erd-edges"
import {
  assignRanks,
  centerHubLayers,
  createDependencyMaps,
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

// Straight line edge connecting a foreign-key column to its target table.
export interface ErdEdge {
  id: string
  from: ErdPoint
  to: ErdPoint
  highlighted: boolean
  crossModule: boolean
}

// Complete computed ERD layout including nodes, straight edges, and bounding dimensions.
export interface ErdLayout {
  nodes: ErdNode[]
  edges: ErdEdge[]
  width: number
  height: number
}

// Layout geometry constants for node sizing, spacing, and collision avoidance.
export const ERD_NODE_WIDTH = 280
export const MIN_NODE_HEIGHT = 120
export const DEFAULT_EDGE_ANCHOR_Y = 40
export const FIRST_FIELD_ANCHOR_Y = 56
export const FIELD_ANCHOR_STEP_Y = 24

const NODE_BASE_CHROME_HEIGHT = 64
const NODE_LINKED_ROW_HEIGHT = 26
const MIN_NODE_GAP_X = 180
const NODE_GAP_Y = 84
const CANVAS_MARGIN = 64
const MAX_ALL_MODULE_NODES = 24
const ALTERNATING_COLUMN_STAGGER_Y = 36

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

// Estimate node height from the full count of displayed linked columns so cards never overlap vertically.
export function getNodeHeight(table: TableDef): number {
  const linkedCount = Math.max(1, getLinkedColumns(table).length)
  return Math.max(MIN_NODE_HEIGHT, NODE_BASE_CHROME_HEIGHT + linkedCount * NODE_LINKED_ROW_HEIGHT)
}

// Place referenced models before dependent models, center dominant hub tables, and avoid line collisions.
export function createErdLayout(
  tables: TableDef[],
  selectedTableName: string | null,
  limitNodes: boolean,
  minWidth = 0,
  positionOverrides: ReadonlyMap<string, ErdPoint> = new Map(),
): ErdLayout {
  const visibleTables = limitNodes ? tables.slice(0, MAX_ALL_MODULE_NODES) : tables
  const visibleNames = new Set(visibleTables.map((table) => table.name))
  const tableByName = new Map(visibleTables.map((table) => [table.name, table]))
  const dependencies = createDependencyMaps(visibleTables, visibleNames)
  const ranks = assignRanks(visibleTables, dependencies.parents, dependencies.children)
  const rawLayers = groupByRank(visibleTables, ranks)

  orderLayers(rawLayers, dependencies.parents, dependencies.children)
  const splitLayers = splitLargeLayers(rawLayers)
  const layers = centerHubLayers(splitLayers, visibleTables, dependencies.parents, dependencies.children)

  const widestLayer = layers.length
  const horizontalGap =
    widestLayer > 1
      ? Math.max(
          MIN_NODE_GAP_X,
          (minWidth - CANVAS_MARGIN * 2 - widestLayer * ERD_NODE_WIDTH) / (widestLayer - 1),
        )
      : MIN_NODE_GAP_X

  const heights = new Map(visibleTables.map((t) => [t.name, getNodeHeight(t)]))
  const layerHeights = layers.map((layer) =>
    layer.reduce(
      (sum, name, idx) => sum + (heights.get(name) ?? MIN_NODE_HEIGHT) + (idx > 0 ? NODE_GAP_Y : 0),
      0,
    ),
  )
  const maxLayerHeight = Math.max(0, ...layerHeights)
  const positions = new Map<string, ErdPoint>()

  // Position each column vertically centered with alternating stagger to prevent horizontal line overlap.
  layers.forEach((layer, colIdx) => {
    const layerHeight = layerHeights.at(colIdx) ?? 0
    const staggerOffset =
      colIdx % 2 === 1 && layer.length > 1 ? ALTERNATING_COLUMN_STAGGER_Y : 0
    let currentY = CANVAS_MARGIN + (maxLayerHeight - layerHeight) / 2 + staggerOffset
    const x = CANVAS_MARGIN + colIdx * (ERD_NODE_WIDTH + horizontalGap)

    for (const tableName of layer) {
      positions.set(tableName, { x, y: currentY })
      currentY += (heights.get(tableName) ?? MIN_NODE_HEIGHT) + NODE_GAP_Y
    }
  })

  // Shift intermediate nodes down if a straight relationship line passes through their bounding box.
  avoidLineCollisions(layers, visibleTables, positions, heights)

  // Apply user-dragged node positions without clamping so nodes can move across the entire frame.
  for (const [tableName, position] of positionOverrides) {
    if (positions.has(tableName)) positions.set(tableName, position)
  }

  const width = Math.max(
    CANVAS_MARGIN * 2 + widestLayer * ERD_NODE_WIDTH + Math.max(0, widestLayer - 1) * horizontalGap,
    ...[...positions.values()].map((position) => position.x + ERD_NODE_WIDTH + CANVAS_MARGIN),
  )
  const height = Math.max(
    CANVAS_MARGIN * 2 + maxLayerHeight,
    ...[...positions.entries()].map(
      ([name, position]) => position.y + (heights.get(name) ?? MIN_NODE_HEIGHT) + CANVAS_MARGIN,
    ),
  )

  return {
    nodes: visibleTables.map((table) => ({
      table,
      position: positions.get(table.name) ?? { x: CANVAS_MARGIN, y: CANVAS_MARGIN },
    })),
    edges: createEdges(visibleTables, tableByName, positions, heights, selectedTableName),
    width,
    height,
  }
}
