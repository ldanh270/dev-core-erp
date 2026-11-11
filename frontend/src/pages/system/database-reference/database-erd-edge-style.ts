import type { ErdEdge } from "./database-erd-geometry"

/**
 * Returns semantic stroke and dash styles for active, dimmed, or cross-module relationship lines.
 *
 * @param edge - Edge flags indicating highlight, dimming, and cross-module boundary.
 * @returns Semantic Tailwind SVG stroke utility classes.
 */
export function getErdEdgeClassName(
  edge: Pick<ErdEdge, "highlighted" | "crossModule"> & { dimmed?: boolean },
): string {
  if (edge.highlighted) return "stroke-primary stroke-[2.5] opacity-100"
  if (edge.dimmed) return "stroke-muted-foreground/30 stroke-[1.25] opacity-35"
  if (edge.crossModule) {
    return "stroke-primary/75 stroke-[1.75] opacity-85 [stroke-dasharray:6_4]"
  }
  return "stroke-border stroke-[1.5] opacity-65"
}
