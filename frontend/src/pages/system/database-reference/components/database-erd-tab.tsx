import { useMemo, useState } from "react"

import { useDatabaseErdViewport } from "../database-erd-viewport"
import type { ModuleDef, TableDef } from "../database-reference.types"
import { DatabaseErdCanvas } from "./database-erd-canvas"
import { DatabaseErdControls } from "./database-erd-controls"

// Props for the interactive ERD tab container.
interface DatabaseErdTabProps {
  tables: TableDef[]
  allTables: TableDef[]
  modules: ModuleDef[]
  selectedModule: string
  onModuleChange: (moduleId: string) => void
  limitNodes?: boolean
  selectedTableName: string | null
  onSelectTable: (table: TableDef) => void
}

const ZOOM_STEP = 1.15
const MIN_SCALE = 0.15
const MAX_SCALE = 3

// Displays a pannable ERD with module filtering and focused cross-module relations.
export function DatabaseErdTab({
  tables,
  allTables,
  modules,
  selectedModule,
  onModuleChange,
  limitNodes = false,
  selectedTableName,
  onSelectTable,
}: DatabaseErdTabProps) {
  const [showCrossModuleRelations, setShowCrossModuleRelations] = useState(true)
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

  const [fullscreenTarget, setFullscreenTarget] = useState<HTMLElement | null>(null)
  const viewport = useDatabaseErdViewport(
    graphTables,
    selectedTableName,
    limitNodes,
    fullscreenTarget,
  )
  const zoomBy = (factor: number) => {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, viewport.scale * factor))
    viewport.zoomBy(nextScale / viewport.scale)
  }

  return (
    <section
      ref={setFullscreenTarget}
      aria-label="Sơ đồ quan hệ cơ sở dữ liệu"
      className={`relative flex flex-col overflow-hidden border border-border bg-card ${
        viewport.isFullscreen
          ? "fixed inset-0 z-40 h-dvh rounded-none p-3"
          : "h-[calc(100dvh-240px)] min-h-120 rounded-xl"
      }`}
    >
      <DatabaseErdControls
        modules={modules}
        selectedModule={selectedModule}
        onModuleChange={onModuleChange}
        tableCount={viewport.graph.nodes.length}
        showCrossModuleRelations={showCrossModuleRelations}
        onCrossModuleRelationsChange={setShowCrossModuleRelations}
        scale={viewport.scale}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onFit={viewport.fitGraph}
        onResetLayout={viewport.resetNodePositions}
        isFullscreen={viewport.isFullscreen}
        onToggleFullscreen={viewport.toggleFullscreen}
      />
      <DatabaseErdCanvas
        graph={viewport.graph}
        modules={modules}
        selectedModule={selectedModule}
        selectedTableName={selectedTableName}
        scale={viewport.scale}
        pan={viewport.pan}
        isPanning={viewport.isPanning}
        viewportRef={viewport.viewportRef}
        onPointerDown={viewport.handlePointerDown}
        onPointerMove={viewport.handlePointerMove}
        onPointerUp={viewport.handlePointerUp}
        onSelectNode={(table) => viewport.handleSelectNode(table, onSelectTable)}
      />
    </section>
  )
}
