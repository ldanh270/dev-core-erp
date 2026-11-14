import { type ISubmitApplicationDTO, applicationApi } from "@/lib/api/application.api"

import { useState } from "react"

import { toast } from "sonner"

interface UseSubmitApplicationReturn {
  isSubmitting: boolean
  submitApplication: (dto: ISubmitApplicationDTO) => Promise<boolean>
  submitBulkApplications: (forms: ISubmitApplicationDTO[]) => Promise<boolean>
}

export function useSubmitApplication(): UseSubmitApplicationReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitApplication = async (dto: ISubmitApplicationDTO): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await applicationApi.submit(dto)
      toast.success("Đơn đã được gửi thành công!")
      return true
    } catch (error: unknown) {
      // Log full error to console for debugging
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
        // Got a response from server — show specific message
        // Auth middleware uses { status, message } shape
        // Controllers use { data, error: { message } } shape
        const status = axiosErr.response.status
        const msg =
          axiosErr.response.data?.error?.message ?? // controller errors
          axiosErr.response.data?.message ?? // auth middleware errors
          `Lỗi server (${status})`

        if (status === 401) {
          toast.error(`Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.`)
        } else {
          toast.error(msg)
        }
      } else if (axiosErr.code === "ERR_NETWORK" || axiosErr.message?.includes("Network Error")) {
        toast.error("Không thể kết nối server. Vui lòng kiểm tra backend đang chạy.")
      } else if (axiosErr.code === "ERR_CANCELED") {
        // silently ignore aborted requests
      } else {
        toast.error(axiosErr.message ?? "Lỗi không xác định khi gửi đơn")
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
      toast.success(`Đã gửi thành công ${forms.length} đơn!`)
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
        const status = axiosErr.response.status
        const msg =
          axiosErr.response.data?.error?.message ??
          axiosErr.response.data?.message ??
          `Lỗi server (${status})`

        if (status === 401) {
          toast.error(`Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.`)
        } else {
          toast.error(msg)
        }
      } else if (axiosErr.code === "ERR_NETWORK" || axiosErr.message?.includes("Network Error")) {
        toast.error("Không thể kết nối server. Vui lòng kiểm tra backend đang chạy.")
      } else {
        toast.error(axiosErr.message ?? "Lỗi không xác định khi gửi nhiều đơn")
      }

      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, submitApplication, submitBulkApplications }
}
