import { useMemo, useState } from "react"
import type { TableDef } from "../database-reference.types"
import {
  MAX_SCALE,
  MIN_SCALE,
  useDatabaseErdViewport,
  ZOOM_STEP,
} from "./use-database-erd-viewport"

export type { ViewportSize } from "./use-database-erd-viewport"

export interface UseDatabaseErdTabParams {
  tables: TableDef[]
  allTables: TableDef[]
  selectedModule: string
  selectedTableName: string | null
}

/**
 * Custom hook orchestrating the interactive ERD graph tables calculation, cross-module filtering, and viewport controls.
 *
 * @param params - Tab tables, full schema tables, selected module, and highlighted table.
 * @returns State and event handlers for canvas controls and viewport rendering.
 */
export function useDatabaseErdTab({
  tables,
  allTables,
  selectedModule,
  selectedTableName,
}: UseDatabaseErdTabParams) {
  const [showCrossModuleRelations, setShowCrossModuleRelations] = useState(true)
  const [fullscreenTarget, setFullscreenTarget] = useState<HTMLElement | null>(null)

  const moduleTableNames = useMemo(() => new Set(tables.map((table) => table.name)), [tables])
  const tableByName = useMemo(
    () => new Map(allTables.map((table) => [table.name, table])),
    [allTables],
  )

  /**
   * Include external cross-module tables when single module is selected, or filter out cross-module FKs in ALL mode when disabled.
   */
  const graphTables = useMemo(() => {
    if (selectedModule === "ALL") {
      if (showCrossModuleRelations) return tables
      return tables.map((table) => ({
        ...table,
        outgoingRelations: table.outgoingRelations.filter(
          (relation) => tableByName.get(relation.targetTable)?.module === table.module,
        ),
        incomingRelations: table.incomingRelations.filter(
          (relation) => tableByName.get(relation.sourceTable)?.module === table.module,
        ),
      }))
    }
    if (!showCrossModuleRelations) return tables

    const externalNames = new Set<string>()
    for (const table of tables) {
      for (const relation of table.outgoingRelations) {
        const target = tableByName.get(relation.targetTable)
        if (target && target.module !== selectedModule) externalNames.add(target.name)
      }
      for (const relation of table.incomingRelations) {
        const source = tableByName.get(relation.sourceTable)
        if (source && source.module !== selectedModule) externalNames.add(source.name)
      }
    }

    const externalTables = Array.from(externalNames)
      .map((name) => tableByName.get(name))
      .filter((table): table is TableDef => table !== undefined)
      .map((table) => ({
        ...table,
        outgoingRelations: table.outgoingRelations.filter((rel) =>
          moduleTableNames.has(rel.targetTable),
        ),
        incomingRelations: table.incomingRelations.filter((rel) =>
          moduleTableNames.has(rel.sourceTable),
        ),
      }))

    return [...tables, ...externalTables]
  }, [moduleTableNames, selectedModule, showCrossModuleRelations, tableByName, tables])

  const viewport = useDatabaseErdViewport(graphTables, selectedTableName, fullscreenTarget)

  const handleZoomIn = () => {
    viewport.zoomBy(ZOOM_STEP)
  }

  const handleZoomOut = () => {
    viewport.zoomBy(1 / ZOOM_STEP)
  }

  return {
    showCrossModuleRelations,
    setShowCrossModuleRelations,
    fullscreenTarget,
    setFullscreenTarget,
    graphTables,
    viewport,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
    handleZoomIn,
    handleZoomOut,
  }
}
