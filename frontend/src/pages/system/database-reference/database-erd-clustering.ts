import type { TableDef } from "./database-reference.types"
import { splitLargeLayers } from "./database-erd-ranking"

/**
 * Orders tables so each parent/sub-hub is immediately followed by its dependent children.
 *
 * @param names - Table names to order.
 * @param tableByName - Map of table metadata.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 * @returns Sorted table names list.
 */
export function sortClusterByParentAffinity(
  names: string[],
  tableByName: Map<string, TableDef>,
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
): string[] {
  return [...names].sort((a, b) => {
    const modA = tableByName.get(a)?.module ?? ""
    const modB = tableByName.get(b)?.module ?? ""
    if (modA !== modB) return modA.localeCompare(modB)
    const degA = (children.get(a)?.length ?? 0) * 3 + (parents.get(a)?.length ?? 0)
    const degB = (children.get(b)?.length ?? 0) * 3 + (parents.get(b)?.length ?? 0)
    return degB - degA || a.localeCompare(b)
  })
}

/**
 * Builds contiguous per-module Hub/Leaf column clusters when cross-module FKs are disabled.
 *
 * @param connected - Connected tables list.
 * @param tableByName - Map of table metadata.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 * @param maxNodesPerColumn - Height limit per column.
 * @param isolated - Standalone tables without foreign keys.
 * @returns Column clusters matrix.
 */
export function clusterDisconnectedModules(
  connected: TableDef[],
  tableByName: Map<string, TableDef>,
  parents: Map<string, string[]>,
  children: Map<string, string[]>,
  maxNodesPerColumn: number,
  isolated: string[],
): string[][] {
  const byModule = new Map<string, string[]>()
  for (const t of connected) {
    const list = byModule.get(t.module) ?? []
    list.push(t.name)
    byModule.set(t.module, list)
  }

  const sortedModules = [...byModule.entries()].sort((a, b) => b[1].length - a[1].length)
  const columns: string[][] = []
  let pendingHubs: string[] = []
  let pendingLeaves: string[] = []

  const flushPending = () => {
    if (pendingHubs.length > 0) columns.push(pendingHubs)
    if (pendingLeaves.length > 0) columns.push(pendingLeaves)
    pendingHubs = []
    pendingLeaves = []
  }

  for (const [, modNames] of sortedModules) {
    const ordered = sortClusterByParentAffinity(modNames, tableByName, parents, children)
    const hubs = ordered.filter((n) => (children.get(n)?.length ?? 0) > 0)
    const leaves = ordered.filter((n) => (children.get(n)?.length ?? 0) === 0)

    if (leaves.length > maxNodesPerColumn) {
      flushPending()
      const topHub = hubs.at(0)
      const leftLeaves = topHub
        ? leaves.filter((n) => (parents.get(n) ?? []).includes(topHub)).slice(0, maxNodesPerColumn)
        : leaves.slice(0, maxNodesPerColumn)
      const leftSet = new Set(leftLeaves)
      const mainHubs = hubs.slice(0, maxNodesPerColumn)
      const rightCol = [
        ...hubs.slice(maxNodesPerColumn),
        ...leaves.filter((n) => !leftSet.has(n)),
      ]
      columns.push(
        ...splitLargeLayers([leftLeaves], maxNodesPerColumn),
        ...splitLargeLayers([mainHubs], maxNodesPerColumn),
        ...splitLargeLayers([rightCol], maxNodesPerColumn),
      )
      continue
    }

    if (
      pendingHubs.length > 0 &&
      (pendingHubs.length + hubs.length > maxNodesPerColumn ||
        pendingLeaves.length + leaves.length > maxNodesPerColumn)
    ) {
      flushPending()
    }
    pendingHubs.push(...hubs)
    pendingLeaves.push(...leaves)
  }

  flushPending()
  columns.push(...splitLargeLayers([isolated], maxNodesPerColumn))
  return columns.filter((col) => col.length > 0)
}
