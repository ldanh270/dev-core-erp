import { SYSTEM_CONFIG } from "@/config/system.config"
import { useSubmitApplication } from "@/hooks/application/useSubmitApplication"
import { type IApprover, employeeApi } from "@/lib/api/employee.api"
import type { Employee } from "@/types/employee.types"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  type ApplicationFormState,
  combineDateAndTime,
  getInitialFormState,
} from "./application-form.types"
import { buildApplicationPayload } from "./build-application-payload.util"
import { validateApplicationForms } from "./validate-application-forms.util"

export type { ApplicationFormState }
export { getInitialFormState, combineDateAndTime }

/** Manages application creation state, validation, and submission. */
export function useCreateApplicationForm(type: string) {
  const navigate = useNavigate()
  const { isSubmitting, submitApplication, submitBulkApplications } = useSubmitApplication()

  const [assignedToId, setAssignedToId] = useState("")
  const [forms, setForms] = useState<ApplicationFormState[]>([getInitialFormState()])

  const [approvers, setApprovers] = useState<IApprover[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    employeeApi
      .getApprovers()
      .then(setApprovers)
      .catch(() => {})
    employeeApi
      .list({ limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT })
      .then((res) => {
        setEmployees(res.data)
      })
      .catch(() => {})
  }, [])

  const addForm = () => {
    setForms((prev) => [...prev, getInitialFormState()])
  }

  const removeForm = (index: number) => {
    setForms((prev) => prev.filter((_, i) => i !== index))
  }

  const updateForm = <K extends keyof ApplicationFormState>(
    index: number,
    k: K,
    v: ApplicationFormState[K],
  ) => {
    setForms((prev) => prev.map((f, i) => (i === index ? { ...f, [k]: v } : f)))
  }

  /** Validates every application item and submits a single or bulk payload. */
  const handleSubmit = async () => {
    if (!validateApplicationForms(forms, type, assignedToId)) {
      return
    }

    try {
      const payload = buildApplicationPayload(forms, type, assignedToId)

      let success = false
      if (payload.length === 1) {
        success = await submitApplication(payload[0] as Parameters<typeof submitApplication>[0])
      } else {
        success = await submitBulkApplications(
          payload as Parameters<typeof submitBulkApplications>[0],
        )
      }

      if (success) {
        navigate(-1)
      }
    } catch {
      // isSubmitting handles the toast
    }
  }

  return {
    forms,
    assignedToId,
    setAssignedToId,
    addForm,
    removeForm,
    updateForm,
    approvers,
    employees,
    isSubmitting,
    handleSubmit,
  }
}
