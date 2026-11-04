import type { DataTableTabItem } from "@/components/common"
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
import type { LucideIcon } from "lucide-react"
import { useMemo } from "react"

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
const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Clock,
  BadgeDollarSign: Coins,
  FolderKanban,
  UserPlus,
  ShieldCheck,
  Sliders,
}

export interface UseDatabaseCategoryTabsParams {
  modules: ModuleDef[]
  totalTables: number
}

/**
 * Custom hook converting database schema modules into standardized DataTableTabItem array.
 */
export function useDatabaseCategoryTabs({
  modules,
  totalTables,
}: UseDatabaseCategoryTabsParams): DataTableTabItem[] {
  return useMemo<DataTableTabItem[]>(() => {
    return [
      {
        id: "ALL",
        label: "Tất cả",
        count: totalTables,
        icon: Database,
      },
      ...modules.map((m) => ({
        id: m.id,
        label: MODULE_SHORT_NAMES[m.id] ?? m.name.split(" ")[0],
        count: m.tableCount,
        icon: MODULE_ICON_MAP[m.icon] ?? Sliders,
      })),
    ]
  }, [modules, totalTables])
}
