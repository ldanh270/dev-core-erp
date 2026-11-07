import { useMemo, useState } from "react"
import type { TableDef } from "../database-reference.types"
import {
  MAX_SCALE,
  MIN_SCALE,
  useDatabaseErdViewport,
  ZOOM_STEP,
} from "../database-erd-viewport"

export type { ViewportSize } from "../database-erd-viewport"

export interface UseDatabaseErdTabParams {
  tables: TableDef[]
  allTables: TableDef[]
  selectedModule: string
  selectedTableName: string | null
}

/**
 * Custom hook orchestrating the interactive ERD graph tables calculation, cross-module filtering, and viewport controls.
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

  // Include external cross-module tables when a single module is selected and the cross-module switch is enabled.
  const graphTables = useMemo(() => {
    if (selectedModule === "ALL" || !showCrossModuleRelations) return tables

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

    const externalTables = allTables
      .filter((table) => externalNames.has(table.name))
      .map((table) => ({
        ...table,
        outgoingRelations: table.outgoingRelations.filter((relation) =>
          moduleTableNames.has(relation.targetTable),
        ),
      }))

    return [...tables, ...externalTables]
  }, [allTables, moduleTableNames, selectedModule, showCrossModuleRelations, tableByName, tables])

  const viewport = useDatabaseErdViewport(
    graphTables,
    selectedTableName,
    fullscreenTarget,
  )

  // Zoom in by the standard geometric step bounded by MAX_SCALE.
  const handleZoomIn = () => {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * ZOOM_STEP))
    viewport.zoomBy(nextScale / viewport.scale)
  }

  // Zoom out by the standard geometric step bounded by MIN_SCALE.
  const handleZoomOut = () => {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * (1 / ZOOM_STEP)))
    viewport.zoomBy(nextScale / viewport.scale)
  }

  return {
    showCrossModuleRelations,
    setShowCrossModuleRelations,
    fullscreenTarget,
    setFullscreenTarget,
    viewport,
    handleZoomIn,
    handleZoomOut,
  }
}
