import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/common"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EMPLOYEE_TYPES, EMPLOYEE_TYPE_LABELS } from "@/config/entities/employee.config"
import {
  REQUISITION_PRIORITIES,
  REQUISITION_PRIORITY,
  REQUISITION_PRIORITY_LABELS,
} from "@/config/entities/recruitment.config"
import {
  useCreateRequisition,
  useRequisitionApprovers,
  useUpdateRequisition,
} from "@/hooks/recruitment/use-recruitment-queries"
import type { CreateRequisitionDto } from "@/lib/api/recruitment.api"
import { cn } from "@/lib/utils"
import type { JobRequisition } from "@/types/recruitment.types"
import type { RecruitmentFormField } from "@/types/recruitment.types"
import { RecruitmentFormFieldEditor } from "@/components/features/recruitment/recruitment-form-field-editor"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
const optionalPositiveNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().positive().optional(),
)

const requisitionFormSchema = z
  .object({
    title: z.string().trim().min(1, "Vui lòng nhập vị trí cần tuyển").max(255),
    department: optionalText,
    positionLevel: optionalText,
    employmentType: z.enum(EMPLOYEE_TYPES),
    headcount: z.coerce.number().int().positive("Số lượng phải lớn hơn 0"),
    priority: z.enum(REQUISITION_PRIORITIES),
    salaryMin: optionalPositiveNumber,
    salaryMax: optionalPositiveNumber,
    reason: optionalText,
    targetHireDate: optionalText,
    targetCloseDate: optionalText,
    approverId: z.string().min(1, "Vui lòng chọn người duyệt"),
  })
  .refine(({ salaryMin, salaryMax }) => !salaryMin || !salaryMax || salaryMin <= salaryMax, {
    message: "Lương tối thiểu không được lớn hơn lương tối đa",
    path: ["salaryMax"],
  })

type RequisitionFormValues = z.input<typeof requisitionFormSchema>

interface CreateRequisitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition?: JobRequisition | null
}

