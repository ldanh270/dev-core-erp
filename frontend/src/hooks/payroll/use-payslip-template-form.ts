import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useCreatePayslipTemplate,
  useUpdatePayslipTemplate,
} from "@/hooks/payroll/use-payslip-templates"
import {
  type CreatePayslipTemplateFormData,
  createPayslipTemplateSchema,
} from "@/schemas/payroll.schema"
import type { IPayslipTemplate, ISalaryComponent } from "@/types/payroll.types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

/**
 * Custom hook managing payslip template creation and formula component selection.
 */
export interface ExtendedFormData extends CreatePayslipTemplateFormData {
  components: Array<{
    componentId: string
    overrideFormula?: string
    _name?: string
    _code?: string
    _displayName?: string
    _isDisplayed?: boolean
  }>
}

interface UsePayslipTemplateFormProps {
  initialData?: IPayslipTemplate | null
  onSuccess?: () => void
}

export function usePayslipTemplateForm({
  initialData,
  onSuccess,
}: UsePayslipTemplateFormProps) {
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreatePayslipTemplate()
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdatePayslipTemplate()
  const isPending = isCreating || isUpdating

  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<ExtendedFormData>({
    resolver: zodResolver(createPayslipTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      components:
        initialData?.components?.map((c) => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula || c.component.formula || undefined,
          _name: c.component.name,
          _displayName: c.component.name,
          _isDisplayed: true,
        })) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  })

  const existingComponentIds = fields.map((f) => f.componentId)

  const handleSelectComponents = (selectedComps: ISalaryComponent[]) => {
    selectedComps.forEach((comp) => {
      append({
        componentId: comp.id,
        overrideFormula: comp.formula,
        _name: comp.name,
        _displayName: comp.name,
        _isDisplayed: true,
      })
    })
  }

  const onSubmit = async (data: ExtendedFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        components: data.components.map((c) => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula?.trim() || undefined,
        })),
      }
      if (initialData?.id) {
        await updateTemplate({ id: initialData.id, ...payload })
        toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_PAYSLIP_TEMPLATE)
      } else {
        await createTemplate(payload)
        toast.success(PAYROLL_MESSAGES.SUCCESS.CREATE_PAYSLIP_TEMPLATE)
      }
      form.reset()
      onSuccess?.()
    } catch {
      toast.error(PAYROLL_MESSAGES.ERRORS.SAVE_PAYSLIP_TEMPLATE)
    }
  }

  return {
    form,
    fields,
    append,
    remove,
    existingComponentIds,
    handleSelectComponents,
    isModalOpen,
    setIsModalOpen,
    isPending,
    onSubmit,
  }
}
