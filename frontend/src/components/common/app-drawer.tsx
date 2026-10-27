import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

import { X } from "lucide-react"

export interface AppDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  /**
   * Action buttons rendered on the right side of the footer (e.g. Close + Action).
   */
  footerActions?: ReactNode
  /**
   * Width of the drawer. Defaults to 40vw for a wide, spacious panel.
   */
  widthClassName?: string
  /**
   * Additional classes for the drawer container.
   */
  className?: string
  /**
   * Content wrapper classes.
   */
  contentClassName?: string
  /**
   * Show or hide close button. Defaults to true.
   */
  showCloseButton?: boolean
}

/**
 * A reusable drawer component for viewing details across the application.
 * Adheres to DevCore ERP Design Spec (Pattern 5 - Drawer).
 */
export function AppDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footerActions,
  widthClassName = "w-full sm:max-w-[40vw]",
  className,
  contentClassName,
  showCloseButton,
}: AppDrawerProps) {
  const hasHeader = Boolean(title)
  const shouldShowClose = showCloseButton ?? true

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        showCloseButton={false}
        className={cn(
          widthClassName,
          "p-0 border-l border-border bg-background overflow-hidden flex flex-col",
          className,
        )}
      >
        {hasHeader ? (
          <div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0 bg-card">
            <div className="space-y-1 pr-4">
              {typeof title === "string" ? (
                <SheetTitle className="text-lg font-bold tracking-tight text-foreground">
                  {title}
                </SheetTitle>
              ) : (
                <SheetTitle asChild>{title}</SheetTitle>
              )}
              {description &&
                (typeof description === "string" ? (
                  <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </SheetDescription>
                ) : (
                  <SheetDescription asChild>{description}</SheetDescription>
                ))}
            </div>
            {shouldShowClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <SheetTitle className="sr-only">Bảng chi tiết</SheetTitle>
            <SheetDescription className="sr-only">Bảng xem chi tiết nội dung</SheetDescription>
            {shouldShowClose && (
              <div className="absolute top-4 left-4 z-50">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-muted"
                  aria-label="Đóng"
                >
                  <X size={16} className="text-muted-foreground" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Drawer Content */}
        <div className={cn("flex-1 overflow-y-auto hide-scrollbar", contentClassName)}>
          {children}
        </div>

        {/* Footer actions */}
        {footerActions && (
          <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-3 shrink-0">
            {footerActions}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
