import type { TableDef } from "./database-reference.types"

export { orderLayers } from "./database-erd-ordering"
export { centerHubLayers } from "./database-erd-centering"

/**
 * Calculates maximum tables per column so the radial layout radiates balanced wings.
 *
 * @param totalTables - Total number of rendered tables.
 * @returns Maximum allowable tables in a single column.
 */
export function getMaxNodesPerColumn(totalTables: number): number {
  if (totalTables <= 8) return 3
  if (totalTables <= 16) return 4
  if (totalTables <= 32) return 6
  if (totalTables <= 60) return 8
  if (totalTables <= 100) return 10
  return 14
}

/**
 * Builds parent (referenced target) and child (dependent FK) adjacency maps among visible tables.
 *
 * @param tables - List of tables.
 * @param visibleNames - Set of visible table names.
 * @returns Dependency maps for parents and children.
 */
export function createDependencyMaps(tables: TableDef[], visibleNames: Set<string>) {
  const parents = new Map<string, string[]>()
  const children = new Map<string, string[]>()
  for (const table of tables) {
    parents.set(table.name, [])
    children.set(table.name, [])
  }
  for (const table of tables) {
    for (const relation of table.outgoingRelations) {
      if (!visibleNames.has(relation.targetTable) || relation.targetTable === table.name) continue
      const parentList = parents.get(table.name)
      if (parentList && !parentList.includes(relation.targetTable)) {
        parentList.push(relation.targetTable)
      }
      const childList = children.get(relation.targetTable)
      if (childList && !childList.includes(table.name)) {
        childList.push(table.name)
      }
    }
  }
  return { parents, children }
}

/**
 * Picks the next highest-degree table when breaking cyclic dependencies during rank assignment.
 */
function pickCycleBreaker(
  remaining: Set<string>,
  children: Map<string, string[]>,
): string | undefined {
  return [...remaining].sort((left, right) => {
    const lDeg = (children.get(left) ?? []).filter((n) => remaining.has(n)).length
    const rDeg = (children.get(right) ?? []).filter((n) => remaining.has(n)).length
    return rDeg - lDeg || left.localeCompare(right)
  })[0]
}

/**
 * Assigns topological longest-path ranks so referenced parent tables appear before dependent FK tables.
 *
 * @param tables - Table list.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 * @returns Map of table names to computed rank indices.
 */
export function assignRanks(
  tables: TableDef[],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
) {
  const remaining = new Set(tables.map((table) => table.name))
  const ranks = new Map<string, number>()

  while (remaining.size > 0) {
    const ready = [...remaining].filter((name) =>
      (parents.get(name) ?? []).every((parent) => !remaining.has(parent)),
    )
    const fallback = ready.length === 0 ? pickCycleBreaker(remaining, children) : undefined
    const batch = ready.length > 0 ? ready : fallback ? [fallback] : []

    for (const name of batch) {
      const parentRanks = (parents.get(name) ?? [])
        .map((parent) => ranks.get(parent))
        .filter((rank): rank is number => rank !== undefined)
      ranks.set(name, parentRanks.length > 0 ? Math.max(...parentRanks) + 1 : 0)
      remaining.delete(name)
    }
  }
  return ranks
}

/**
 * Groups table names into columns ordered by their topological rank, placing isolated tables at the end.
 *
 * @param tables - Table list.
 * @param ranks - Computed ranks map.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 * @returns Array of grouped table columns.
 */
export function groupByRank(
  tables: TableDef[],
  ranks: Map<string, number>,
  parents?: Map<string, string[]>,
  children?: Map<string, string[]>,
) {
  const isolated: string[] = []
  const connected: TableDef[] = []

  for (const table of tables) {
    const hasEdges =
      (parents?.get(table.name)?.length ?? 0) > 0 ||
      (children?.get(table.name)?.length ?? 0) > 0
    if (!hasEdges && tables.length > 4 && parents && children) {
      isolated.push(table.name)
    } else {
      connected.push(table)
    }
  }

  const targetList = connected.length > 0 ? connected : tables
  const layerCount = Math.max(0, ...targetList.map((t) => ranks.get(t.name) ?? 0)) + 1
  const layers = Array.from({ length: layerCount }, () => [] as string[])
  for (const table of targetList) {
    layers.at(ranks.get(table.name) ?? 0)?.push(table.name)
  }

  const nonEmpty = layers.filter((layer) => layer.length > 0)
  if (isolated.length > 0 && connected.length > 0) {
    nonEmpty.push(isolated)
  }
  return nonEmpty
}

/**
 * Splits overly tall columns into balanced sub-columns of at most maxNodesPerColumn tables.
 *
 * @param layers - Multi-column matrix.
 * @param maxNodesPerColumn - Threshold per column.
 * @returns Multi-column matrix with split layers.
 */
export function splitLargeLayers(
  layers: string[][],
  maxNodesPerColumn: number,
): string[][] {
  return layers.flatMap((layer) => {
    if (layer.length <= maxNodesPerColumn) return [layer]
    const chunks: string[][] = []
    const chunkCount = Math.ceil(layer.length / maxNodesPerColumn)
    const chunkSize = Math.ceil(layer.length / chunkCount)
    for (let i = 0; i < layer.length; i += chunkSize) {
      chunks.push(layer.slice(i, i + chunkSize))
    }
    return chunks
  })
}
