import { memo } from "react"

import { getErdEdgeClassName } from "../database-erd-edge-style"
import type { ErdEdge } from "../database-erd-geometry"

interface DatabaseErdEdgeItemProps {
  d: string
  isHighlighted: boolean
  isDimmed: boolean
  crossModule: boolean
}

/**
 * Memoized SVG edge path preventing re-rendering of unchanged lines during node drag or hover spotlight.
 */
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
        markerEnd={markerEnd}
        markerStart={markerStart}
        className={getErdEdgeClassName({
          highlighted: isHighlighted,
          dimmed: isDimmed,
          crossModule,
        })}
      />
    </g>
  )
})

interface DatabaseErdEdgesSvgProps {
  edges: ErdEdge[]
  activeFocusTable: string | null
}

/**
 * Renders the full SVG layer with marker definitions and memoized orthogonal lines.
 */
export const DatabaseErdEdgesSvg = memo(function DatabaseErdEdgesSvg({
  edges,
  activeFocusTable,
}: DatabaseErdEdgesSvgProps) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <defs>
        <marker
          id="database-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-border" />
        </marker>
        <marker
          id="database-arrow-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-primary" />
        </marker>
        <marker
          id="database-arrow-dimmed"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-muted-foreground/30" />
        </marker>
        <marker
          id="database-arrow-cross-module"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" className="fill-primary/75" />
        </marker>
        <marker
          id="database-origin-dot"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="4"
          markerHeight="4"
        >
          <circle cx="3" cy="3" r="2.5" className="fill-border" />
        </marker>
        <marker
          id="database-origin-dot-active"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="5"
          markerHeight="5"
        >
          <circle cx="3" cy="3" r="2.5" className="fill-primary" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const isHighlighted = activeFocusTable
          ? edge.sourceTable === activeFocusTable || edge.targetTable === activeFocusTable
          : edge.highlighted
        const isDimmed = activeFocusTable !== null && !isHighlighted

        return (
          <DatabaseErdEdgeItem
            key={edge.id}
            d={edge.path}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            crossModule={edge.crossModule}
          />
        )
      })}
    </svg>
  )
})
