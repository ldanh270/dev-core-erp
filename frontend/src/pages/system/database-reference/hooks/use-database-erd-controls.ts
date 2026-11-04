export interface UseDatabaseErdControlsParams {
  scale: number
  isFullscreen: boolean
}

/**
 * Custom hook providing zoom percentage, button tooltips, and action label formatting for the ERD toolbar.
 */
export function useDatabaseErdControls({
  scale,
  isFullscreen,
}: UseDatabaseErdControlsParams) {
  const scalePercent = Math.round(scale * 100)
  const fullscreenLabel = isFullscreen ? "Thu nhỏ" : "Toàn màn hình"
  const fullscreenAriaLabel = isFullscreen ? "Thoát toàn màn hình" : "Mở toàn màn hình"

  return {
    scalePercent,
    fullscreenLabel,
    fullscreenAriaLabel,
  }
}
