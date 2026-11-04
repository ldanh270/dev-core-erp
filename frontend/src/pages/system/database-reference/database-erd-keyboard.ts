import { useEffect } from "react"

// Registers keyboard shortcuts (`F` to toggle fullscreen, `Escape` to exit fullscreen) when outside form inputs.
export function useDatabaseErdKeyboard(
  toggleFullscreen: () => Promise<void>,
  isFullscreen: boolean,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) {
        return
      }
      if (event.key === "Escape" && isFullscreen) {
        event.preventDefault()
        void toggleFullscreen()
        return
      }
      if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        void toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen, toggleFullscreen])
}
