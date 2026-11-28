import { APPLICATION_MESSAGES } from "@/config/messages/application.message"
import { type ISubmitApplicationDTO, applicationApi } from "@/lib/api/application.api"

import { useState } from "react"

import { toast } from "sonner"

const { ERRORS, SUCCESS } = APPLICATION_MESSAGES

interface UseSubmitApplicationReturn {
  isSubmitting: boolean
  submitApplication: (dto: ISubmitApplicationDTO) => Promise<boolean>
  submitBulkApplications: (forms: ISubmitApplicationDTO[]) => Promise<boolean>
}

/**
 * Handles single and bulk application submission mutations and network error alerts.
 */
export function useSubmitApplication(): UseSubmitApplicationReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitApplication = async (dto: ISubmitApplicationDTO): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await applicationApi.submit(dto)
      toast.success(SUCCESS.SUBMIT_SINGLE)
      return true
    } catch (error: unknown) {
      console.error("[submitApplication] error:", error)

      const axiosErr = error as {
        response?: {
          status?: number
          data?: { error?: { message?: string; code?: string }; message?: string }
        }
        message?: string
        code?: string
      }

      if (axiosErr.response) {
        const status = axiosErr.response.status ?? 500
        const msg =
          axiosErr.response.data?.error?.message ??
          axiosErr.response.data?.message ??
          ERRORS.SERVER_ERROR_STATUS(status)

        if (status === 401) {
          toast.error(ERRORS.SESSION_EXPIRED)
        } else {
          toast.error(msg)
        }
      } else if (axiosErr.code === "ERR_NETWORK" || axiosErr.message?.includes("Network Error")) {
        toast.error(ERRORS.SERVER_CONNECTION_FAILED)
      } else if (axiosErr.code === "ERR_CANCELED") {
        // silently ignore aborted requests
      } else {
        toast.error(axiosErr.message ?? ERRORS.SUBMIT_FAILED)
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitBulkApplications = async (forms: ISubmitApplicationDTO[]): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await applicationApi.submitBulk(forms)
      toast.success(SUCCESS.SUBMIT_BULK(forms.length))
      return true
    } catch (error: unknown) {
      console.error("[submitBulkApplications] error:", error)

      const axiosErr = error as {
        response?: {
          status?: number
          data?: { error?: { message?: string; code?: string }; message?: string }
        }
        message?: string
        code?: string
      }

      if (axiosErr.response) {
        const status = axiosErr.response.status ?? 500
        const msg =
          axiosErr.response.data?.error?.message ??
          axiosErr.response.data?.message ??
          ERRORS.SERVER_ERROR_STATUS(status)

        if (status === 401) {
          toast.error(ERRORS.SESSION_EXPIRED)
        } else {
          toast.error(msg)
        }
      } else if (axiosErr.code === "ERR_NETWORK" || axiosErr.message?.includes("Network Error")) {
        toast.error(ERRORS.SERVER_CONNECTION_FAILED)
      } else {
        toast.error(axiosErr.message ?? ERRORS.BULK_SUBMIT_FAILED)
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitApplication, submitBulkApplications }
}
