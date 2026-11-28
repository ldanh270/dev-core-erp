import { useCallback, useMemo } from "react"

import type { DbSchemaData, TableDef } from "../database-reference.types"
import { formatTableSummary } from "../database-reference.utils"

export interface UseDatabaseTableSheetParams {
  table: TableDef | null
  schema: DbSchemaData
  onCopy: (text: string) => void
}

/**
 * Custom hook providing derived metadata, indexes, and summary metrics for table detail drawer.
 */
export function useDatabaseTableSheet({ table, schema, onCopy }: UseDatabaseTableSheetParams) {
  const module = useMemo(
    () => (table ? schema.modules.find((item) => item.id === table.module) : undefined),
    [table, schema.modules],
  )

  const enumDefinitions = useMemo(() => new Map(Object.entries(schema.enums)), [schema.enums])

  const indexes = useMemo(() => table?.indexes ?? [], [table?.indexes])

  const metricCounts = useMemo(() => {
    if (!table) return []
    return [
      { label: "Số cột", value: table.columns.length },
      { label: "Chỉ mục (Indexes)", value: indexes.length },
      { label: "Khóa ngoại đi", value: table.outgoingRelations.length },
      { label: "Bảng tham chiếu đến", value: table.incomingRelations.length },
    ]
  }, [table, indexes.length])

  const handleCopyMetadata = useCallback(() => {
    if (table) {
      onCopy(formatTableSummary(table))
    }
  }, [table, onCopy])

  return {
    module,
    enumDefinitions,
    indexes,
    metricCounts,
    handleCopyMetadata,
  }
}
