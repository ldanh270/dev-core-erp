import type { ModuleDef, TableDef } from "../database-reference.types"
import type { ErdEdge, ErdLayout, ErdPoint } from "../database-erd-layout"
import { getErdEdgeClassName } from "../database-erd-edges"
import { DatabaseErdNode } from "./database-erd-node"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent, RefObject } from "react"

// Spacing of the radial dot grid background inside the interactive ERD viewport.
const ERD_GRID_SIZE = "22px 22px"

// Props for a single memoized orthogonal SVG relationship path.
interface DatabaseErdEdgeItemProps {
  d: string
  isHighlighted: boolean
  isDimmed: boolean
  crossModule: boolean
}

// Memoized SVG edge path so unchanged edges never re-render during node drag or hover spotlight.
const DatabaseErdEdgeItem = memo(function DatabaseErdEdgeItem({
  d,
  isHighlighted,
  isDimmed,
  crossModule,
}: DatabaseErdEdgeItemProps) {
  const markerEnd = isHighlighted
    ? "url(#database-arrow-active)"
    : isDimmed
      ? "url(#database-arrow-dimmed)"
      : crossModule
        ? "url(#database-arrow-cross-module)"
        : "url(#database-arrow)"
  const markerStart = isHighlighted
    ? "url(#database-origin-dot-active)"
    : isDimmed
      ? undefined
      : "url(#database-origin-dot)"

  return (
    <g>
      {!isDimmed && (
        <path
          d={d}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isHighlighted
              ? "stroke-background stroke-[6] opacity-95"
              : "stroke-background stroke-[4] opacity-85"
          }
        />
      )}
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-cross-module={crossModule}
        data-highlighted={isHighlighted}
        className={getErdEdgeClassName({
          highlighted: isHighlighted,
          dimmed: isDimmed,
          crossModule,
        })}
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
    </g>
  )
})

// Memoized SVG layer so canvas panning and zooming skip reconciling all relationship paths.
const DatabaseErdEdgesSvg = memo(function DatabaseErdEdgesSvg({
  edges,
  activeFocusTable,
}: {
  edges: ErdEdge[]
  activeFocusTable: string | null
}) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-15 size-full overflow-visible"
    >
      <defs>
        <marker
          id="database-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/80" />
        </marker>
        <marker
          id="database-arrow-dimmed"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/30" />
        </marker>
        <marker
          id="database-arrow-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto"
        >
          <path d="M 0 0.5 L 10 5 L 0 9.5 z" className="fill-primary" />
        </marker>
        <marker
          id="database-arrow-cross-module"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" className="fill-primary/80" />
        </marker>
        <marker
          id="database-origin-dot"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="4"
          markerHeight="4"
        >
          <circle cx="3" cy="3" r="2.2" className="fill-muted-foreground/75" />
        </marker>
        <marker
          id="database-origin-dot-active"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="4.5"
          markerHeight="4.5"
        >
          <circle cx="3" cy="3" r="2.5" className="fill-primary" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const d = edge.path || `M ${edge.from.x} ${edge.from.y} L ${edge.to.x} ${edge.to.y}`
        const isHighlighted =
          activeFocusTable !== null &&
          (edge.sourceTable === activeFocusTable || edge.targetTable === activeFocusTable)
        const isDimmed = activeFocusTable !== null && !isHighlighted
        return (
          <DatabaseErdEdgeItem
            key={edge.id}
            d={d}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            crossModule={edge.crossModule}
          />
        )
      })}
    </svg>
  )
})

// Props required to render the interactive ERD canvas, orthogonal SVG relationship lines, and node cards.
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
  const [hoveredTableName, setHoveredTableName] = useState<string | null>(null)
  const isPanningRef = useRef(isPanning)

  useEffect(() => {
    isPanningRef.current = isPanning
  }, [isPanning])

  // Ignore hover events during active canvas panning or node dragging to avoid mid-drag spotlight re-renders.
  const handleHoverTable = useCallback((tableName: string | null) => {
    if (isPanningRef.current) return
    setHoveredTableName(tableName)
  }, [])

  const activeFocusTable = hoveredTableName ?? selectedTableName

  return (
    <div
      ref={viewportRef}
      data-testid="database-erd-viewport"
      className="relative flex-1 min-h-0 w-full touch-none cursor-grab overflow-hidden bg-background active:cursor-grabbing"
      style={{
        backgroundImage:
          "radial-gradient(var(--muted-foreground) 0.75px, transparent 0.75px)",
        backgroundSize: ERD_GRID_SIZE,
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
