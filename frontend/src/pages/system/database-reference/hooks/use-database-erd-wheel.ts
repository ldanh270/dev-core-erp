import type { ErdPoint } from "../database-erd-geometry"
import { MAX_SCALE, MIN_SCALE, ZOOM_STEP } from "./use-database-erd-viewport"

import { useCallback, useEffect } from "react"
import type { RefObject } from "react"

interface UseDatabaseErdWheelParams {
  viewportRef: RefObject<HTMLDivElement | null>
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>
  pan: ErdPoint
  setPan: React.Dispatch<React.SetStateAction<ErdPoint>>
}

/**
 * Custom hook handling wheel zooming (anchored to cursor) and two-finger/wheel panning on ERD canvas.
 *
 * @param params - Viewport DOM ref, scale state, and pan position state.
 */
export function useDatabaseErdWheel({
  viewportRef,
  scale,
  setScale,
  pan,
  setPan,
}: UseDatabaseErdWheelParams) {
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
          x: Math.round(pointer.x - graphPoint.x * nextScale),
          y: Math.round(pointer.y - graphPoint.y * nextScale),
        })
        setScale(nextScale)
        return
      }

      const deltaX = event.shiftKey ? Math.abs(event.deltaX) || event.deltaY : event.deltaX
      const deltaY = event.shiftKey ? 0 : event.deltaY
      setPan((current) => ({
        x: Math.round(current.x - deltaX),
        y: Math.round(current.y - deltaY),
      }))
    },
    [pan.x, pan.y, scale, setPan, setScale, viewportRef],
  )

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    element.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      element.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel, viewportRef])
}
