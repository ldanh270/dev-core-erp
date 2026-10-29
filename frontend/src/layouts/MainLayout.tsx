import Header from "@/components/layouts/Header"
import Sidebar from "@/components/layouts/Sidebar"
import { SUBSYSTEMS } from "@/config/subsystem.config"
import { useSubsystemStore } from "@/store/subsystem-store"

import type { ReactNode } from "react"
import { useEffect } from "react"

import { useLocation } from "react-router-dom"

interface MainLayoutProps {
  children?: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { setActiveSubsystem } = useSubsystemStore()

  // Sync active subsystem based on current URL
  useEffect(() => {
    const currentPath = location.pathname
    // Find the subsystem whose routePrefix matches or has a sidebarItem matching the current path
    const matchedSubsystem = SUBSYSTEMS.find(
      (sub) =>
        currentPath.startsWith(sub.routePrefix) ||
        sub.sidebarItems.some((item) => currentPath.startsWith(item.path.split("?")[0])),
    )
    if (matchedSubsystem) {
      setActiveSubsystem(matchedSubsystem.id)
    }
  }, [location.pathname, setActiveSubsystem])

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar className="hidden md:flex shrink-0" />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}
