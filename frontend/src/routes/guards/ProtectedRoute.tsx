import { AuthorizationUnavailable } from "@/components/auth/authorization-unavailable"
import { API_ENDPOINTS } from "@/config/api.config"
import { AUTHORIZATION_STATUS } from "@/config/entities/auth.config"
import { ROUTES } from "@/config/routes.config"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"
import axios from "axios"
import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
}

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 * Redirects to /personal (or schedule) if user does not have required roles/permissions
 */
export const ProtectedRoute = ({
  children,
  requiredPermissions,
  requiredRoles,
}: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const authorizationStatus = useAuthStore((state) => state.authorizationStatus)
  const beginAuthorization = useAuthStore((state) => state.beginAuthorization)
  const failAuthorization = useAuthStore((state) => state.failAuthorization)
  const retryAuthorization = useAuthStore((state) => state.retryAuthorization)

  useEffect(() => {
    if (authorizationStatus !== AUTHORIZATION_STATUS.IDLE) return
    beginAuthorization()

    // Refresh persisted authorization before any route guard trusts cached roles or permissions.
    void apiClient
      .get(API_ENDPOINTS.AUTH.ME)
      .then((res) => {
        setAuth(res.data.data.employee)
      })
      .catch((error: unknown) => {
        const status = axios.isAxiosError(error) ? error.response?.status : null
        // Only confirmed rejection expires identity; outages remain retryable and fail closed.
        if (status === 401 || status === 403) {
          clearAuth()
          return
        }
        failAuthorization()
      })
  }, [authorizationStatus, beginAuthorization, clearAuth, failAuthorization, setAuth])

  if (authorizationStatus === AUTHORIZATION_STATUS.ERROR) {
    return <AuthorizationUnavailable onRetry={retryAuthorization} />
  }

  if (authorizationStatus !== AUTHORIZATION_STATUS.READY) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  }

  if (requiredPermissions && user) {
    const hasPermission = requiredPermissions.every((p) => user.permissions?.includes(p))
    if (!hasPermission) {
      return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
    }
  }

  if (requiredRoles && user) {
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role))
    if (!hasRole) {
      return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
    }
  }

  return <>{children}</>
}
