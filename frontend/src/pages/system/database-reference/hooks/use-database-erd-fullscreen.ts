import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"

/**
 * Custom hook managing browser element fullscreen state and toggle requests with Sonner error handling.
 *
 * @param fullscreenTarget - Target HTML element to make fullscreen.
 * @param onFullscreenEnter - Optional callback invoked when fullscreen mode is activated.
 * @returns Fullscreen status flag and async toggle handler.
 */
export function useDatabaseErdFullscreen(
  fullscreenTarget: HTMLElement | null,
  onFullscreenEnter?: () => void,
) {
  const [isFullscreen, setIsFullscreen] = useState(false)

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
      const nextFullscreen =
        fullscreenTarget !== null && document.fullscreenElement === fullscreenTarget
      if (nextFullscreen) {
        onFullscreenEnter?.()
      }
      setIsFullscreen(nextFullscreen)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [fullscreenTarget, onFullscreenEnter])

  return {
    isFullscreen,
    toggleFullscreen,
  }
}
