import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"

import { Loader2 } from "lucide-react"

interface FormActionFooterProps {
  onCancel: () => void
  submitLabel: string
  isPending: boolean
}

/**
 * Shared footer component for dialog forms to maintain consistency
 * and reduce code duplication as suggested by Codacy.
 */
export function FormActionFooter({ onCancel, submitLabel, isPending }: FormActionFooterProps) {
  return (
    <DialogFooter className="mt-4">
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={() => {
          onCancel()
        }}
      >
        Hủy bỏ
      </Button>
      <Button
        type="submit"
        className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-md"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </DialogFooter>
  )
}
