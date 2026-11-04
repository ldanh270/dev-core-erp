import { useMemo } from "react"
import type { TableDef } from "../database-reference.types"

export interface UseDatabaseTableListParams {
  tables: TableDef[]
  allTables: TableDef[]
  currentPage: number
  pageSize: number
}

/**
 * Custom hook extracting pagination and module lookup logic for the database table catalog.
 */
export function useDatabaseTableList({
  tables,
  allTables,
  currentPage,
  pageSize,
}: UseDatabaseTableListParams) {
  // Map table names to their respective modules for fast lookup in relation badges.
  const moduleByTableName = useMemo(
    () => new Map(allTables.map((item) => [item.name, item.module])),
    [allTables],
  )

  // Compute pagination slices for the current table view.
  const totalPages = Math.ceil(tables.length / pageSize)
  const visibleTables = useMemo(
    () => tables.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [tables, currentPage, pageSize],
  )

  return {
    moduleByTableName,
    totalPages,
    visibleTables,
  }
}
