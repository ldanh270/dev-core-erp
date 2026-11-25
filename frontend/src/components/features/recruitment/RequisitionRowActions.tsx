import { RejectRequisitionDialog } from "@/components/features/recruitment/reject-requisition-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  useApproveRequisition,
  useSubmitRequisitionForApproval,
} from "@/hooks/recruitment/use-recruitment-queries"
import { routerNavigate } from "@/lib/router-navigator"
import type { JobRequisition } from "@/types/recruitment.types"
import { Check, Eye, FilePlus2, Pencil, Send, X } from "lucide-react"
import { useState } from "react"

export interface RequisitionRowActionsProps {
  requisition: JobRequisition
  canCreateJd: boolean
  canSubmit: boolean
  canApprove: boolean
  canEdit: boolean
  onViewDetails: (id: string) => void
  onEdit: (req: JobRequisition) => void
}

export function RequisitionRowActions({
  requisition,
  canCreateJd,
  canSubmit,
  canApprove,
  canEdit,
  onViewDetails,
  onEdit,
}: RequisitionRowActionsProps) {
  const submit = useSubmitRequisitionForApproval()
  const approve = useApproveRequisition()
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  return (
    <>
      <div
        className="flex items-center justify-end gap-1"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted hover:text-foreground h-8 w-8"
              aria-label={`Xem chi tiết ${requisition.code}`}
              onClick={() => {
                onViewDetails(requisition.id)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết</TooltipContent>
        </Tooltip>

        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Sửa ${requisition.code}`}
                onClick={() => {
                  onEdit(requisition)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chỉnh sửa yêu cầu</TooltipContent>
          </Tooltip>
        )}

        {canSubmit && requisition.status === "draft" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Gửi duyệt ${requisition.code}`}
                onClick={() => {
                  submit.mutate(requisition.id)
                }}
                disabled={submit.isPending}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gửi phê duyệt</TooltipContent>
          </Tooltip>
        )}

        {canApprove && requisition.status === "pending_approval" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-success hover:text-success hover:bg-success/10 h-8 w-8"
                  aria-label={`Duyệt ${requisition.code}`}
                  onClick={() => {
                    approve.mutate({ id: requisition.id, data: { approved: true } })
                  }}
                  disabled={approve.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Phê duyệt yêu cầu</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  aria-label={`Từ chối ${requisition.code}`}
                  onClick={() => {
                    setIsRejectOpen(true)
                  }}
                  disabled={approve.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Từ chối yêu cầu</TooltipContent>
            </Tooltip>
          </>
        )}

        {canCreateJd && requisition.status === "approved" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:text-primary hover:bg-primary/10 h-8 w-8"
                aria-label={`Tạo JD cho ${requisition.code}`}
                onClick={() => {
                  routerNavigate(
                    `/recruitment/job-descriptions/create?requisitionId=${requisition.id}`,
                  )
                }}
              >
                <FilePlus2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tạo mô tả công việc (JD)</TooltipContent>
          </Tooltip>
        )}
      </div>

      <RejectRequisitionDialog
        requisitionCode={requisition.code}
        open={isRejectOpen}
        pending={approve.isPending}
        onOpenChange={setIsRejectOpen}
        onConfirm={(comment) => {
          approve.mutate(
            { id: requisition.id, data: { approved: false, comment } },
            {
              onSuccess: () => {
                setIsRejectOpen(false)
              },
            },
          )
        }}
      />
    </>
  )
}
