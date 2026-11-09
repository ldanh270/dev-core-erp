import type { TableDef } from "./database-reference.types"

const ORDERING_PASSES = 10

// Calculate maximum tables per column so the radial layout radiates balanced wings around the center.
export function getMaxNodesPerColumn(totalTables: number): number {
  if (totalTables <= 8) return 3
  if (totalTables <= 16) return 4
  if (totalTables <= 32) return 6
  if (totalTables <= 60) return 8
  if (totalTables <= 100) return 10
  return 14
}

// Build parent (referenced target) and child (dependent FK) adjacency maps among visible tables.
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

// Pick the next highest-degree table when breaking cyclic dependencies during rank assignment.
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

// Assign topological longest-path ranks so referenced parent tables appear before dependent FK tables.
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

// Group table names into columns ordered by their topological rank, placing isolated tables at the end.
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

// Split overly tall columns into balanced sub-columns of at most maxNodesPerColumn tables.
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

// Order a list of tables so each parent/sub-hub is immediately followed by its dependent children.
function sortClusterByParentAffinity(
  names: string[],
  tableByName: Map<string, TableDef>,
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
): string[] {
  const byModuleAndDegree = [...names].sort((a, b) => {
    const modA = tableByName.get(a)?.module ?? ""
    const modB = tableByName.get(b)?.module ?? ""
    if (modA !== modB) return modA.localeCompare(modB)
    const degA = (children.get(a)?.length ?? 0) * 3 + (parents.get(a)?.length ?? 0)
    const degB = (children.get(b)?.length ?? 0) * 3 + (parents.get(b)?.length ?? 0)
    return degB - degA || a.localeCompare(b)
  })
  return byModuleAndDegree
}

