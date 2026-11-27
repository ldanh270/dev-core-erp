import {
  COMPONENT_TYPE,
  COMPONENT_VALUE_TYPE,
  FORMULA_VALIDATION_STATUS,
  type FormulaValidationStatus,
  SALARY_COMPONENT_TYPES,
  SALARY_COMPONENT_VALUE_TYPES,
} from "@/config/entities/payroll.config"
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
} from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useEffect, useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, PAYROLL_MESSAGES.VALIDATION.COMPONENT_NAME_MIN),
  type: z.enum(SALARY_COMPONENT_TYPES),
  valueType: z.enum(SALARY_COMPONENT_VALUE_TYPES),
  formula: z.string().min(1, PAYROLL_MESSAGES.VALIDATION.COMPONENT_FORMULA_REQUIRED),
  description: z.string().optional(),
})

/**
 * Custom hook managing salary component creation and formula configuration state.
 */
export type SalaryComponentFormValues = z.infer<typeof formSchema>

interface UseSalaryComponentFormProps {
  initialData?: ISalaryComponent | null
  onSuccess?: () => void
}

export function useSalaryComponentForm({
  initialData,
  onSuccess,
}: UseSalaryComponentFormProps = {}) {
  const form = useForm<SalaryComponentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      type: COMPONENT_TYPE.ADDITION,
      valueType: COMPONENT_VALUE_TYPE.CURRENCY,
      formula: "",
      description: "",
    },
  })

  const { reset, control, setValue, getValues } = form
  const formulaValue = useWatch({ control, name: "formula" })
  const nameValue = useWatch({ control, name: "name" })

  const [debouncedFormula, setDebouncedFormula] = useState("")

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedFormula(formulaValue || "")
      },
      formulaValue ? 500 : 0,
    )

    return () => {
      clearTimeout(timer)
    }
  }, [formulaValue])

  // Derive formula validation status
  const formulaStatus = useMemo((): FormulaValidationStatus => {
    if (!formulaValue) return FORMULA_VALIDATION_STATUS.IDLE
    if (formulaValue !== debouncedFormula) return FORMULA_VALIDATION_STATUS.VALIDATING
    try {
      const f = debouncedFormula.trim()
      if (!f) return FORMULA_VALIDATION_STATUS.INVALID

      let open = 0
      for (const char of f) {
        if (char === "(") open++
        if (char === ")") open--
        if (open < 0) return FORMULA_VALIDATION_STATUS.INVALID
      }
      if (open !== 0) return FORMULA_VALIDATION_STATUS.INVALID

      if (/[+\-*/]{2,}/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID
      if (/\(\)/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID
      if (/^[/*]/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID
      if (/[+\-*/]$/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID
      if (/[+\-*/]\)/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID
      if (/\([/*]/.test(f)) return FORMULA_VALIDATION_STATUS.INVALID

      return FORMULA_VALIDATION_STATUS.VALID
    } catch {
      return FORMULA_VALIDATION_STATUS.INVALID
    }
  }, [formulaValue, debouncedFormula])

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code || "",
        name: initialData.name,
        type: initialData.type,
        valueType: initialData.valueType || COMPONENT_VALUE_TYPE.CURRENCY,
        formula: initialData.formula,
        description: initialData.description || "",
      })
    } else {
      reset({
        code: "",
        name: "",
        type: COMPONENT_TYPE.ADDITION,
        valueType: COMPONENT_VALUE_TYPE.CURRENCY,
        formula: "",
        description: "",
      })
    }
  }, [initialData, reset])

  const createMutation = useCreateSalaryComponent()
  const updateMutation = useUpdateSalaryComponent()

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: SalaryComponentFormValues) => {
    try {
      if (initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, ...values })
        toast.success(PAYROLL_MESSAGES.SUCCESS.UPDATE_SALARY_COMPONENT)
      } else {
        await createMutation.mutateAsync({ ...values, isActive: true })
        toast.success(PAYROLL_MESSAGES.SUCCESS.CREATE_SALARY_COMPONENT)
      }
      onSuccess?.()
    } catch {
      toast.error(PAYROLL_MESSAGES.ERRORS.SAVE_SALARY_COMPONENT)
    }
  }

  // Helper to generate code from name if empty
  const handleAutoGenerateCode = () => {
    if (nameValue && !getValues("code")) {
      const generatedCode = nameValue
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join("")
      setValue("code", generatedCode, { shouldValidate: true })
    }
  }

  // Insert a variable into the formula at current cursor or end
  const appendToFormula = (variableCode: string) => {
    const current = getValues("formula") || ""
    // Simple append for now, can be upgraded to insert at cursor position via ref if needed
    const separator = current && !current.endsWith(" ") ? " " : ""
    setValue("formula", `${current}${separator}${variableCode}`, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  return {
    form,
    isPending,
    formulaStatus,
    onSubmit: form.handleSubmit(onSubmit),
    handleAutoGenerateCode,
    appendToFormula,
  }
}
