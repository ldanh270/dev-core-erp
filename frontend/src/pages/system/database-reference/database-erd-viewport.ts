import type { TableDef } from "./database-reference.types"
import type { ErdPoint } from "./database-erd-layout"
import { createErdLayout } from "./database-erd-layout"
import { useDatabaseErdDrag } from "./database-erd-drag"
import { useDatabaseErdKeyboard } from "./database-erd-keyboard"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

export interface ViewportSize {
  width: number
  height: number
}

export const MIN_SCALE = 0.05
export const MAX_SCALE = 3
export const ZOOM_STEP = 1.15
const FIT_VIEWPORT_PADDING = 48

// Manages ERD pan, zoom, fullscreen, and unrestricted dragging of table nodes across the canvas.
export function useDatabaseErdViewport(
  tables: TableDef[],
  selectedTableName: string | null,
  fullscreenTarget: HTMLElement | null,
) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState<ErdPoint>({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 })
  const [nodePositions, setNodePositions] = useState<Map<string, ErdPoint>>(() => new Map())
  const viewportRef = useRef<HTMLDivElement>(null)
  const fitOnFullscreenRef = useRef(false)

  // Recompute ERD layout whenever visible tables, viewport width, or dragged node overrides change.
  const graph = useMemo(
    () => createErdLayout(tables, selectedTableName, viewport.width, nodePositions),
    [tables, selectedTableName, viewport.width, nodePositions],
  )

  // Observe ERD container size changes to fit and center the diagram accurately.
  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [isFullscreen])

  // Support Ctrl/Cmd + wheel zoom anchored at cursor position and wheel/Shift+wheel panning.
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        const element = viewportRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()
        const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, scale * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP)),
        )
        const graphPoint = { x: (pointer.x - pan.x) / scale, y: (pointer.y - pan.y) / scale }
        setPan({
          x: pointer.x - graphPoint.x * nextScale,
          y: pointer.y - graphPoint.y * nextScale,
        })
        setScale(nextScale)
        return
      }

      const deltaX = event.shiftKey ? Math.abs(event.deltaX) || event.deltaY : event.deltaX
      const deltaY = event.shiftKey ? 0 : event.deltaY
      setPan((current) => ({ x: current.x - deltaX, y: current.y - deltaY }))
    },
    [pan.x, pan.y, scale],
  )

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    element.addEventListener("wheel", handleWheel, { passive: false })
    return () => element.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // Toggle browser fullscreen mode on the ERD section element.
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!fullscreenTarget) return

      if (document.fullscreenElement === fullscreenTarget) {
        await document.exitFullscreen()
      } else if (document.fullscreenElement === null) {
        await fullscreenTarget.requestFullscreen()
      }
    } catch (error) {
      toast.error("Không thể mở toàn màn hình. Hãy kiểm tra quyền của trình duyệt.")
      console.error("ERD fullscreen request failed", error)
    }
  }, [fullscreenTarget])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen =
        fullscreenTarget !== null && document.fullscreenElement === fullscreenTarget
      if (isFullscreen) {
        fitOnFullscreenRef.current = true
        const bounds = viewportRef.current?.getBoundingClientRect()
        if (bounds) setViewport({ width: bounds.width, height: bounds.height })
      }
      setIsFullscreen(isFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [fullscreenTarget])

  // Fit and center the entire graph within the current viewport dimensions.
  const fitGraph = useCallback(() => {
    if (!viewport.width || !viewport.height) return
    const nextScale = Math.min(
      MAX_SCALE,
      (viewport.width - FIT_VIEWPORT_PADDING) / graph.width,
      (viewport.height - FIT_VIEWPORT_PADDING) / graph.height,
    )
    const fittedScale = Math.max(MIN_SCALE, nextScale)
    setScale(fittedScale)
    setPan({
      x: (viewport.width - graph.width * fittedScale) / 2,
      y: (viewport.height - graph.height * fittedScale) / 2,
    })
  }, [graph.height, graph.width, viewport.height, viewport.width])

  useEffect(() => {
    if (nodePositions.size === 0 || fitOnFullscreenRef.current) {
      fitGraph()
      fitOnFullscreenRef.current = false
    }
  }, [fitGraph, nodePositions.size])

  useDatabaseErdKeyboard(toggleFullscreen, isFullscreen)

  // Delegate node drag gestures and canvas panning to specialized hook.
  const { isPanning, handlePointerDown, handlePointerMove, handlePointerUp, handleSelectNode } =
    useDatabaseErdDrag({
      scale,
      pan,
      setPan,
      setNodePositions,
      graphNodes: graph.nodes,
      isFullscreen,
      toggleFullscreen,
    })

  // Clear manual drag overrides and restore automatic topological layout positions.
  const resetNodePositions = () => setNodePositions(new Map())

  // Zoom in or out relative to the center of the viewport.
  const zoomBy = (factor: number) => {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
    const center = { x: viewport.width / 2, y: viewport.height / 2 }
    const graphPoint = { x: (center.x - pan.x) / scale, y: (center.y - pan.y) / scale }
    setPan({
      x: center.x - graphPoint.x * nextScale,
      y: center.y - graphPoint.y * nextScale,
    })
    setScale(nextScale)
  }

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
    handleWheel,
  }
}
