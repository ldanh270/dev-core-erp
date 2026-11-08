import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

export interface BoardContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function BoardContainer({
  children,
  className,
  ...props
}: BoardContainerProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-3.5 overflow-x-auto pb-4 pt-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
