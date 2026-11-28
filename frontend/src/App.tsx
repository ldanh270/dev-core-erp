import { ConfirmProvider } from "@/components/common"
import { ROUTES } from "@/config/routes.config"
import { SUBSYSTEMS, type SubsystemConfig } from "@/config/subsystem.config"
import { setNavigate } from "@/lib/router-navigator"
import { openRoutes, privateRoutes, publicRoutes } from "@/routes"
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute"
import { PublicRoute } from "@/routes/guards/PublicRoute"
import { renderPrivateRoute } from "@/routes/guards/RouteRenderer"
import { useAuthStore } from "@/store/auth-store"
import { resolveSubsystemDestination } from "@/utils/navigation/resolve-subsystem-destination"

import { Fragment, Suspense, lazy, useEffect } from "react"

import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom"
import { Toaster } from "sonner"

const NotFound = lazy(() => import("@/pages/NotFound.tsx"))

const NavigatorInjector = () => {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigate(navigate)
  }, [navigate])
  return null
}

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

  if (destination !== subsystem.routePrefix) {
    return <Navigate to={destination} replace />
  }

  const firstPath = subsystem.sidebarItems[0]?.path ?? ROUTES.PERSONAL.SCHEDULE
  return <Navigate to={firstPath} replace />
}

const LEGACY_REDIRECTS = [
  { path: "/personal/schedule", to: ROUTES.ATTENDANCE.MY_SCHEDULE },
  { path: "/personal/availability", to: ROUTES.ATTENDANCE.MY_AVAILABILITY },
  { path: "/personal/payslips", to: ROUTES.PAYROLL.MY_PAYSLIPS },
  { path: "/personal/projects", to: ROUTES.PROJECT.MY_PROJECTS },
  { path: "/personal/applications", to: ROUTES.APPLICATION.MY_APPLICATIONS },
  { path: "/personal", to: ROUTES.ATTENDANCE.MY_SCHEDULE },
  { path: ROUTES.PROJECT.DASHBOARD, to: ROUTES.PROJECT.MY_PROJECTS },
]

export default function App() {
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
                      <Layout>{Page ? <Page /> : null}</Layout>
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
            {LEGACY_REDIRECTS.map((item) => (
              <Route
                key={`legacy-${item.path}`}
                path={item.path}
                element={
                  <ProtectedRoute>
                    <Navigate to={item.to} replace />
                  </ProtectedRoute>
                }
              />
            ))}

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ConfirmProvider>
    </Router>
  )
}
