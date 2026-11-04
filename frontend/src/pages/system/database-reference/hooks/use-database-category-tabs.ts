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
import { type ElementType, useCallback, useMemo } from "react"

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

export interface CategoryTabItem {
  id: string
  label: string
  count: number
  Icon: ElementType
  isActive: boolean
}

export interface UseDatabaseCategoryTabsParams {
  modules: ModuleDef[]
  selectedModule: string
  totalTables: number
  onSelectModule: (moduleId: string) => void
}

export interface UseDatabaseCategoryTabsReturn {
  tabs: CategoryTabItem[]
  handleSelectTab: (tabId: string) => void
}

/**
 * Custom hook encapsulating module category tabs computation and selection logic.
 * Decouples presentation UI from module label resolution, icon mapping, and active state tracking.
 */
export function useDatabaseCategoryTabs({
  modules,
  selectedModule,
  totalTables,
  onSelectModule,
}: UseDatabaseCategoryTabsParams): UseDatabaseCategoryTabsReturn {
  // Construct normalized tab definitions with friendly Vietnamese names and icon bindings.
  const tabs = useMemo<CategoryTabItem[]>(() => {
    return [
      {
        id: "ALL",
        label: "Tất cả",
        count: totalTables,
        Icon: Database,
        isActive: selectedModule === "ALL",
      },
      ...modules.map((m) => ({
        id: m.id,
        label: MODULE_SHORT_NAMES[m.id] ?? m.name.split(" ")[0],
        count: m.tableCount,
        Icon: MODULE_ICON_MAP[m.icon] ?? Sliders,
        isActive: selectedModule === m.id,
      })),
    ]
  }, [modules, selectedModule, totalTables])

  const handleSelectTab = useCallback(
    (tabId: string) => {
      onSelectModule(tabId)
    },
    [onSelectModule],
  )

  return {
    tabs,
    handleSelectTab,
  }
}