// Radiate tables outward from the central core hub: Outer-Left -> Inner-Left -> Center -> Inner-Right -> Outer-Right.
export function centerHubLayers(
  layers: string[][],
  tables: TableDef[],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
  maxNodesPerColumn: number,
): string[][] {
  if (tables.length < 6 || layers.length < 2) return layers

  const tableByName = new Map(tables.map((t) => [t.name, t]))
  const degrees = new Map<string, number>()
  for (const t of tables) {
    degrees.set(t.name, (parents.get(t.name)?.length ?? 0) + (children.get(t.name)?.length ?? 0))
  }

  // Separate isolated tables (0 connections) so they stay cleanly on the far right edge.
  const isolated = tables.filter((t) => (degrees.get(t.name) ?? 0) === 0).map((t) => t.name)
  const connected = tables.filter((t) => (degrees.get(t.name) ?? 0) > 0)
  if (connected.length < 6) return layers

  // Pick central core hub(s): highest degree table + top root tables that it directly depends on.
  const sortedByKids = [...connected].sort(
    (a, b) => (children.get(b.name)?.length ?? 0) - (children.get(a.name)?.length ?? 0),
  )
  const primaryHub = sortedByKids.at(0)?.name
  if (!primaryHub || (children.get(primaryHub)?.length ?? 0) < 3) return layers

  const centerSet = new Set<string>([primaryHub])
  for (const rootParent of parents.get(primaryHub) ?? []) {
    if (centerSet.size < Math.min(5, maxNodesPerColumn)) centerSet.add(rootParent)
  }
  for (const cand of sortedByKids.slice(1)) {
    if (centerSet.size >= Math.min(6, Math.ceil(maxNodesPerColumn * 0.6))) break
    if ((children.get(cand.name)?.length ?? 0) >= 5) centerSet.add(cand.name)
  }

  // Classify remaining connected tables into Tier 1 (Sub-Hubs / direct hub neighbors) and Tier 2 (Outer leaf/detail tables).
  const remaining = connected.map((t) => t.name).filter((name) => !centerSet.has(name))
  const tier1SubHubs: string[] = []
  const tier2Leaves: string[] = []

  for (const name of remaining) {
    const hasOwnChildren = (children.get(name) ?? []).some((c) => !centerSet.has(c))
    const connectsToCenter =
      (parents.get(name) ?? []).some((p) => centerSet.has(p)) ||
      (children.get(name) ?? []).some((c) => centerSet.has(c))

    if (hasOwnChildren || (connectsToCenter && (parents.get(name)?.length ?? 0) <= 2)) {
      tier1SubHubs.push(name)
    } else {
      tier2Leaves.push(name)
    }
  }

  const orderedTier1 = sortClusterByParentAffinity(tier1SubHubs, tableByName, parents, children)
  const moduleCounts = new Map<string, number>()
  for (const name of remaining) {
    const mod = tableByName.get(name)?.module ?? "OTHER"
    moduleCounts.set(mod, (moduleCounts.get(mod) ?? 0) + 1)
  }

  const leftInnerSet = new Set<string>()
  const rightInnerSet = new Set<string>()

  if (moduleCounts.size > 1) {
    // Assign whole modules to Left vs Right wings so intra-module tables never cross the center column.
    const sortedMods = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1])
    const leftMods = new Set<string>()
    let leftTotal = 0
    let rightTotal = 0
    for (const [mod, count] of sortedMods) {
      if (leftTotal <= rightTotal) {
        leftMods.add(mod)
        leftTotal += count
      } else {
        rightTotal += count
      }
    }
    for (const name of orderedTier1) {
      const mod = tableByName.get(name)?.module ?? "OTHER"
      if (leftMods.has(mod)) {
        leftInnerSet.add(name)
      } else {
        rightInnerSet.add(name)
      }
    }
  } else {
    const mid1 = Math.ceil(orderedTier1.length / 2)
    for (const name of orderedTier1.slice(0, mid1)) leftInnerSet.add(name)
    for (const name of orderedTier1.slice(mid1)) rightInnerSet.add(name)
  }

  // Place each Tier 2 leaf table on the same wing (Left or Right) as its parent Sub-Hub or module!
  const leftOuter: string[] = []
  const rightOuter: string[] = []
  for (const leaf of sortClusterByParentAffinity(tier2Leaves, tableByName, parents, children)) {
    const leafParents = parents.get(leaf) ?? []
    const leftScore = leafParents.filter((p) => leftInnerSet.has(p)).length
    const rightScore = leafParents.filter((p) => rightInnerSet.has(p)).length
    const leafMod = tableByName.get(leaf)?.module ?? "OTHER"
    const modInLeft = [...leftInnerSet].some((n) => tableByName.get(n)?.module === leafMod)
    const modInRight = [...rightInnerSet].some((n) => tableByName.get(n)?.module === leafMod)

    if (leftScore > rightScore || (leftScore === rightScore && modInLeft && !modInRight)) {
      leftOuter.push(leaf)
    } else if (rightScore > leftScore || (leftScore === rightScore && modInRight && !modInLeft)) {
      rightOuter.push(leaf)
    } else if (leftOuter.length <= rightOuter.length) {
      leftOuter.push(leaf)
    } else {
      rightOuter.push(leaf)
    }
  }

  const leftOuterCols = splitLargeLayers([leftOuter], maxNodesPerColumn)
  const leftInnerCols = splitLargeLayers([Array.from(leftInnerSet)], maxNodesPerColumn)
  const centerCols = splitLargeLayers([Array.from(centerSet)], maxNodesPerColumn)
  const rightInnerCols = splitLargeLayers([Array.from(rightInnerSet)], maxNodesPerColumn)
  const rightOuterCols = splitLargeLayers([rightOuter], maxNodesPerColumn)
  const isolatedCols = splitLargeLayers([isolated], maxNodesPerColumn)

  return [
    ...leftOuterCols,
    ...leftInnerCols,
    ...centerCols,
    ...rightInnerCols,
    ...rightOuterCols,
    ...isolatedCols,
  ].filter((col) => col.length > 0)
}

// Run forward and backward barycenter sweeps to align child tables on the exact same row as their parent sub-hub.
export function orderLayers(
  layers: string[][],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
) {
  for (let pass = 0; pass < ORDERING_PASSES; pass += 1) {
    for (let rank = 1; rank < layers.length; rank += 1) {
      const current = layers.at(rank)
      const prev = layers.at(rank - 1)
      if (current && prev) sortByNeighborPosition(current, prev, parents, children)
    }
    for (let rank = layers.length - 2; rank >= 0; rank -= 1) {
      const current = layers.at(rank)
      const next = layers.at(rank + 1)
      if (current && next) sortByNeighborPosition(current, next, parents, children)
    }
  }
}

// Sort a column's tables by the average vertical index of their connected neighbors in the adjacent column.
function sortByNeighborPosition(
  layer: string[],
  neighborLayer: string[],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
) {
  const neighborPos = new Map(neighborLayer.map((name, index) => [name, index]))
  const originalPos = new Map(layer.map((name, index) => [name, index]))
  const barycenters = new Map<string, number>()

  for (const name of layer) {
    const connected = [...(parents.get(name) ?? []), ...(children.get(name) ?? [])]
    const pos = connected
      .map((neighbor) => neighborPos.get(neighbor))
      .filter((p): p is number => p !== undefined)
    if (pos.length > 0) {
      barycenters.set(name, pos.reduce((sum, p) => sum + p, 0) / pos.length)
    }
  }
  layer.sort(
    (left, right) =>
      (barycenters.get(left) ?? originalPos.get(left) ?? 0) -
      (barycenters.get(right) ?? originalPos.get(right) ?? 0),
  )
}
