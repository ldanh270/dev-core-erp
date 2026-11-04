import { useMemo } from "react"
import type { IncomingRelation, OutgoingRelation } from "../database-reference.types"

export interface UseTableSheetColumnsParams {
  incomingRelations: IncomingRelation[]
  outgoingRelations: OutgoingRelation[]
}

/**
 * Custom hook indexing incoming and outgoing relations by column name for quick row lookup.
 */
export function useTableSheetColumns({
  incomingRelations,
  outgoingRelations,
}: UseTableSheetColumnsParams) {
  // Map incoming relations by target column name for fast lookup per table row.
  const incomingByTargetCol = useMemo(() => {
    const map = new Map<string, IncomingRelation[]>()
    for (const rel of incomingRelations) {
      const list = map.get(rel.targetColumn) ?? []
      list.push(rel)
      map.set(rel.targetColumn, list)
    }
    return map
  }, [incomingRelations])

  // Map outgoing relations by source column name for fast lookup per table row.
  const outgoingBySourceCol = useMemo(() => {
    const map = new Map<string, OutgoingRelation[]>()
    for (const rel of outgoingRelations) {
      const list = map.get(rel.sourceColumn) ?? []
      list.push(rel)
      map.set(rel.sourceColumn, list)
    }
    return map
  }, [outgoingRelations])

  return {
    incomingByTargetCol,
    outgoingBySourceCol,
  }
}
