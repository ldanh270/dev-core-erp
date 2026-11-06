/* eslint-disable react-refresh/only-export-components */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { ReactNode } from "react"
import { createContext, useContext, useState } from "react"

import { AlertTriangle, HelpCircle } from "lucide-react"

interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  icon?: ReactNode
}

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({})
  const [resolveRef, setResolveRef] = useState<{ resolve: (value: boolean) => void } | null>(null)

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolveRef({ resolve })
      setIsOpen(true)
    })
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef?.resolve(false)
  }

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef?.resolve(true)
  }

  const isDestructive = options.variant === "destructive"

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel()
          }
        }}
      >
        <AlertDialogContent
          size="default"
          className="sm:max-w-md rounded-2xl border border-border/40 p-5 gap-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] bg-background"
        >
          <AlertDialogHeader className="sm:grid-cols-[auto_1fr] sm:gap-x-4 sm:place-items-start sm:text-left">
            <AlertDialogMedia
              className={
                isDestructive
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 size-11 mb-0 sm:row-span-2 rounded-xl shrink-0"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 size-11 mb-0 sm:row-span-2 rounded-xl shrink-0"
              }
            >
              {options.icon ||
                (isDestructive ? (
                  <AlertTriangle size={20} strokeWidth={2} />
                ) : (
                  <HelpCircle size={20} strokeWidth={2} />
                ))}
            </AlertDialogMedia>
            <AlertDialogTitle className="text-base font-semibold tracking-tight text-foreground sm:col-start-2">
              {options.title || "Xác nhận hành động"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed sm:col-start-2">
              {options.description || "Bạn có chắc chắn muốn thực hiện hành động này?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-end gap-2 border-t border-border/30 pt-3">
            <AlertDialogCancel
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 px-4 text-xs font-medium rounded-full"
            >
              {options.cancelText || "Hủy bỏ"}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={options.variant || "default"}
              size="sm"
              onClick={handleConfirm}
              className="h-8 px-4 text-xs font-medium rounded-full"
            >
              {options.confirmText || "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}
