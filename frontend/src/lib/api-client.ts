import { API_BASE_URL } from "@/config/api.config"
import { AUTH_MESSAGES } from "@/config/messages/auth.message"
import { ROUTES } from "@/config/routes.config"
import { routerNavigate } from "@/lib/router-navigator"
import { useAuthStore } from "@/store/auth-store"

import axios from "axios"
import { toast } from "sonner"

/**
 * Axios instance for API calls
 * Configured with base URL and standard headers
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> =
  []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

/**
 * Public auth endpoints that must propagate their own 401 to the caller.
 * Auto-refresh on these would swallow the real error (e.g. "Invalid username or password").
 */
const PUBLIC_AUTH_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/validate-reset-token",
  "/auth/reset-password",
]

const isPublicAuthPath = (url?: string): boolean => {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((path) => url === path || url.startsWith(`${path}?`))
}

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Response interceptor to handle global errors and token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Không handle nếu: không phải 401, là public auth path, hoặc đã retry rồi
    if (
      error.response?.status !== 401 ||
      isPublicAuthPath(originalRequest?.url) ||
      originalRequest?._retry
    ) {
      return Promise.reject(error)
    }

    // Nếu đang refresh, đẩy request vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => {
          originalRequest._retry = true // mark trước khi retry
          return apiClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    // Đánh dấu đã retry để tránh vòng lặp vô hạn
    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshResponse = await apiClient.post("/auth/refresh")
      const refreshedToken = refreshResponse.data?.data?.accessToken
      const refreshedEmployee = refreshResponse.data?.data?.employee
      if (refreshedToken && refreshedEmployee) {
        useAuthStore.getState().setAuth(refreshedEmployee, refreshedToken)
      }
      processQueue(null)
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)

      const refreshStatus = axios.isAxiosError(refreshError) ? refreshError.response?.status : null
      const sessionExpired = refreshStatus === 401 || refreshStatus === 403

      // Preserve identity for transient network/5xx failures; protected routes fail closed and offer retry.
      const isAuthenticated = useAuthStore.getState().isAuthenticated
      if (sessionExpired && isAuthenticated) {
        useAuthStore.getState().clearAuth()
        localStorage.removeItem("auth-storage")
        toast.error(AUTH_MESSAGES.SESSION_EXPIRED)
        routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
