import type { ColumnDef, TableDef } from "./database-reference.types"

/**
 * 2D coordinate in the ERD graph space.
 */
export interface ErdPoint {
  x: number
  y: number
}

/**
 * Positioned ERD table node.
 */
export interface ErdNode {
  table: TableDef
  position: ErdPoint
}

/**
 * Orthogonal edge connecting a foreign-key column row to its target primary-key column row.
 */
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

/**
 * Complete computed ERD layout including nodes, orthogonal edges, and bounding dimensions.
 */
export interface ErdLayout {
  nodes: ErdNode[]
  edges: ErdEdge[]
  width: number
  height: number
}

/**
 * Precomputed topological grid layout cached independently of manual node drag overrides.
 */
export interface BaseErdLayout {
  visibleTables: TableDef[]
  tableByName: Map<string, TableDef>
  basePositions: Map<string, ErdPoint>
  heights: Map<string, number>
  baseWidth: number
  baseHeight: number
}

export const ERD_NODE_WIDTH = 280
export const MIN_NODE_HEIGHT = 84
export const DEFAULT_EDGE_ANCHOR_Y = 56
export const FIRST_FIELD_ANCHOR_Y = 56
export const FIELD_ANCHOR_STEP_Y = 24

const NODE_BASE_CHROME_HEIGHT = 52
const NODE_LINKED_ROW_HEIGHT = 24

/**
 * Returns all primary/foreign key and referenced target columns without truncation.
 *
 * @param table - Table definition to extract key columns from.
 * @returns Array of columns with relationship significance.
 */
export function getLinkedColumns(table: TableDef): ColumnDef[] {
  const incomingTargets = new Set(table.incomingRelations.map((rel) => rel.targetColumn))
  return table.columns.filter(
    (column) => column.isPk || column.isFk || incomingTargets.has(column.name),
  )
}

/**
 * Identifies core/parent tables (referenced by other tables or standalone roots) vs FK child tables.
 *
 * @param table - Table definition to check.
 * @returns True if table is primary or standalone root.
 */
export function isPrimaryErdTable(table: TableDef): boolean {
  return table.incomingRelations.length > 0 || !table.columns.some((col) => col.isFk)
}

/**
 * Computes exact node height from the full count of displayed linked columns.
 *
 * @param table - Table definition to calculate node card height for.
 * @returns Rendered height in pixels.
 */
export function getNodeHeight(table: TableDef): number {
  const linkedCount = Math.max(1, getLinkedColumns(table).length)
  return Math.max(MIN_NODE_HEIGHT, NODE_BASE_CHROME_HEIGHT + linkedCount * NODE_LINKED_ROW_HEIGHT)
}
