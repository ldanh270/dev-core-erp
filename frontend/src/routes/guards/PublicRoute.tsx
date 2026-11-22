import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"
import axios from "axios"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

interface PublicRouteProps {
  children: ReactNode
}

/**
 * PublicRoute component (guest-only: e.g. login, reset password).
 * Validates active session and redirects authenticated users to their schedule dashboard.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isCheckingSession, setIsCheckingSession] = useState(isAuthenticated)
  const [hasValidSession, setHasValidSession] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsCheckingSession(false)
      setHasValidSession(false)
      return
    }

    let isMounted = true

    // Public pages may load with stale persisted auth after a deploy/incognito session.
    // Validate the cookie first so /login does not bounce through ProtectedRoute and show
    // a noisy "session expired" toast before the user actually submits the login form.
    void axios
      .get(`${API_BASE_URL}${API_ENDPOINTS.AUTH.ME}`, { withCredentials: true })
      .then((res) => {
        if (!isMounted) return
        setAuth(res.data.data.employee)
        setHasValidSession(true)
      })
      .catch(() => {
        if (!isMounted) return
        clearAuth()
        localStorage.removeItem("auth-storage")
        setHasValidSession(false)
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false)
      })

    return () => {
      isMounted = false
    }
  }, [clearAuth, isAuthenticated, setAuth])

  if (isCheckingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return hasValidSession ? <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace /> : <>{children}</>
}
