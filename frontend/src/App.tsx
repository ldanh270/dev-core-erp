import { AuthorizationUnavailable } from "@/components/auth/authorization-unavailable"
import { ConfirmProvider } from "@/components/common"
import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config"
import { AUTHORIZATION_STATUS } from "@/config/entities/auth.config"
import { ROUTES } from "@/config/routes.config"
import { SUBSYSTEMS } from "@/config/subsystem.config"
import type { SubsystemConfig } from "@/config/subsystem.config"
import apiClient from "@/lib/api-client"
import { setNavigate } from "@/lib/router-navigator"
import { type RouteConfig, openRoutes, privateRoutes, publicRoutes } from "@/routes"
import { useAuthStore } from "@/store/auth-store.ts"
import { resolveSubsystemDestination } from "@/utils/navigation/resolve-subsystem-destination"

import { Fragment, type ReactNode, Suspense, lazy, useEffect, useState } from "react"

import axios from "axios"
import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom"
import { Toaster } from "sonner"

/**
 * Injects the React Router `navigate` function into the router-navigator singleton.
 * Must be rendered inside <Router> so that `useNavigate` is available.
 * Renders nothing — purely a side-effect component.
 */
const NavigatorInjector = () => {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  return null
}

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

/**
 * ProtectedRoute component
 * Redirects to /login if user is not authenticated
 * Redirects to /personal if user does not have required roles
 */
const ProtectedRoute = ({
  children,
  requiredPermissions,
  requiredRoles,
}: {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
}) => {
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

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
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

/**
 * RootRedirect component
 * Redirects to default schedule route if authenticated, otherwise to /login
 */
const RootRedirect = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return (
    <Navigate to={isAuthenticated ? ROUTES.ATTENDANCE.MY_SCHEDULE : ROUTES.AUTH.LOGIN} replace />
  )
}

const SubsystemRootRedirect = ({ subsystem }: { subsystem: SubsystemConfig }) => {
  const user = useAuthStore((state) => state.user)
  const destination = resolveSubsystemDestination(
    subsystem.id,
    subsystem.routePrefix,
    user?.permissions,
    user?.roles,
  )

  // Root URLs and dropdown clicks share one resolver so permission behavior cannot drift.
  if (destination !== subsystem.routePrefix) {
    return <Navigate to={destination} replace />
  }

  const firstPath = subsystem.sidebarItems[0]?.path ?? ROUTES.PERSONAL.SCHEDULE
  return <Navigate to={firstPath} replace />
}

const renderPrivateRoute = (route: RouteConfig, index: number, keyPrefix: string): ReactNode => {
  const Layout = route.layout || Fragment

  if (route.children?.length) {
    return (
      <Route
        key={`${keyPrefix}-${index}`}
        path={route.path}
        element={
          <ProtectedRoute requiredPermissions={route.permissions} requiredRoles={route.roles}>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        {route.children.map((child, ci) => renderPrivateRoute(child, ci, `${keyPrefix}-${index}`))}
      </Route>
    )
  }

  if (!route.component) return null
  const Page = route.component
  return (
    <Route
      key={`${keyPrefix}-${index}`}
      path={route.path}
      element={
        <ProtectedRoute requiredPermissions={route.permissions} requiredRoles={route.roles}>
          <Layout>
            <Page />
          </Layout>
        </ProtectedRoute>
      }
    />
  )
}

const App = () => {
  return (
    <Router>
      <NavigatorInjector />
      <Toaster position="top-right" richColors />
      <ConfirmProvider>
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <Routes>
            {openRoutes.map((route, index) => {
              const Page = route.component
              const Layout = route.layout || Fragment

              return (
                <Route
                  key={`open-${index}`}
                  path={route.path}
                  element={<Layout>{Page ? <Page /> : null}</Layout>}
                />
              )
            })}

            {publicRoutes.map((route, index) => {
              const Page = route.component
              const Layout = route.layout || Fragment

              return (
                <Route
                  key={`public-${index}`}
                  path={route.path}
                  element={
                    <PublicRoute>
                      <Layout>
                        <Page />
                      </Layout>
                    </PublicRoute>
                  }
                />
              )
            })}

            {SUBSYSTEMS.map((subsystem) => {
              const firstPath = subsystem.sidebarItems[0]?.path

              if (firstPath === subsystem.routePrefix) {
                return null
              }

              return (
                <Route
                  key={`redirect-${subsystem.id}`}
                  path={subsystem.routePrefix}
                  element={
                    <ProtectedRoute>
                      <SubsystemRootRedirect subsystem={subsystem} />
                    </ProtectedRoute>
                  }
                />
              )
            })}

            {privateRoutes.map((route, index) => renderPrivateRoute(route, index, "private"))}

            {/* Legacy route redirects */}
            <Route
              path="/personal/schedule"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal/availability"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.ATTENDANCE.MY_AVAILABILITY} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal/payslips"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PAYROLL.MY_PAYSLIPS} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal/projects"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PROJECT.MY_PROJECTS} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal/applications"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.APPLICATION.MY_APPLICATIONS} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal"
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROJECT.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Navigate to={ROUTES.PROJECT.MY_PROJECTS} replace />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ConfirmProvider>
    </Router>
  )
}

export default App
