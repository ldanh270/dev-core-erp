import { useEffect } from "react"

/**
 * Custom hook registering global Escape key handler to exit fullscreen ERD mode.
 *
 * @param toggleFullscreen - Fullscreen toggle function.
 * @param isFullscreen - Current fullscreen state.
 */
export function useDatabaseErdKeyboard(
  toggleFullscreen: () => Promise<void>,
  isFullscreen: boolean,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        void toggleFullscreen()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFullscreen, toggleFullscreen])
}
