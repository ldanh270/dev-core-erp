import axios from "axios"

interface ChatApiErrorResponse {
  error?: {
    message?: string
  }
}

/**
 * Returns a server-provided chat error message when available, otherwise the caller's fallback.
 */
export const getChatApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError<ChatApiErrorResponse>(error)) return fallback
  return error.response?.data.error?.message ?? fallback
}
