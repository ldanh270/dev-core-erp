import { cn } from "@/lib/utils"

type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral"

interface StatusPillProps {
  label: string
  variant?: StatusVariant
  className?: string
}

const variantMap: Record<StatusVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  neutral: "bg-secondary text-muted-foreground",
}

/**
 * StatusPill — Semantic colored pill badge for status labels.
 * Token-aligned: h-6, rounded-full, px-3, text-xs font-semibold.
 */
export function StatusPill({ label, variant = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none",
        variantMap[variant],
        className,
      )}
    >
      {label}
    </span>
  )
}
