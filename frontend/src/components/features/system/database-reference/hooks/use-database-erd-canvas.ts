import { useCallback, useEffect, useRef, useState } from "react"

interface UseDatabaseErdCanvasParams {
  isPanning: boolean
  selectedTableName: string | null
}

/**
 * Custom hook managing ERD canvas node hover spotlight state and suppressing hover re-renders during active drag/pan.
 *
 * @param params - Canvas panning state and selected table name.
 * @returns Active focus table name and hover handler.
 */
export function useDatabaseErdCanvas({ isPanning, selectedTableName }: UseDatabaseErdCanvasParams) {
  const [hoveredTableName, setHoveredTableName] = useState<string | null>(null)
  const isPanningRef = useRef(isPanning)

  useEffect(() => {
    isPanningRef.current = isPanning
  }, [isPanning])

  /**
   * Ignores hover events during active canvas panning or node dragging to avoid mid-drag spotlight re-renders.
   */
  const handleHoverTable = useCallback((tableName: string | null) => {
    if (isPanningRef.current) return
    setHoveredTableName(tableName)
  }, [])

  const activeFocusTable = hoveredTableName ?? selectedTableName

  return {
    activeFocusTable,
    handleHoverTable,
  }
}
