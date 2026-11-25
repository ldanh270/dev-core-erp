import { DatePicker } from "@/components/common"
import { RecruitmentFormFieldEditor } from "@/components/features/recruitment/recruitment-form-field-editor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { EMPLOYEE_TYPES, EMPLOYEE_TYPE_LABELS } from "@/config/entities/employee.config"
import {
  REQUISITION_PRIORITIES,
  REQUISITION_PRIORITY_LABELS,
} from "@/config/entities/recruitment.config"
import { useRequisitionForm } from "@/hooks/recruitment/use-requisition-form"
import type { RequisitionApprover } from "@/lib/api/recruitment.api"
import { cn } from "@/lib/utils"
import type { RequisitionFormValues } from "@/schemas/recruitment.schema"
import type { JobRequisition } from "@/types/recruitment.types"
import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"

const EMPLOYEE_TYPE_MAP = new Map(Object.entries(EMPLOYEE_TYPE_LABELS))
const PRIORITY_LABEL_MAP = new Map(Object.entries(REQUISITION_PRIORITY_LABELS))

function RequisitionFieldWrapper({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function RequisitionApproverField({
  form,
  approverId,
  approvers,
  isLoadingApprovers,
}: {
  form: UseFormReturn<RequisitionFormValues>
  approverId?: string
  approvers: RequisitionApprover[]
  isLoadingApprovers: boolean
}) {
  const error = form.formState.errors.approverId?.message

  return (
    <RequisitionFieldWrapper label="Người duyệt" required error={error}>
      {isLoadingApprovers ? (
        <Skeleton className="h-10 w-full rounded-full" />
      ) : (
        <Select
          value={approverId}
          onValueChange={(value) => {
            form.setValue("approverId", value, { shouldValidate: true })
          }}
          disabled={approvers.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn người có quyền duyệt" />
          </SelectTrigger>
          <SelectContent>
            {approvers.map((approver) => (
              <SelectItem key={approver.id} value={approver.id}>
                {approver.fullName}
                {approver.position ? ` — ${approver.position}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {!isLoadingApprovers && approvers.length === 0 && (
        <p className="text-sm text-destructive">
          Chưa có nhân viên nào được cấp quyền recruitment.requisition.approve.
        </p>
      )}
    </RequisitionFieldWrapper>
  )
}

function RequisitionFormFields({
  form,
  employmentType,
  priority,
  approverId,
  targetHireDate,
  targetCloseDate,
  approvers,
  isLoadingApprovers,
}: {
  form: UseFormReturn<RequisitionFormValues>
  employmentType?: string
  priority?: string
  approverId?: string
  targetHireDate?: string
  targetCloseDate?: string
  approvers: RequisitionApprover[]
  isLoadingApprovers: boolean
}) {
  const errors = form.formState.errors

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <RequisitionFieldWrapper
        label="Vị trí cần tuyển"
        required
        error={errors.title?.message}
        className="sm:col-span-2"
      >
        <Input placeholder="Ví dụ: Frontend Developer" {...form.register("title")} />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper
        label="Loại hình làm việc"
        required
        error={errors.employmentType?.message}
      >
        <Select
          value={employmentType}
          onValueChange={(value) => {
            form.setValue("employmentType", value as RequisitionFormValues["employmentType"], {
              shouldValidate: true,
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EMPLOYEE_TYPE_MAP.get(type) || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Số lượng" required error={errors.headcount?.message}>
        <Input
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(errors.headcount)}
          className={cn(errors.headcount && "border-destructive focus-visible:ring-destructive")}
          {...form.register("headcount")}
        />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Phòng ban" error={errors.department?.message}>
        <Input placeholder="Ví dụ: Công nghệ" {...form.register("department")} />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Cấp bậc" error={errors.positionLevel?.message}>
        <Input placeholder="Ví dụ: Junior, Senior" {...form.register("positionLevel")} />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Mức lương tối thiểu" error={errors.salaryMin?.message}>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="VND"
          aria-invalid={Boolean(errors.salaryMin)}
          className={cn(errors.salaryMin && "border-destructive focus-visible:ring-destructive")}
          {...form.register("salaryMin")}
        />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Mức lương tối đa" error={errors.salaryMax?.message}>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="VND"
          aria-invalid={Boolean(errors.salaryMax)}
          className={cn(errors.salaryMax && "border-destructive focus-visible:ring-destructive")}
          {...form.register("salaryMax")}
        />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Ưu tiên" required error={errors.priority?.message}>
        <Select
          value={priority}
          onValueChange={(value) => {
            form.setValue("priority", value as RequisitionFormValues["priority"], {
              shouldValidate: true,
            })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUISITION_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL_MAP.get(p) ?? p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RequisitionFieldWrapper>

      <RequisitionApproverField
        form={form}
        approverId={approverId}
        approvers={approvers}
        isLoadingApprovers={isLoadingApprovers}
      />

      <RequisitionFieldWrapper label="Ngày dự kiến tuyển" error={errors.targetHireDate?.message}>
        <DatePicker
          value={targetHireDate || null}
          size="sm"
          onChange={(val) => {
            form.setValue("targetHireDate", val || "", {
              shouldValidate: true,
              shouldDirty: true,
            })
          }}
        />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper label="Ngày dự kiến đóng" error={errors.targetCloseDate?.message}>
        <DatePicker
          value={targetCloseDate || null}
          size="sm"
          onChange={(val) => {
            form.setValue("targetCloseDate", val || "", {
              shouldValidate: true,
              shouldDirty: true,
            })
          }}
        />
      </RequisitionFieldWrapper>

      <RequisitionFieldWrapper
        label="Lý do tuyển dụng"
        error={errors.reason?.message}
        className="sm:col-span-2"
      >
        <Textarea
          placeholder="Bổ sung nhân sự, thay thế, mở rộng đội ngũ..."
          {...form.register("reason")}
        />
      </RequisitionFieldWrapper>
    </div>
  )
}

export interface CreateRequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition?: JobRequisition | null
}

export function CreateRequisitionDialog({
  open,
  onOpenChange,
  requisition,
}: CreateRequisitionDialogProps) {
  const {
    form,
    employmentType,
    priority,
    approverId,
    targetHireDate,
    targetCloseDate,
    candidateSchema,
    setCandidateSchema,
    approvers,
    isLoadingApprovers,
    isEdit,
    isPending,
    close,
    onSubmit,
  } = useRequisitionForm({ open, onOpenChange, requisition })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-xl">
        <form className="grid gap-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "Chỉnh sửa yêu cầu tuyển dụng" : "Tạo yêu cầu tuyển dụng"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Chỉnh sửa các trường của yêu cầu tuyển dụng."
                : "Tạo bản nháp để gửi duyệt trước khi đăng tuyển."}
            </DialogDescription>
          </DialogHeader>

          <RequisitionFormFields
            form={form}
            employmentType={employmentType}
            priority={priority}
            approverId={approverId}
            targetHireDate={targetHireDate}
            targetCloseDate={targetCloseDate}
            approvers={approvers}
            isLoadingApprovers={isLoadingApprovers}
          />

          <div className="border-t border-border pt-5">
            <RecruitmentFormFieldEditor fields={candidateSchema} onChange={setCandidateSchema} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Đang lưu..."
                  : "Đang tạo..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
