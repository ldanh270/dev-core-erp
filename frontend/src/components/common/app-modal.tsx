import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

import { X } from "lucide-react"

export interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  /**
   * Action buttons rendered on the right side of the footer (e.g. Cancel + Confirm).
   * Usually buttons with rounded-full.
   */
  footerActions?: ReactNode
  /**
   * Width class for the modal.
   * Use Tailwind max-w classes like 'sm:max-w-md', 'sm:max-w-lg', 'sm:max-w-2xl', or 'sm:max-w-4xl'.
   */
  widthClassName?: string
  /**
   * Additional classes for the modal container.
   */
  className?: string
  /**
   * Content wrapper classes.
   */
  contentClassName?: string
  /**
   * Show or hide top-right close button. Defaults to true if title is provided, false otherwise.
   */
  showCloseButton?: boolean
}

/**
 * A reusable, enterprise-grade modal component adhering to DevCore ERP Design Spec.
 * Enforces `rounded-xl` container, semantic tokens, and standardized header/footer actions.
 */
export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footerActions,
  widthClassName = "sm:max-w-2xl",
  className,
  contentClassName,
  showCloseButton,
}: AppModalProps) {
  const hasHeader = Boolean(title)
  const shouldShowClose = showCloseButton ?? true

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "p-0 overflow-hidden gap-0 bg-background rounded-xl shadow-xl flex flex-col max-h-[90vh] duration-200 border border-border",
          widthClassName,
          className,
        )}
      >
        {hasHeader ? (
          <div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0 bg-card">
            <div className="space-y-1 pr-4">
              {typeof title === "string" ? (
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                  {title}
                </DialogTitle>
              ) : (
                <DialogTitle asChild>{title}</DialogTitle>
              )}
              {description &&
                (typeof description === "string" ? (
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </DialogDescription>
                ) : (
                  <DialogDescription asChild>{description}</DialogDescription>
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
            <DialogTitle className="sr-only">Hộp thoại</DialogTitle>
            <DialogDescription className="sr-only">Cửa sổ tương tác</DialogDescription>
          </>
        )}

        {/* Content area */}
        <div className={cn("flex-1 overflow-y-auto", hasHeader ? "p-6" : "", contentClassName)}>
          {children}
        </div>

        {/* Footer actions */}
        {footerActions && (
          <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-3 shrink-0">
            {footerActions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
