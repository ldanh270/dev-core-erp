import { SUBSYSTEMS } from "@/config/subsystem.config"

import { useMemo } from "react"

import { useLocation } from "react-router-dom"

export interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * useBreadcrumb — Derives breadcrumb from current URL + subsystem config.
 * Returns [subsystemName, ...navItemName] trail.
 */
export function useBreadcrumb(): BreadcrumbItem[] {
  const location = useLocation()

  return useMemo(() => {
    const pathname = location.pathname

    const subsystem = SUBSYSTEMS.find((s) => pathname.startsWith(s.routePrefix))
    if (!subsystem) return []

    let navItem = subsystem.sidebarItems.find((item) => {
      const [itemPathname, itemQuery] = item.path.split("?")
      if (pathname !== itemPathname) return false

      if (itemQuery) {
        const itemParams = new URLSearchParams(itemQuery)
        const currentParams = new URLSearchParams(location.search)
        for (const [key, value] of itemParams.entries()) {
          if (currentParams.get(key) !== value) return false
        }
        return true
      }
      return false
    })

    // 2. Fallback to pathname match if no query params match
    if (!navItem) {
      navItem = subsystem.sidebarItems.find((item) => {
        if (pathname === item.path) return true
        // Avoid dashboard matching everything
        const isDashboard = item.path === subsystem.sidebarItems[0]?.path
        return !isDashboard && pathname.startsWith(item.path)
      })
    }

    const crumbs: BreadcrumbItem[] = [
      { label: subsystem.name, path: subsystem.sidebarItems[0]?.path },
    ]

    if (navItem) {
      crumbs.push({ label: navItem.name })
    }

    return crumbs
  }, [location.pathname, location.search])
}
