import type { ModuleDef, TableDef } from "../database-reference.types"
import type { ErdLayout, ErdPoint } from "../database-erd-layout"
import { getErdEdgeClassName } from "../database-erd-edges"
import { DatabaseErdNode } from "./database-erd-node"

import type { PointerEvent, RefObject } from "react"

// Spacing of the radial dot grid background inside the interactive ERD viewport.
const ERD_GRID_SIZE = "22px 22px"

// Props required to render the interactive ERD canvas, SVG relationship lines, and node cards.
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

// Renders the pannable/zoomable ERD canvas with straight SVG relationship edges and draggable table nodes.
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
  return (
    <div
      ref={viewportRef}
      data-testid="database-erd-viewport"
      className="min-h-0 flex-1 touch-none cursor-grab overflow-hidden bg-background active:cursor-grabbing"
      style={{
        backgroundImage:
          "radial-gradient(var(--muted-foreground) 0.75px, transparent 0.75px)",
        backgroundSize: ERD_GRID_SIZE,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
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
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: isPanning ? "none" : "transform 100ms ease-out",
            position: "relative",
            width: `${graph.width}px`,
            height: `${graph.height}px`,
          }}
        >
          {/* SVG layer rendering directional arrowheads and straight relationship lines (`M x1 y1 L x2 y2`). */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <marker
                id="database-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground/60" />
              </marker>
              <marker
                id="database-arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
              </marker>
              <marker
                id="database-arrow-cross-module"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              // Draw a straight segment from source FK anchor to target PK anchor.
              const path = `M ${edge.from.x} ${edge.from.y} L ${edge.to.x} ${edge.to.y}`
              return (
                <path
                  key={edge.id}
                  d={path}
                  fill="none"
                  data-cross-module={edge.crossModule}
                  data-highlighted={edge.highlighted}
                  className={getErdEdgeClassName(edge)}
                  markerEnd={
                    edge.highlighted
                      ? "url(#database-arrow-active)"
                      : edge.crossModule
                        ? "url(#database-arrow-cross-module)"
                        : "url(#database-arrow)"
                  }
                />
              )
            })}
          </svg>

          {/* HTML node layer rendering each table card at its computed or dragged position. */}
          {graph.nodes.map(({ table, position }) => (
            <DatabaseErdNode
              key={table.name}
              table={table}
              modules={modules}
              selectedModule={selectedModule}
              selectedTableName={selectedTableName}
              position={position}
              onSelectTable={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
