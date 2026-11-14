import { useCallback, useMemo } from "react"

import { Code2, Layers, Network, Table2 } from "lucide-react"

export interface UseDatabaseReferenceHeaderParams {
  totalTables: number
  totalColumns: number
  totalRelations: number
  totalEnums: number
  onTabChange: (tab: "tables" | "diagram") => void
}

/**
 * Custom hook providing metric counters and tab change handling for DatabaseReferenceHeader.
 */
export function useDatabaseReferenceHeader({
  totalTables,
  totalColumns,
  totalRelations,
  totalEnums,
  onTabChange,
}: UseDatabaseReferenceHeaderParams) {
  const metricItems = useMemo(
    () => [
      { icon: Table2, label: "Bảng", value: totalTables },
      { icon: Layers, label: "Cột", value: totalColumns },
      { icon: Network, label: "Quan hệ", value: totalRelations },
      { icon: Code2, label: "Enums", value: totalEnums },
    ],
    [totalTables, totalColumns, totalRelations, totalEnums],
  )

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "tables" || value === "diagram") {
        onTabChange(value)
      }
    },
    [onTabChange],
  )

  return {
    metricItems,
    handleTabChange,
  }
}
