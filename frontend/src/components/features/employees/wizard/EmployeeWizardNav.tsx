import type { WizardTab } from "@/types/employee-wizard.types"

export interface EmployeeWizardNavProps {
  activeTab: WizardTab
  onTabChange: (tab: WizardTab) => void
}

interface TabOption {
  id: WizardTab
  label: string
}

const WIZARD_TABS: TabOption[] = [
  { id: "bio", label: "Sơ yếu lý lịch" },
  { id: "job", label: "Công việc" },
  { id: "family", label: "Thành viên gia đình" },
]

/**
 * Top pill-shaped tab navigation bar for the multi-step employee wizard.
 * Pure UI presentational component.
 */
export function EmployeeWizardNav({ activeTab, onTabChange }: EmployeeWizardNavProps) {
  return (
    <div className="border border-border rounded-full bg-card overflow-hidden p-1 flex items-center gap-1 shadow-none">
      {WIZARD_TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              onTabChange(tab.id)
            }}
            className={`flex-1 py-2 px-5 text-sm font-medium rounded-full transition-all text-center cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-none font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
