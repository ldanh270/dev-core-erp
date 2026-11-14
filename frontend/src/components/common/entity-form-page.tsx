import { BackButton } from "@/components/common/back-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

interface EntityFormPageProps {
  title: string
  isReadOnly?: boolean
  isPending?: boolean
  isDirty?: boolean
  formId?: string
  children: ReactNode
  onBack: () => void
  onEdit?: () => void
  onSubmit?: () => void
  submitLabel?: string
  cancelLabel?: string
  className?: string
}

/**
 * EntityFormPage — Generic layout shell for full-page form experiences.
 * Extracted from the PayslipTemplates view-state pattern.
 * Provides a sticky header, scrollable content area, and sticky footer.
 */
export function EntityFormPage({
  title,
  isReadOnly = false,
  isPending = false,
  isDirty = true,
  formId,
  children,
  onBack,
  onEdit,
  onSubmit,
  submitLabel = "Lưu",
  cancelLabel = "Huỷ bỏ",
  className,
}: EntityFormPageProps) {
  return (
    <div className={cn("flex flex-col h-full min-h-screen bg-muted/30", className)}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-background border-b border-border">
        <BackButton onBack={onBack} />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">{children}</div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-background border-t border-border">
        {isReadOnly ? (
          <>
            <Button
              key="close-btn"
              type="button"
              variant="outline"
              className="rounded-full border-border hover:bg-accent shadow-none px-8"
              onClick={onBack}
            >
              Đóng
            </Button>
            {onEdit && (
              <Button
                key="edit-btn"
                type="button"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none px-8"
                onClick={(e) => {
                  e.preventDefault()
                  onEdit()
                }}
              >
                Chỉnh sửa
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              key="cancel-btn"
              type="button"
              variant="outline"
              className="rounded-full rounded-full font-semibold border-border hover:bg-muted text-foreground shadow-xs px-8"
              onClick={onBack}
            >
              {cancelLabel}
            </Button>
            <Button
              key="save-btn"
              type={formId ? "submit" : "button"}
              form={formId}
              onClick={!formId ? onSubmit : undefined}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none px-8 font-semibold shadow-xs"
              disabled={isPending || !isDirty}
            >
              {isPending ? "Đang xử lý..." : submitLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
