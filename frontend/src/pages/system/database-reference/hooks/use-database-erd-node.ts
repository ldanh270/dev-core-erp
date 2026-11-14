import { useMemo } from "react"

import { getLinkedColumns, isPrimaryErdTable } from "../database-erd-layout"
import type { ModuleDef, TableDef } from "../database-reference.types"
import { getModuleTheme } from "../database-reference.utils"

export interface UseDatabaseErdNodeParams {
  table: TableDef
  modules: ModuleDef[]
  selectedModule: string
  selectedTableName: string | null
}

/**
 * Custom hook computing theme styling, linked columns, and selection/cross-module roles for an ERD node card.
 */
export function useDatabaseErdNode({
  table,
  modules,
  selectedModule,
  selectedTableName,
}: UseDatabaseErdNodeParams) {
  const theme = useMemo(() => getModuleTheme(table.module), [table.module])
  const linkedColumns = useMemo(() => getLinkedColumns(table), [table])
  const isSelected = table.name === selectedTableName
  const isExternal = selectedModule !== "ALL" && table.module !== selectedModule
  const isPrimary = !isExternal && isPrimaryErdTable(table)

  const externalModuleName = useMemo(() => {
    if (!isExternal) return null
    return modules.find((module) => module.id === table.module)?.name ?? table.module
  }, [isExternal, modules, table.module])

  return {
    theme,
    linkedColumns,
    isSelected,
    isExternal,
    isPrimary,
    externalModuleName,
  }
}
