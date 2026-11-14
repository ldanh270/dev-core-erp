import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ErdPoint } from "../database-erd-geometry"
import { buildErdLayoutFromBase, createBaseErdLayout } from "../database-erd-layout"
import type { TableDef } from "../database-reference.types"
import { useDatabaseErdDrag } from "./use-database-erd-drag"
import { useDatabaseErdFullscreen } from "./use-database-erd-fullscreen"
import { useDatabaseErdKeyboard } from "./use-database-erd-keyboard"
import { useDatabaseErdWheel } from "./use-database-erd-wheel"

export interface ViewportSize {
  width: number
  height: number
}

export const MIN_SCALE = 0.05
export const MAX_SCALE = 3
export const ZOOM_STEP = 1.15
const FIT_VIEWPORT_PADDING = 48

/**
 * Custom hook managing ERD canvas pan, zoom, scale, fullscreen, and node dragging across the viewport.
 *
 * @param tables - List of rendered tables.
 * @param selectedTableName - Highlighted table name.
 * @param fullscreenTarget - HTML DOM target element for fullscreen mode.
 * @returns Viewport coordinates, scale, layout graph, and interactive gesture handlers.
 */
export function useDatabaseErdViewport(
  tables: TableDef[],
  selectedTableName: string | null,
  fullscreenTarget: HTMLElement | null,
) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<ErdPoint>({ x: 0, y: 0 })
  const [viewport, setViewport] = useState<ViewportSize>(() => ({
    width: typeof window !== "undefined" ? Math.max(800, window.innerWidth - 280) : 1200,
    height: typeof window !== "undefined" ? Math.max(500, window.innerHeight - 240) : 600,
  }))
  const [nodePositions, setNodePositions] = useState<Map<string, ErdPoint>>(() => new Map())
  const [settledPositions, setSettledPositions] = useState<Map<string, ErdPoint>>(() => new Map())
  const viewportRef = useRef<HTMLDivElement>(null)
  const fitOnFullscreenRef = useRef(false)

  const currentTableNames = useMemo(
    () =>
      tables
        .map((t) => `${t.name}:${t.outgoingRelations.length}`)
        .sort()
        .join(","),
    [tables],
  )
  const prevTableNamesRef = useRef<string>("")

  useEffect(() => {
    if (prevTableNamesRef.current && prevTableNamesRef.current !== currentTableNames) {
      const empty = new Map<string, ErdPoint>()
      setNodePositions(empty)
      setSettledPositions(empty)
    }
    prevTableNamesRef.current = currentTableNames
  }, [currentTableNames])

  const baseLayout = useMemo(
    () => createBaseErdLayout(tables, viewport.width),
    [tables, viewport.width],
  )

  const settledLayout = useMemo(
    () => buildErdLayoutFromBase(baseLayout, selectedTableName, settledPositions),
    [baseLayout, selectedTableName, settledPositions],
  )

  const onFullscreenEnter = useCallback(() => {
    fitOnFullscreenRef.current = true
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (bounds) setViewport({ width: bounds.width, height: bounds.height })
  }, [])

  const { isFullscreen, toggleFullscreen } = useDatabaseErdFullscreen(
    fullscreenTarget,
    onFullscreenEnter,
  )

  const currentNodes = useMemo(
    () =>
      baseLayout.visibleTables.map((table) => ({
        table,
        position: nodePositions.get(table.name) ??
          baseLayout.basePositions.get(table.name) ?? { x: 64, y: 64 },
      })),
    [baseLayout, nodePositions],
  )

  const handleSettleNodePositions = useCallback(() => {
    setNodePositions((latest) => {
      setSettledPositions(latest)
      return latest
    })
  }, [])

  const {
    isPanning,
    draggingTableName,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectNode,
  } = useDatabaseErdDrag({
    scale,
    pan,
    setPan,
    setNodePositions,
    onSettleNodePositions: handleSettleNodePositions,
    graphNodes: currentNodes,
    isFullscreen,
    toggleFullscreen,
  })

  const graph = useMemo(() => {
    if (!draggingTableName) return settledLayout
    return buildErdLayoutFromBase(
      baseLayout,
      selectedTableName,
      nodePositions,
      draggingTableName,
      settledLayout.edges,
    )
  }, [baseLayout, draggingTableName, nodePositions, selectedTableName, settledLayout])

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [isFullscreen])

  useDatabaseErdWheel({ viewportRef, scale, setScale, pan, setPan })

  const fitGraph = useCallback(() => {
    if (!viewport.width || !viewport.height || !graph.width || !graph.height) return
    const scaleW = (viewport.width - FIT_VIEWPORT_PADDING) / graph.width
    const scaleH = (viewport.height - FIT_VIEWPORT_PADDING) / graph.height
    const baseFitScale = Math.min(scaleW, scaleH)
    const targetScale =
      scaleH > scaleW && graph.nodes.length <= 15
        ? Math.min(1.0, Math.max(baseFitScale, Math.min(0.85, scaleH * 0.95)))
        : baseFitScale
    const fittedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale))
    setScale(fittedScale)
    setPan({
      x: Math.max(24, Math.round((viewport.width - graph.width * fittedScale) / 2)),
      y: Math.max(16, Math.round((viewport.height - graph.height * fittedScale) / 2)),
    })
  }, [graph.height, graph.nodes.length, graph.width, viewport.height, viewport.width])

  useEffect(() => {
    if (viewport.width > 0 && viewport.height > 0) {
      if (nodePositions.size === 0 || fitOnFullscreenRef.current) {
        fitGraph()
        fitOnFullscreenRef.current = false
      }
    }
  }, [viewport.width, viewport.height, currentTableNames, fitGraph, nodePositions.size])

  useDatabaseErdKeyboard(toggleFullscreen, isFullscreen)

  const resetNodePositions = useCallback(() => {
    const empty = new Map<string, ErdPoint>()
    setNodePositions(empty)
    setSettledPositions(empty)
  }, [])

  const zoomBy = useCallback(
    (factor: number) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const center = { x: viewport.width / 2, y: viewport.height / 2 }
      const graphPoint = { x: (center.x - pan.x) / scale, y: (center.y - pan.y) / scale }
      setPan({
        x: Math.round(center.x - graphPoint.x * nextScale),
        y: Math.round(center.y - graphPoint.y * nextScale),
      })
      setScale(nextScale)
    },
    [pan.x, pan.y, scale, viewport.height, viewport.width],
  )

  return {
    graph,
    scale,
    pan,
    isPanning,
    isFullscreen,
    toggleFullscreen,
    viewport,
    viewportRef,
    fitGraph,
    zoomBy,
    resetNodePositions,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectNode,
  }
}
