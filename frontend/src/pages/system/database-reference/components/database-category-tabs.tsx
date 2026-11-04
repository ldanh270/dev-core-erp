import { cn } from "@/lib/utils"
import type { ModuleDef } from "../database-reference.types"
import {
  Clock,
  Coins,
  Database,
  FolderKanban,
  ShieldCheck,
  Sliders,
  UserPlus,
  Users,
} from "lucide-react"
import type { ElementType } from "react"

// Friendly Vietnamese short names for modules to replace truncated single words.
const MODULE_SHORT_NAMES: Record<string, string> = {
  HRM: "Nhân sự",
  ATTENDANCE: "Chấm công",
  PAYROLL: "Tiền lương",
  PROJECT: "Dự án",
  RECRUITMENT: "Tuyển dụng",
  SECURITY: "Bảo mật",
  SYSTEM: "Hệ thống",
}

// Icon component lookup mapping matching schema generator icon strings.
const MODULE_ICON_MAP: Record<string, ElementType> = {
  Users,
  Clock,
  BadgeDollarSign: Coins,
  FolderKanban,
  UserPlus,
  ShieldCheck,
  Sliders,
}

interface DatabaseCategoryTabsProps {
  modules: ModuleDef[]
  selectedModule: string
  totalTables: number
  onSelectModule: (moduleId: string) => void
}

/**
 * Category Tab Navigation matching the DataTablePage / EmployeeList style:
 * Viewport-locked horizontal scrolling, rounded pill count badges, and active bottom indicator.
 */
export function DatabaseCategoryTabs({
  modules,
  selectedModule,
  totalTables,
  onSelectModule,
}: DatabaseCategoryTabsProps) {
  // Build category list starting with "Tất cả" followed by all schema modules.
  const tabs = [
    {
      id: "ALL",
      label: "Tất cả",
      count: totalTables,
      Icon: Database,
    },
    ...modules.map((m) => ({
      id: m.id,
      label: MODULE_SHORT_NAMES[m.id] ?? m.name.split(" ")[0],
      count: m.tableCount,
      Icon: MODULE_ICON_MAP[m.icon] ?? Sliders,
    })),
  ]

  return (
    // Horizontal scrollable container with hidden native scrollbar for seamless touch & desktop experience.
    <nav
      aria-label="Lọc theo phân hệ"
      className="relative flex h-11 shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-card px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive = selectedModule === tab.id
        const IconComponent = tab.Icon

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectModule(tab.id)}
            className={cn(
              "relative flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors",
              isActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Module icon */}
            <IconComponent className="size-4 shrink-0" />

            {/* Vietnamese module label */}
            <span>{tab.label}</span>

            {/* Pill badge showing total table count for this module */}
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {tab.count}
            </span>

            {/* Active tab bottom indicator underline */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