const defaultValues: RequisitionFormValues = {
  title: "",
  department: "",
  positionLevel: "",
  employmentType: EMPLOYEE_TYPES[0],
  headcount: 1,
  priority: REQUISITION_PRIORITY.MEDIUM,
  salaryMin: undefined,
  salaryMax: undefined,
  reason: "",
  targetHireDate: "",
  targetCloseDate: "",
  approverId: "",
}
const defaultCandidateSchema: RecruitmentFormField[] = [
  { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
  { key: "email", label: "Email", type: "short_text", required: true },
  { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
  { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
]

const isEmployeeType = (value: string): value is RequisitionFormValues["employmentType"] =>
  (EMPLOYEE_TYPES as readonly string[]).includes(value)

const isRequisitionPriority = (value: string): value is RequisitionFormValues["priority"] =>
  (REQUISITION_PRIORITIES as readonly string[]).includes(value)

export function CreateRequisitionDialog({
  open,
  onOpenChange,
  requisition,
}: CreateRequisitionDialogProps) {
  const createRequisition = useCreateRequisition()
  const updateRequisition = useUpdateRequisition()
  const { data: approvers = [], isLoading: isLoadingApprovers } = useRequisitionApprovers()
  const [candidateSchema, setCandidateSchema] = useState<RecruitmentFormField[]>(defaultCandidateSchema)
  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  })
  const [employmentType, priority, approverId] = useWatch({
    control: form.control,
    name: ["employmentType", "priority", "approverId"],
  })

  useEffect(() => {
    if (open) {
      if (requisition) {
        setCandidateSchema(
          requisition.candidateFields?.length
            ? requisition.candidateFields.map(({ key, label, type, required }) => ({ key, label, type, required }))
            : defaultCandidateSchema,
        )
        form.reset({
          title: requisition.title,
          department: requisition.department ?? "",
          positionLevel: requisition.positionLevel ?? "",
          employmentType: isEmployeeType(requisition.employmentType)
            ? requisition.employmentType
            : defaultValues.employmentType,
          headcount: requisition.headcount,
          priority: isRequisitionPriority(requisition.priority)
            ? requisition.priority
            : defaultValues.priority,
          salaryMin: requisition.salaryMin ?? undefined,
          salaryMax: requisition.salaryMax ?? undefined,
          reason: requisition.reason ?? "",
          targetHireDate: requisition.targetHireDate
            ? new Date(requisition.targetHireDate).toISOString().split("T")[0]
            : "",
          targetCloseDate: requisition.targetCloseDate
            ? new Date(requisition.targetCloseDate).toISOString().split("T")[0]
            : "",
          approverId: requisition.approverId ?? "",
        })
      } else {
        form.reset(defaultValues)
        setCandidateSchema(defaultCandidateSchema.map((field) => ({ ...field })))
      }
    }
  }, [form, open, requisition])

  const close = () => { onOpenChange(false); }

  const onSubmit = (values: RequisitionFormValues) => {
    const parsed = requisitionFormSchema.parse(values)
    const payload: CreateRequisitionDto = {
      ...parsed,
      candidateSchema,
      targetHireDate: parsed.targetHireDate
        ? new Date(parsed.targetHireDate).toISOString()
        : undefined,
      targetCloseDate: parsed.targetCloseDate
        ? new Date(parsed.targetCloseDate).toISOString()
        : undefined,
    }

    if (requisition) {
      updateRequisition.mutate({ id: requisition.id, data: payload }, { onSuccess: close })
    } else {
      createRequisition.mutate(payload, { onSuccess: close })
    }
  }

  const errors = form.formState.errors
  const isEdit = Boolean(requisition)
  const isPending = createRequisition.isPending || updateRequisition.isPending

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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vị trí cần tuyển" required error={errors.title?.message} className="sm:col-span-2">
              <Input placeholder="Ví dụ: Frontend Developer" {...form.register("title")} />
            </Field>
            <Field label="Loại hình làm việc" required error={errors.employmentType?.message}>
              <Select
                value={employmentType}
                onValueChange={(value) =>
                  form.setValue(
                    "employmentType",
                    value as RequisitionFormValues["employmentType"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {new Map(Object.entries(EMPLOYEE_TYPE_LABELS)).get(type) || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Số lượng" required error={errors.headcount?.message}>
              <Input
                type="number"
                inputMode="numeric"
                aria-invalid={Boolean(errors.headcount)}
                className={cn(
                  errors.headcount && "border-destructive focus-visible:ring-destructive",
                )}
                {...form.register("headcount")}
              />
            </Field>
            <Field label="Phòng ban" error={errors.department?.message}>
              <Input placeholder="Ví dụ: Công nghệ" {...form.register("department")} />
            </Field>
            <Field label="Cấp bậc" error={errors.positionLevel?.message}>
              <Input placeholder="Ví dụ: Junior, Senior" {...form.register("positionLevel")} />
            </Field>
            <Field label="Mức lương tối thiểu" error={errors.salaryMin?.message}>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="VND"
                aria-invalid={Boolean(errors.salaryMin)}
                className={cn(
                  errors.salaryMin && "border-destructive focus-visible:ring-destructive",
                )}
                {...form.register("salaryMin")}
              />
            </Field>
            <Field label="Mức lương tối đa" error={errors.salaryMax?.message}>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="VND"
                aria-invalid={Boolean(errors.salaryMax)}
                className={cn(
                  errors.salaryMax && "border-destructive focus-visible:ring-destructive",
                )}
                {...form.register("salaryMax")}
              />
            </Field>
            <Field label="Ưu tiên" required error={errors.priority?.message}>
              <Select
                value={priority}
                onValueChange={(value) =>
                  form.setValue("priority", value as RequisitionFormValues["priority"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUISITION_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {REQUISITION_PRIORITY_LABELS[priority as keyof typeof REQUISITION_PRIORITY_LABELS] ?? priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Người duyệt" required error={errors.approverId?.message}>
              {isLoadingApprovers ? (
                <Skeleton className="h-10 w-full rounded-full" />
              ) : (
                <Select
                  value={approverId}
                  onValueChange={(value) =>
                    form.setValue("approverId", value, { shouldValidate: true })
                  }
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
            </Field>
            <Field label="Ngày dự kiến tuyển" error={errors.targetHireDate?.message}>
              <DatePicker
                value={form.watch("targetHireDate") || null}
                size="sm"
                onChange={(val) => {
                  form.setValue("targetHireDate", val || "", { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Field>
            <Field label="Ngày dự kiến đóng" error={errors.targetCloseDate?.message}>
              <DatePicker
                value={form.watch("targetCloseDate") || null}
                size="sm"
                onChange={(val) => {
                  form.setValue("targetCloseDate", val || "", { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Field>
            <Field
              label="Lý do tuyển dụng"
              error={errors.reason?.message}
              className="sm:col-span-2"
            >
              <Textarea
                placeholder="Bổ sung nhân sự, thay thế, mở rộng đội ngũ..."
                {...form.register("reason")}
              />
            </Field>
          </div>
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

function Field({
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
      <Label>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
