import { cn } from "@/lib/utils"
import type { ModuleDef } from "../database-reference.types"
import { useDatabaseCategoryTabs } from "../hooks/use-database-category-tabs"

interface DatabaseCategoryTabsProps {
  modules: ModuleDef[]
  selectedModule: string
  totalTables: number
  onSelectModule: (moduleId: string) => void
}

/**
 * Category Tab Navigation matching the DataTablePage / EmployeeList style:
 * Viewport-locked horizontal scrolling, rounded pill count badges, and active bottom indicator.
 * Pure UI presentation component driven by `useDatabaseCategoryTabs` hook.
 */
export function DatabaseCategoryTabs(props: DatabaseCategoryTabsProps) {
  const { tabs, handleSelectTab } = useDatabaseCategoryTabs(props)

  return (
    // Horizontal scrollable container with hidden native scrollbar for seamless touch & desktop experience.
    <nav
      aria-label="Lọc theo phân hệ"
      className="relative flex h-11 shrink-0 items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-card px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const IconComponent = tab.Icon

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelectTab(tab.id)}
            className={cn(
              "relative flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors",
              tab.isActive
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
                tab.isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {tab.count}
            </span>

            {/* Active tab bottom indicator underline */}
            {tab.isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
