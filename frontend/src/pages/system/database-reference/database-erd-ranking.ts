import type { TableDef } from "./database-reference.types"

const ORDERING_PASSES = 4
const MAX_NODES_PER_COLUMN = 5

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
      parents.get(table.name)?.push(relation.targetTable)
      children.get(relation.targetTable)?.push(table.name)
    }
  }
  return { parents, children }
}

// Assign topological longest-path ranks so referenced parent tables appear to the left of FK tables.
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
    const batch =
      ready.length > 0
        ? ready
        : [
            [...remaining].sort((left, right) => {
              const lDeg = (children.get(left) ?? []).filter((n) => remaining.has(n)).length
              const rDeg = (children.get(right) ?? []).filter((n) => remaining.has(n)).length
              return rDeg - lDeg || left.localeCompare(right)
            })[0],
          ]

    for (const name of batch) {
      if (!name) continue
      const parentRanks = (parents.get(name) ?? [])
        .map((parent) => ranks.get(parent))
        .filter((rank): rank is number => rank !== undefined)
      ranks.set(name, parentRanks.length > 0 ? Math.max(...parentRanks) + 1 : 0)
      remaining.delete(name)
    }
  }
  return ranks
}

// Group table names into columns ordered by their topological rank.
export function groupByRank(tables: TableDef[], ranks: Map<string, number>) {
  const layerCount = Math.max(0, ...ranks.values()) + 1
  const layers = Array.from({ length: layerCount }, () => [] as string[])
  for (const table of tables) {
    layers.at(ranks.get(table.name) ?? 0)?.push(table.name)
  }
  return layers.filter((layer) => layer.length > 0)
}

// Split overly tall columns into balanced sub-columns of at most MAX_NODES_PER_COLUMN tables.
export function splitLargeLayers(layers: string[][]): string[][] {
  return layers.flatMap((layer) => {
    if (layer.length <= MAX_NODES_PER_COLUMN) return [layer]
    const chunks: string[][] = []
    const chunkCount = Math.ceil(layer.length / MAX_NODES_PER_COLUMN)
    const chunkSize = Math.ceil(layer.length / chunkCount)
    for (let i = 0; i < layer.length; i += chunkSize) {
      chunks.push(layer.slice(i, i + chunkSize))
    }
    return chunks
  })
}

// Position primary hub tables in the center column and balance connected satellite tables on both sides.
export function centerHubLayers(
  layers: string[][],
  tables: TableDef[],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
): string[][] {
  if (tables.length < 5 || layers.length < 2) return layers

  // Find the primary hub table with the highest degree of connections.
  let primaryHub: string | null = null
  let maxDegree = 0
  for (const table of tables) {
    const deg = (parents.get(table.name)?.length ?? 0) + (children.get(table.name)?.length ?? 0)
    if (deg > maxDegree) {
      maxDegree = deg
      primaryHub = table.name
    }
  }

  if (!primaryHub || maxDegree < 4) return layers

  const hubLayerIdx = layers.findIndex((col) => col.includes(primaryHub))
  if (hubLayerIdx === -1) return layers

  // Direct dependent children of the hub
  const hubKids = new Set(children.get(primaryHub) ?? [])
  if (hubKids.size < 4) return layers

  // Balance children so half stay to the right, and half are placed into a column on the left of the hub.
  const kidsList = Array.from(hubKids)
  const leftCount = Math.floor(kidsList.length / 2)
  const leftKids = new Set(kidsList.slice(0, leftCount))

  const preHub = layers
    .slice(0, hubLayerIdx)
    .map((col) => col.filter((name) => !leftKids.has(name)))
    .filter((col) => col.length > 0)

  const hubCol = layers[hubLayerIdx].filter((name) => !leftKids.has(name))

  const postHub = layers
    .slice(hubLayerIdx + 1)
    .map((col) => col.filter((name) => !leftKids.has(name)))
    .filter((col) => col.length > 0)

  const leftWingChunks: string[][] = []
  const leftKidsArr = Array.from(leftKids)
  for (let i = 0; i < leftKidsArr.length; i += MAX_NODES_PER_COLUMN) {
    leftWingChunks.push(leftKidsArr.slice(i, i + MAX_NODES_PER_COLUMN))
  }

  return [...preHub, ...leftWingChunks, hubCol, ...postHub].filter((col) => col.length > 0)
}

// Run forward and backward barycenter sweeps to minimize edge crossings between adjacent columns.
export function orderLayers(
  layers: string[][],
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
) {
  for (let pass = 0; pass < ORDERING_PASSES; pass += 1) {
    for (let rank = 1; rank < layers.length; rank += 1) {
      const current = layers.at(rank)
      const prev = layers.at(rank - 1)
      if (current && prev) sortByNeighborPosition(current, prev, parents)
    }
    for (let rank = layers.length - 2; rank >= 0; rank -= 1) {
      const current = layers.at(rank)
      const next = layers.at(rank + 1)
      if (current && next) sortByNeighborPosition(current, next, children)
    }
  }
}

// Sort a column's tables by the average vertical index of their connected neighbors.
function sortByNeighborPosition(
  layer: string[],
  neighborLayer: string[],
  neighborsByName: Map<string, string[]>,
) {
  const neighborPos = new Map(neighborLayer.map((name, index) => [name, index]))
  const originalPos = new Map(layer.map((name, index) => [name, index]))
  const barycenters = new Map<string, number>()

  for (const name of layer) {
    const pos = (neighborsByName.get(name) ?? [])
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
