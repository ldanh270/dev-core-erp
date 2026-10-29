import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BRANDING_CONFIG } from "@/config/branding.config"
import { SUBSYSTEMS } from "@/config/subsystem.config"
import type { SubsystemId } from "@/config/subsystem.config"
import { useProfile } from "@/hooks/use-profile"
import { useAuthStore } from "@/store/auth-store"
import { useSidebarStore } from "@/store/sidebar-store"
import { useSubsystemStore } from "@/store/subsystem-store"
import { filterNavItems } from "@/utils/navigation/filter-nav-items"
import { resolveSubsystemDestination } from "@/utils/navigation/resolve-subsystem-destination"

import { ChevronsUpDown } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SubsystemDropdown() {
  const navigate = useNavigate()
  const { activeSubsystem, setActiveSubsystem, getActiveSubsystemConfig } = useSubsystemStore()
  const { isCollapsed } = useSidebarStore()
  const user = useAuthStore((state) => state.user)
  const { data: profile } = useProfile()

  const activeConfig = getActiveSubsystemConfig()

  // A subsystem-level permission hides whole admin-only modules. Payroll deliberately
  // has no such gate because its self-service payslip item is available to all employees.
  const navSubsystems = SUBSYSTEMS.filter((subsystem) => {
    const hasSubsystemPermission =
      !subsystem.permissions ||
      Boolean(
        user && subsystem.permissions.every((permission) => user.permissions.includes(permission)),
      )
    if (!hasSubsystemPermission) return false

    return (
      filterNavItems(subsystem.sidebarItems, user, profile?.employeeType, profile?.workScheduleType)
        .length > 0
    )
  })

  const handleSelectSubsystem = (subsystemId: SubsystemId, routePrefix: string) => {
    // Resolve before mutating UI state so navigation has one deterministic destination.
    const destination = resolveSubsystemDestination(
      subsystemId,
      routePrefix,
      user?.permissions,
      user?.roles,
    )

    // Set immediately for responsive dropdown feedback. MainLayout then confirms the
    // subsystem from the destination URL after React Router commits navigation.
    setActiveSubsystem(subsystemId)
    navigate(destination)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex h-12 min-w-0 items-center rounded-xl text-sm font-medium transition-all duration-300 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isCollapsed ? "w-full justify-center px-0" : "w-full justify-between px-2 gap-2"
          }`}
          title={isCollapsed ? activeConfig?.name : undefined}
        >
          <div
            className={`flex min-w-0 items-center overflow-hidden ${isCollapsed ? "justify-center" : "flex-1 gap-2"}`}
          >
            <img
              src={BRANDING_CONFIG.LOGO_URL}
              alt={BRANDING_CONFIG.LOGO_ALT}
              className="size-10 shrink-0 rounded-xl object-cover object-center shadow-sm"
            />
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden text-left leading-tight">
                <span className="max-w-full truncate font-semibold text-foreground">
                  {BRANDING_CONFIG.APP_NAME}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {BRANDING_CONFIG.APP_SUBTITLE}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isCollapsed ? "center" : "end"}
        side="right"
        sideOffset={8}
        className="w-60 rounded-xl p-1 shadow-md mt-2 ml-3"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {navSubsystems.map((subsystem) => {
            const Icon = subsystem.icon
            const isActive = activeSubsystem === subsystem.id

            return (
              <DropdownMenuItem
                key={subsystem.id}
                onClick={() => {
                  handleSelectSubsystem(subsystem.id, subsystem.routePrefix)
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-full p-2 transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
                    : "text-foreground focus:bg-muted"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span className="truncate text-sm font-medium">{subsystem.name}</span>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
