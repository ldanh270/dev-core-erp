import type { RouteConfig } from "@/routes"

import { Fragment, type ReactNode } from "react"

import { Outlet, Route } from "react-router-dom"

import { ProtectedRoute } from "./ProtectedRoute"

export const renderPrivateRoute = (
  route: RouteConfig,
  index: number,
  keyPrefix: string,
): ReactNode => {
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
