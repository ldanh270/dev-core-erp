import { useCallback, useEffect, useRef, useState } from "react"

import type { ErdNode, ErdPoint } from "../database-erd-geometry"
import type { TableDef } from "../database-reference.types"

/**
 * Tracks an active pointer drag gesture on an individual ERD table card.
 */
interface NodeDrag {
  name: string
  pointer: ErdPoint
  origin: ErdPoint
  target: HTMLElement
}

const DRAG_ACTIVATION_THRESHOLD_PX = 2

export interface UseDatabaseErdDragParams {
  scale: number
  pan: ErdPoint
  setPan: React.Dispatch<React.SetStateAction<ErdPoint>>
  setNodePositions: React.Dispatch<React.SetStateAction<Map<string, ErdPoint>>>
  onSettleNodePositions: () => void
  graphNodes: ErdNode[]
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
}

/**
 * Custom hook managing pointer dragging of ERD nodes and viewport canvas panning with rAF frame batching.
 *
 * @param params - Drag parameters including pan state, zoom scale, and node positions.
 * @returns Event handlers and active dragging/panning flags for the canvas.
 */
export function useDatabaseErdDrag({
  scale,
  pan,
  setPan,
  setNodePositions,
  onSettleNodePositions,
  graphNodes,
  isFullscreen,
  toggleFullscreen,
}: UseDatabaseErdDragParams) {
  const [isPanning, setIsPanning] = useState(false)
  const [draggingTableName, setDraggingTableName] = useState<string | null>(null)
  const panStart = useRef<ErdPoint>({ x: 0, y: 0 })
  const nodeDrag = useRef<NodeDrag | null>(null)
  const draggedNode = useRef<string | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const pendingPanRef = useRef<ErdPoint | null>(null)
  const pendingNodePosRef = useRef<{ name: string; pos: ErdPoint } | null>(null)

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) window.cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  /**
   * Flushes queued pan or node position updates at most once per animation frame.
   */
  const scheduleFrameFlush = useCallback(() => {
    if (rafIdRef.current !== null) return
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null
      if (pendingNodePosRef.current) {
        const { name, pos } = pendingNodePosRef.current
        pendingNodePosRef.current = null
        setNodePositions((current) => {
          const next = new Map(current)
          next.set(name, pos)
          return next
        })
      }
      if (pendingPanRef.current) {
        const nextPan = pendingPanRef.current
        pendingPanRef.current = null
        setPan(nextPan)
      }
    })
  }, [setNodePositions, setPan])

  /**
   * Initializes table node dragging on pointer down or starts canvas panning.
   */
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    window.getSelection()?.removeAllRanges()

    const node = (event.target as HTMLElement).closest<HTMLElement>("[data-erd-node]")
    if (node) {
      const name = node.dataset.erdNode
      const position = graphNodes.find((item) => item.table.name === name)?.position
      if (!name || !position) return
      nodeDrag.current = {
        name,
        pointer: { x: event.clientX, y: event.clientY },
        origin: position,
        target: node,
      }
      node.setPointerCapture(event.pointerId)
      setIsPanning(false)
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsPanning(true)
    panStart.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
  }

  /**
   * Updates dragged node coordinates or canvas pan position coalesced to display refresh rate.
   */
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) {
      const drag = nodeDrag.current
      const dx = (event.clientX - drag.pointer.x) / scale
      const dy = (event.clientY - drag.pointer.y) / scale
      if (Math.abs(dx) + Math.abs(dy) > DRAG_ACTIVATION_THRESHOLD_PX) {
        if (draggedNode.current !== drag.name) {
          draggedNode.current = drag.name
          setDraggingTableName(drag.name)
        }
      }
      if (draggedNode.current === drag.name) {
        pendingNodePosRef.current = {
          name: drag.name,
          pos: {
            x: Math.round(drag.origin.x + dx),
            y: Math.round(drag.origin.y + dy),
          },
        }
        scheduleFrameFlush()
      }
      return
    }
    if (!isPanning) return
    pendingPanRef.current = {
      x: Math.round(event.clientX - panStart.current.x),
      y: Math.round(event.clientY - panStart.current.y),
    }
    scheduleFrameFlush()
  }

  /**
   * Releases pointer capture at the end of a drag or canvas pan gesture.
   */
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (pendingNodePosRef.current) {
      const { name, pos } = pendingNodePosRef.current
      pendingNodePosRef.current = null
      setNodePositions((current) => {
        const next = new Map(current)
        next.set(name, pos)
        return next
      })
    }
    if (pendingPanRef.current) {
      setPan(pendingPanRef.current)
      pendingPanRef.current = null
    }

    if (nodeDrag.current) {
      const { target } = nodeDrag.current
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
      nodeDrag.current = null
      setDraggingTableName(null)
      onSettleNodePositions()
      window.setTimeout(() => {
        draggedNode.current = null
      }, 0)
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsPanning(false)
  }

  /**
   * Opens the table detail sheet on click, ignoring clicks that were part of a drag gesture.
   */
  const handleSelectNode = useCallback(
    (table: TableDef, onSelect: (table: TableDef) => void) => {
      if (draggedNode.current === table.name) {
        draggedNode.current = null
        return
      }
      if (isFullscreen) {
        void toggleFullscreen().then(() => {
          if (document.fullscreenElement === null) onSelect(table)
        })
        return
      }
      onSelect(table)
    },
    [isFullscreen, toggleFullscreen],
  )

  return {
    isPanning: isPanning || draggingTableName !== null,
    draggingTableName,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectNode,
  }
}
