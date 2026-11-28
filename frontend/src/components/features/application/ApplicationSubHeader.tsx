import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ApplicationSubHeaderProps {
  activeTab: string
  mineSubTab: "list" | "leaves"
  onSubTabChange: (val: "list" | "leaves") => void
}

/**
 * Presenter tab navigation for switching between personal application list and leave entitlement summary.
 */
export function ApplicationSubHeader({
  activeTab,
  mineSubTab,
  onSubTabChange,
}: ApplicationSubHeaderProps) {
  if (activeTab !== "mine") return null

  return (
    <div className="border-b border-border px-1 shrink-0">
      <Tabs
        value={mineSubTab}
        onValueChange={(val) => {
          onSubTabChange(val as "list" | "leaves")
        }}
      >
        <TabsList variant="line" className="h-10 gap-6 bg-transparent p-0">
          <TabsTrigger
            value="list"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-2 font-medium text-sm transition-colors shadow-none"
          >
            Danh sách đơn
          </TabsTrigger>
          <TabsTrigger
            value="leaves"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-2 font-medium text-sm transition-colors shadow-none"
          >
            Tổng phép
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
