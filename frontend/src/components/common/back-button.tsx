import { Button } from "@/components/ui/button"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"

import type { MouseEvent } from "react"

import { ArrowLeft } from "lucide-react"

export interface BackButtonProps {
  /** Target path to navigate when clicked. Strongly preferred over history back. */
  backHref?: string
  /** Fallback path if history back has no previous entries in current tab session. */
  fallbackHref?: string
  /** Custom click callback. If provided, overrides default router navigation. */
  onBack?: () => void
  /** Accessible title and optional pill label. */
  label?: string
  /** Visual presentation: round 32px icon button or rounded-full pill button with label. */
  variant?: "icon" | "pill"
  /** Additional custom classes. */
  className?: string
  /** Native tooltip text. Defaults to label or "Quay lại". */
  title?: string
}

/**
 * Standardized back navigation button across all enterprise modules.
 * Strictly adheres to The Pill Rule (rounded-full) and Navigation Law (routerNavigate).
 * Prevents tab-exit crashes by safely checking window history state before navigating.
 */
export function BackButton({
  backHref,
  fallbackHref,
  onBack,
  label = "Quay lại",
  variant = "icon",
  className,
  title,
}: BackButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (onBack) {
      onBack()
      return
    }

    if (backHref) {
      routerNavigate(backHref)
      return
    }

    // Safe history back check: only pop state if there's history in the current tab session
    if (typeof window !== "undefined" && window.history.state && window.history.state.idx > 0) {
      window.history.back()
    } else if (fallbackHref) {
      routerNavigate(fallbackHref)
    } else {
      window.history.back()
    }
  }

  const tooltip = title || label

  if (variant === "pill") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn(
          "rounded-full border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 gap-1.5",
          className,
        )}
        aria-label={label}
        title={tooltip}
      >
        <ArrowLeft className="size-4" />
        <span>{label}</span>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "rounded-full border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0",
        className,
      )}
      aria-label={label}
      title={tooltip}
    >
      <ArrowLeft className="size-4" />
    </Button>
  )
}
