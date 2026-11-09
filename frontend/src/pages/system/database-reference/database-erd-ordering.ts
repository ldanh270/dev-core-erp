const ORDERING_PASSES = 10

/**
 * Sorts a column's tables by the average vertical index of connected neighbors in adjacent column.
 *
 * @param layer - Array of table names in current layer.
 * @param neighborLayer - Array of table names in adjacent layer.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 */
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

/**
 * Runs forward and backward barycenter sweeps to align child tables on the same row as parent sub-hubs.
 *
 * @param layers - Multi-column table layout matrix.
 * @param parents - Dependency map of table parents.
 * @param children - Dependency map of table children.
 */
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
