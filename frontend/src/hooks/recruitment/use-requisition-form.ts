import {
  useCreateRequisition,
  useRequisitionApprovers,
  useUpdateRequisition,
} from "@/hooks/recruitment/use-recruitment-queries"
import type { CreateRequisitionDto } from "@/lib/api/recruitment.api"
import {
  defaultCandidateSchema,
  defaultRequisitionValues,
  isEmployeeType,
  isRequisitionPriority,
  requisitionFormSchema,
  type RequisitionFormValues,
} from "@/schemas/recruitment.schema"
import type { JobRequisition, RecruitmentFormField } from "@/types/recruitment.types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

interface UseRequisitionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition?: JobRequisition | null
}

export function useRequisitionForm({
  open,
  onOpenChange,
  requisition,
}: UseRequisitionFormProps) {
  const createRequisition = useCreateRequisition()
  const updateRequisition = useUpdateRequisition()
  const { data: approvers = [], isLoading: isLoadingApprovers } = useRequisitionApprovers()
  const [candidateSchema, setCandidateSchema] =
    useState<RecruitmentFormField[]>(defaultCandidateSchema)

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues: defaultRequisitionValues,
    mode: "onChange",
    reValidateMode: "onChange",
  })

  const [employmentType, priority, approverId, targetHireDate, targetCloseDate] = useWatch({
    control: form.control,
    name: ["employmentType", "priority", "approverId", "targetHireDate", "targetCloseDate"],
  })

  useEffect(() => {
    if (open) {
      if (requisition) {
        setCandidateSchema(
          requisition.candidateFields?.length
            ? requisition.candidateFields.map(({ key, label, type, required }) => ({
                key,
                label,
                type,
                required,
              }))
            : defaultCandidateSchema,
        )
        form.reset({
          title: requisition.title,
          department: requisition.department ?? "",
          positionLevel: requisition.positionLevel ?? "",
          employmentType: isEmployeeType(requisition.employmentType)
            ? requisition.employmentType
            : defaultRequisitionValues.employmentType,
          headcount: requisition.headcount,
          priority: isRequisitionPriority(requisition.priority)
            ? requisition.priority
            : defaultRequisitionValues.priority,
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
        form.reset(defaultRequisitionValues)
        setCandidateSchema(defaultCandidateSchema.map((field) => ({ ...field })))
      }
    }
  }, [form, open, requisition])

  const close = () => {
    onOpenChange(false)
  }

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

  const isEdit = Boolean(requisition)
  const isPending = createRequisition.isPending || updateRequisition.isPending

  return {
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
  }
}
