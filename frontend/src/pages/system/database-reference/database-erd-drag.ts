import type { ErdNode, ErdPoint } from "./database-erd-layout"
import type { TableDef } from "./database-reference.types"

import { useRef, useState } from "react"

// Tracks an active pointer drag gesture on an individual ERD table card.
interface NodeDrag {
  name: string
  pointer: ErdPoint
  origin: ErdPoint
  target: HTMLElement
}

const DRAG_ACTIVATION_THRESHOLD_PX = 2

interface UseDatabaseErdDragParams {
  scale: number
  pan: ErdPoint
  setPan: React.Dispatch<React.SetStateAction<ErdPoint>>
  setNodePositions: React.Dispatch<React.SetStateAction<Map<string, ErdPoint>>>
  graphNodes: ErdNode[]
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
}

// Manages pointer dragging of individual ERD nodes and viewport canvas panning.
export function useDatabaseErdDrag({
  scale,
  pan,
  setPan,
  setNodePositions,
  graphNodes,
  isFullscreen,
  toggleFullscreen,
}: UseDatabaseErdDragParams) {
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<ErdPoint>({ x: 0, y: 0 })
  const nodeDrag = useRef<NodeDrag | null>(null)
  const draggedNode = useRef<string | null>(null)

  // Start dragging a table node if pointer down occurred on a card; otherwise start panning canvas.
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
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

    setIsPanning(true)
    panStart.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
  }

  // Update dragged node coordinates freely across the entire ERD frame (without boundary clamping).
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) {
      const drag = nodeDrag.current
      const dx = (event.clientX - drag.pointer.x) / scale
      const dy = (event.clientY - drag.pointer.y) / scale
      if (Math.abs(dx) + Math.abs(dy) > DRAG_ACTIVATION_THRESHOLD_PX) {
        draggedNode.current = drag.name
      }
      if (draggedNode.current === drag.name) {
        setNodePositions((current) => {
          const next = new Map(current)
          next.set(drag.name, {
            x: drag.origin.x + dx,
            y: drag.origin.y + dy,
          })
          return next
        })
      }
      return
    }
    if (!isPanning) return
    setPan({ x: event.clientX - panStart.current.x, y: event.clientY - panStart.current.y })
  }

  // Release pointer capture at the end of a node drag or canvas pan gesture.
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (nodeDrag.current) {
      const { target } = nodeDrag.current
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
      nodeDrag.current = null
      window.setTimeout(() => {
        draggedNode.current = null
      }, 0)
      return
    }
    setIsPanning(false)
  }

  // Open the table detail sheet on click, ignoring clicks that were part of a node drag gesture.
  const handleSelectNode = (table: TableDef, onSelect: (table: TableDef) => void) => {
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
  }

  return {
    isPanning,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSelectNode,
  }
}
