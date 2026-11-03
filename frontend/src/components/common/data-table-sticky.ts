import type { CSSProperties } from "react"
import type { DataTableColumn } from "./data-table.types"

export interface StickyLayoutResult {
  /** Left offset (in px) for each sticky column = cumulative width of preceding sticky columns */
  offsets: Record<string, number>
  /** ID of the rightmost sticky column (to append separator border and drop shadow) */
  lastStickyId: string | undefined
  /** Total width (in px) of all columns combined; undefined if any column lacks a valid pixel width */
  totalMinWidth: number | undefined
  /** Set of column IDs that have valid sticky positioning enabled */
  stickyColIds: Set<string>
}

/**
 * Extracts numeric pixel value from a width or minWidth string/number (e.g., "220px", 220 -> 220).
 * Returns undefined for non-pixel units (e.g., "%", "rem") or invalid values.
 */
export function parsePixelWidth(width?: string | number): number | undefined {
  if (typeof width === "number") {
    return width > 0 ? width : undefined
  }
  if (typeof width === "string") {
    const trimmed = width.trim()
    if (trimmed.endsWith("px")) {
      const num = parseFloat(trimmed.slice(0, -2))
      return !isNaN(num) && num > 0 ? num : undefined
    }
  }
  return undefined
}

/**
 * Computes sticky column layout, offsets, and minimum table width for DataTablePage.
 * Pure deterministic function with zero external side effects, easily testable.
 *
 * @param columns List of data table column configurations
 * @returns StickyLayoutResult containing offsets, lastStickyId, totalMinWidth, and stickyColIds
 */
export function computeStickyLayout<T>(columns: DataTableColumn<T>[]): StickyLayoutResult {
  const offsets: Record<string, number> = {}
  const stickyColIds = new Set<string>()
  let lastStickyId: string | undefined
  let accumulatedStickyWidth = 0
  let accumulatedTotalWidth = 0
  let allColumnsHavePx = true

  for (const col of columns) {
    const pxWidth = parsePixelWidth(col.width) ?? parsePixelWidth(col.minWidth)

    if (pxWidth === undefined) {
      allColumnsHavePx = false
      if (col.sticky || col.stickyLeft) {
        if (import.meta.env?.DEV) {
          console.warn(
            `[DataTableSticky] Column "${col.id}" is marked sticky but lacks a valid pixel width ("${col.width}"). Sticky behavior will be skipped for this column.`,
          )
        }
      }
    } else {
      accumulatedTotalWidth += pxWidth
    }

    const isMarkedSticky = Boolean(col.sticky || col.stickyLeft)
    if (isMarkedSticky && pxWidth !== undefined) {
      // Prioritize explicit stickyLeftOffset if provided (backward compatibility)
      const manualOffset = parsePixelWidth(col.stickyLeftOffset)
      const currentOffset = manualOffset !== undefined ? manualOffset : accumulatedStickyWidth

      offsets[col.id] = currentOffset
      stickyColIds.add(col.id)
      lastStickyId = col.id
      accumulatedStickyWidth = currentOffset + pxWidth
    }
  }

  return {
    offsets,
    lastStickyId,
    totalMinWidth: allColumnsHavePx && accumulatedTotalWidth > 0 ? accumulatedTotalWidth : undefined,
    stickyColIds,
  }
}

/**
 * Helper generating utility classes and inline styles for sticky cells (th/td)
 * used inside DataTablePage or custom renderRows implementations.
 */
export function getStickyCellProps<T>(
  col: DataTableColumn<T>,
  layout: StickyLayoutResult,
  options?: { isHeader?: boolean },
): { className?: string; style?: CSSProperties } {
  const isSticky = layout.stickyColIds.has(col.id)
  const isHeader = options?.isHeader ?? false

  if (!isSticky) {
    if (isHeader) {
      return {
        className: "bg-card",
        style: {
          width: col.width,
          minWidth: col.minWidth || col.width,
        },
      }
    }
    return {
      style: {
        width: col.width,
        minWidth: col.minWidth || col.width,
      },
    }
  }

  const isLast = col.id === layout.lastStickyId

  // Header cells stick horizontally from md: breakpoint (vertical stickiness is handled by thead sticky top-0).
  // Do NOT add top-0 or style.top to th, as nesting sticky top inside sticky thead causes Chromium to displace th by half its height.
  const baseClass = isHeader
    ? "md:sticky md:z-30 bg-card"
    : "md:sticky md:z-10 bg-card group-hover:bg-muted"

  // Separator border and subtle drop shadow on the right edge of the last pinned column.
  const shadowClass = isLast
    ? "md:border-r md:border-border md:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)] dark:md:shadow-[4px_0_6px_-4px_rgba(0,0,0,0.5)]"
    : ""

  return {
    className: `${baseClass} ${shadowClass}`.trim(),
    style: {
      width: col.width,
      minWidth: col.minWidth || col.width,
      maxWidth: col.width,
      left: `${layout.offsets[col.id] ?? 0}px`,
    },
  }
}
