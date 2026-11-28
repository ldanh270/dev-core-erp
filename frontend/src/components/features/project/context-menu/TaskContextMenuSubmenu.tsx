import type React from "react"

import { ChevronRight } from "lucide-react"

interface TaskContextMenuSubmenuProps {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  flipLeft?: boolean
  flipUp?: boolean
  dropdownClassName?: string
}

/** Generic nested submenu component for context menu actions. */
export function TaskContextMenuSubmenu({
  label,
  icon,
  children,
  flipLeft = false,
  flipUp = false,
  dropdownClassName = "min-w-[130px]",
}: TaskContextMenuSubmenuProps) {
  const submenuPosClass = flipLeft ? "right-full top-0 -mr-2 pr-3" : "left-full top-0 -ml-2 pl-3"

  const submenuAlignClass = flipUp ? "bottom-0 top-auto" : "top-0"

  return (
    <div className="relative group/sub">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-semibold text-foreground cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </span>
        <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
      </button>
      <div className={`absolute ${submenuPosClass} hidden group-hover/sub:block z-[10000]`}>
        <div
          className={`bg-card text-card-foreground border border-border/80 rounded-xl shadow-xl p-1.5 ${dropdownClassName} ${submenuAlignClass}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
