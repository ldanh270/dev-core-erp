import { useEffect, useRef, useState } from "react"

interface UseContextMenuPositionProps {
  isOpen: boolean
  x: number
  y: number
  enabled: boolean
  onClose: () => void
}

/** Calculates responsive viewport-constrained coordinates for context menu popups. */
export function useContextMenuPosition({
  isOpen,
  x,
  y,
  enabled,
  onClose,
}: UseContextMenuPositionProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: y, left: x, flipUp: false, flipLeft: false })

  useEffect(() => {
    if (!isOpen || !enabled) return

    const menuWidth = 196
    const menuHeight = 360

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let calculatedLeft = x
    let calculatedTop = y
    let flipUp = false
    let flipLeft = false

    if (y + menuHeight > viewportHeight) {
      calculatedTop = Math.max(10, viewportHeight - menuHeight - 15)
      flipUp = true
    }

    if (x + menuWidth > viewportWidth) {
      calculatedLeft = Math.max(10, viewportWidth - menuWidth - 15)
      flipLeft = true
    }

    setPos({ top: calculatedTop, left: calculatedLeft, flipUp, flipLeft })
  }, [isOpen, x, y, enabled])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleScrollOrResize = () => {
      onClose()
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
      window.addEventListener("scroll", handleScrollOrResize, true)
      window.addEventListener("resize", handleScrollOrResize)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isOpen, onClose])

  return { menuRef, pos }
}
