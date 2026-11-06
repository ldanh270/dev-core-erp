import type { ModuleDef, TableDef } from "../database-reference.types"
import { DatabaseErdCanvas } from "./database-erd-canvas"
import { DatabaseErdControls } from "./database-erd-controls"
import { useDatabaseErdTab } from "../hooks/use-database-erd-tab"

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

/**
 * Displays a pannable ERD with module filtering and focused cross-module relations.
 * Pure UI presentation component powered by `useDatabaseErdTab` hook.
 */
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
  const {
    showCrossModuleRelations,
    setShowCrossModuleRelations,
    setFullscreenTarget,
    viewport,
    handleZoomIn,
    handleZoomOut,
  } = useDatabaseErdTab({
    tables,
    allTables,
    selectedModule,
    selectedTableName,
    limitNodes,
  })

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
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
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
        onSelectNode={(table) => { viewport.handleSelectNode(table, onSelectTable); }}
      />
    </section>
  )
}
