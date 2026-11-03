import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROUTES } from "@/config/routes.config"
import { useAuth } from "@/hooks/use-auth.ts"
import { useAuthStore } from "@/store/auth-store.ts"
import { useSidebarStore } from "@/store/sidebar-store"

import { ChevronsUpDown, History, LogOut, User as UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

const USER_MENU_ITEMS = [
  { icon: UserIcon, label: "Hồ sơ cá nhân", to: ROUTES.HRM.PROFILE },
  { icon: History, label: "Lịch sử đăng nhập", to: ROUTES.HRM.LOGIN_HISTORY },
]

/**
 * UserMenu — Displays user avatar and profile dropdown in the Sidebar Footer.
 */
interface UserMenuProps {
  collapsed?: boolean
}

export default function UserMenu({ collapsed }: UserMenuProps = {}) {
  const navigate = useNavigate()
  const { logout, isLoggingOut } = useAuth()
  const { user } = useAuthStore()
  const { isCollapsed: storeCollapsed } = useSidebarStore()
  const isCollapsed = collapsed !== undefined ? collapsed : storeCollapsed

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.AUTH.LOGIN)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center rounded-lg text-sm transition-all duration-300 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isCollapsed ? "w-full justify-center p-0" : "w-full justify-between p-2 gap-3"
          }`}
          title={isCollapsed ? user?.fullName : undefined}
        >
          <div className={`flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden leading-none">
                <span className="truncate text-sm font-medium text-foreground">
                  {user?.fullName || "Lê Đức Anh"}
                </span>
                <span className="mt-1 truncate text-xs text-muted-foreground">
                  {user?.email || "user@example.com"}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isCollapsed ? "center" : "end"}
        alignOffset={isCollapsed ? 0 : 4}
        side="right"
        sideOffset={isCollapsed ? 12 : 8}
        className="w-56 rounded-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 font-normal">
          <p className="text-xs text-muted-foreground">Đăng nhập với</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{user?.fullName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {USER_MENU_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <DropdownMenuItem key={item.label} asChild className="cursor-pointer gap-3 px-3 py-2">
              <Link to={item.to} className="w-full">
                <Icon size={14} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer gap-3 px-3 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
