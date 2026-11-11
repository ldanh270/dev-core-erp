import type { ModuleDef, TableDef } from "../database-reference.types"
import type { ErdLayout, ErdPoint } from "../database-erd-geometry"
import { DatabaseErdEdgesSvg } from "./database-erd-edges-svg"
import { DatabaseErdNode } from "./database-erd-node"
import { useDatabaseErdCanvas } from "../hooks/use-database-erd-canvas"

import type { PointerEvent, RefObject } from "react"

const ERD_GRID_SIZE = "22px 22px"

/**
 * Props required to render the interactive ERD canvas, orthogonal SVG relationship lines, and node cards.
 */
interface DatabaseErdCanvasProps {
  graph: ErdLayout
  modules: ModuleDef[]
  selectedModule: string
  selectedTableName: string | null
  scale: number
  pan: ErdPoint
  isPanning: boolean
  viewportRef: RefObject<HTMLDivElement | null>
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
  onSelectNode: (table: TableDef) => void
}

/**
 * Renders the GPU-composited ERD canvas with memoized orthogonal SVG relationship edges and draggable table nodes.
 */
export function DatabaseErdCanvas({
  graph,
  modules,
  selectedModule,
  selectedTableName,
  scale,
  pan,
  isPanning,
  viewportRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectNode,
}: DatabaseErdCanvasProps) {
  const { activeFocusTable, handleHoverTable } = useDatabaseErdCanvas({
    isPanning,
    selectedTableName,
  })

  return (
    <div
      ref={viewportRef}
      data-testid="database-erd-viewport"
      className="relative flex-1 min-h-0 w-full select-none touch-none cursor-grab overflow-hidden bg-background active:cursor-grabbing"
      style={{
        backgroundImage:
          "radial-gradient(var(--muted-foreground) 0.75px, transparent 0.75px)",
        backgroundSize: ERD_GRID_SIZE,
      }}
      onDragStart={(event) => {
        event.preventDefault()
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {graph.nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
          Không có bảng phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transformOrigin: "top left",
            willChange: "transform",
            position: "absolute",
            top: 0,
            left: 0,
            width: `${graph.width}px`,
            height: `${graph.height}px`,
          }}
        >
          <DatabaseErdEdgesSvg edges={graph.edges} activeFocusTable={activeFocusTable} />

          {/* HTML node layer rendering each memoized table card at its computed or dragged position. */}
          {graph.nodes.map(({ table, position }) => (
            <DatabaseErdNode
              key={table.name}
              table={table}
              modules={modules}
              selectedModule={selectedModule}
              selectedTableName={null}
              isFocused={activeFocusTable === table.name}
              position={position}
              onSelectTable={onSelectNode}
              onHoverTable={handleHoverTable}
            />
          ))}
        </div>
      )}
    </div>
  )
}
