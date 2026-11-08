import { RejectDialog } from "./RejectDialog"
import { SubmitApplicationModal } from "./SubmitApplicationModal"
import type { IApplication } from "@/lib/api/application.api"

export interface ApplicationModalsProps {
  showSubmitModal: boolean
  onCloseSubmit: () => void
  onSuccessSubmit: () => void
  rejectTarget: IApplication | null
  onCloseReject: () => void
  onConfirmReject: (reason: string) => void
  isRejectProcessing: boolean
  swapConfirmTarget: IApplication | null
  onCloseSwapReject: () => void
  onConfirmSwapReject: (reason: string) => void
  isSwapRejectProcessing: boolean
}

/** Mounts modals and dialogs needed across application dashboard views. */
export function ApplicationModals({
  showSubmitModal,
  onCloseSubmit,
  onSuccessSubmit,
  rejectTarget,
  onCloseReject,
  onConfirmReject,
  isRejectProcessing,
  swapConfirmTarget,
  onCloseSwapReject,
  onConfirmSwapReject,
  isSwapRejectProcessing,
}: ApplicationModalsProps) {
  return (
    <>
      {showSubmitModal && (
        <SubmitApplicationModal
          onClose={onCloseSubmit}
          onSuccess={onSuccessSubmit}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          app={rejectTarget}
          onCancel={onCloseReject}
          onConfirm={onConfirmReject}
          isLoading={isRejectProcessing}
        />
      )}
      {swapConfirmTarget && (
        <RejectDialog
          app={swapConfirmTarget}
          onCancel={onCloseSwapReject}
          onConfirm={onConfirmSwapReject}
          isLoading={isSwapRejectProcessing}
          title="Không duyệt đổi ca"
          description="Bạn có chắc chắn muốn không duyệt đổi ca này không?"
          optionalReason={true}
        />
      )}
    </>
  )
}
