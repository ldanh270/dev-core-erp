import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"

import { zodResolver } from "@hookform/resolvers/zod"
import { type UseFormReturn, useForm } from "react-hook-form"
import { z } from "zod"

import { useCreateSalaryVariable, useUpdateSalaryVariable } from "./use-salary-variable"
import type { ISalaryVariable } from "./use-salary-variable"

const formSchema = z.object({
  code: z
    .string()
    .min(1, PAYROLL_MESSAGES.VALIDATION.VARIABLE_CODE_REQUIRED)
    .max(50)
    .regex(/^[a-z][a-zA-Z0-9]*$/, PAYROLL_MESSAGES.VALIDATION.VARIABLE_CODE_FORMAT),
  name: z.string().min(1, PAYROLL_MESSAGES.VALIDATION.VARIABLE_NAME_REQUIRED).max(100),
  value: z.number().min(0, PAYROLL_MESSAGES.VALIDATION.VARIABLE_VALUE_MIN),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

/**
 * Custom hook managing salary variable form state, validation, and submission.
 */
export type SalaryVariableFormValues = z.infer<typeof formSchema>

interface UseSalaryVariableFormProps {
  initialData?: ISalaryVariable | null
  onSuccess?: () => void
}

/** Custom hook managing salary variable form state, validation, and submission. */
export function useSalaryVariableForm({ initialData, onSuccess }: UseSalaryVariableFormProps): {
  form: UseFormReturn<SalaryVariableFormValues>
  isPending: boolean
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  handleFormatCode: (value: string) => void
} {
  const createMutation = useCreateSalaryVariable()
  const updateMutation = useUpdateSalaryVariable()

  const form = useForm<SalaryVariableFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          value: initialData.value,
          description: initialData.description || "",
          isActive: initialData.isActive,
        }
      : {
          code: "",
          name: "",
          value: 0,
          description: "",
          isActive: true,
        },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: SalaryVariableFormValues) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          payload: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      onSuccess?.()
    } catch {
      // Errors are handled inside the mutation hooks (via toast)
    }
  }

  const handleFormatCode = (value: string) => {
    // Basic camelCase formatting: remove spaces/underscores, capitalize next letter
    const formatted = value
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^[A-Z]/, (c) => c.toLowerCase())

    form.setValue("code", formatted, { shouldValidate: true, shouldDirty: true })
  }

  return {
    form,
    isPending,
    onSubmit: form.handleSubmit(onSubmit),
    handleFormatCode,
  }
}
