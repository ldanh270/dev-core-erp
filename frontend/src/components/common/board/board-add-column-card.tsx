import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"

export interface BoardAddColumnCardProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export function BoardAddColumnCard({
  label = "Thêm cột trạng thái",
  className,
  ...props
}: BoardAddColumnCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[140px] w-[280px] shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl",
        "border-2 border-dashed border-border/70 bg-transparent text-muted-foreground",
        "transition-all duration-200 hover:border-primary/60 hover:bg-muted/30 hover:text-foreground",
        className
      )}
      {...props}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-105">
        <Plus className="h-4 w-4" />
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}
