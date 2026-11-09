import type { TableDef } from "./database-reference.types"
import {
  clusterDisconnectedModules,
  sortClusterByParentAffinity,
} from "./database-erd-clustering"
import { splitLargeLayers } from "./database-erd-ranking"

/**
 * Radiates tables outward from central hub: Outer-Left -> Inner-Left -> Center -> Inner-Right -> Outer-Right.
 *
 * @param layers - Multi-column matrix of ranked tables.
 * @param tables - Complete table list.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 * @param maxNodesPerColumn - Height limit per column.
 * @returns Radially centered table columns matrix.
 */
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

  const isolated = tables
    .filter((t) => (degrees.get(t.name) ?? 0) === 0)
    .sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name))
    .map((t) => t.name)
  const connected = tables.filter((t) => (degrees.get(t.name) ?? 0) > 0)
  if (connected.length < 6) return layers

  const hasCrossModuleEdges = connected.some((t) =>
    (parents.get(t.name) ?? []).some((p) => tableByName.get(p)?.module !== t.module),
  )
  const distinctModules = new Set(connected.map((t) => t.module))
  if (!hasCrossModuleEdges && distinctModules.size > 1) {
    return clusterDisconnectedModules(
      connected,
      tableByName,
      parents,
      children,
      maxNodesPerColumn,
      isolated,
    )
  }

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

  const centerCol = [...centerSet]
  const leftInnerCol = [...leftInnerSet]
  const rightInnerCol = [...rightInnerSet]

  return [
    ...splitLargeLayers([leftOuter], maxNodesPerColumn),
    ...splitLargeLayers([leftInnerCol], maxNodesPerColumn),
    ...splitLargeLayers([centerCol], maxNodesPerColumn),
    ...splitLargeLayers([rightInnerCol], maxNodesPerColumn),
    ...splitLargeLayers([rightOuter], maxNodesPerColumn),
    ...splitLargeLayers([isolated], maxNodesPerColumn),
  ].filter((col) => col.length > 0)
}
