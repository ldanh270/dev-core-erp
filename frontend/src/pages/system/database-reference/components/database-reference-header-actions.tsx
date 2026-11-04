import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "react-router-dom"
import { useDatabaseReferenceHeader } from "../hooks/use-database-reference-header"
import { ArrowLeft, Network, Table2 } from "lucide-react"

export interface DatabaseReferenceHeaderActionsProps {
  activeTab: "tables" | "diagram"
  totalTables: number
  totalColumns: number
  totalRelations: number
  totalEnums: number
  onTabChange: (tab: "tables" | "diagram") => void
}

/**
 * Header actions toolbar: view switcher tabs, schema statistics counters, and ERP navigation button.
 */
export function DatabaseReferenceHeaderActions({
  activeTab,
  totalTables,
  totalColumns,
  totalRelations,
  totalEnums,
  onTabChange,
}: DatabaseReferenceHeaderActionsProps) {
  const { metricItems, handleTabChange } = useDatabaseReferenceHeader({
    totalTables,
    totalColumns,
    totalRelations,
    totalEnums,
    onTabChange,
  })

  return (
    <div
      data-testid="database-schema-toolbar"
      className="flex flex-wrap items-center gap-2 sm:gap-3"
    >
      {/* View switcher tabs: h-9 container with separated pill triggers */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-9 gap-1 rounded-full p-1">
          <TabsTrigger
            value="tables"
            className="h-7 gap-1.5 rounded-full px-3 text-xs font-medium"
          >
            <Table2 className="size-3.5" />
            Danh sách bảng
          </TabsTrigger>
          <TabsTrigger
            value="diagram"
            className="h-7 gap-1.5 rounded-full px-3 text-xs font-medium"
          >
            <Network className="size-3.5" />
            Sơ đồ ERD
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Schema metric counters: unified h-9 height equal to Tabs and Vào ERP button */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {metricItems.map(({ icon: Icon, label, value }) => (
          <Badge
            key={label}
            variant="outline"
            className="h-9 gap-1.5 rounded-full px-3.5 text-xs font-medium"
          >
            <Icon className="size-3.5 text-primary" />
            <span>{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </Badge>
        ))}
      </div>

      {/* ERP navigation button with unified h-9 height */}
      <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3.5 text-xs font-medium">
        <Link to="/">
          <ArrowLeft className="mr-1.5 size-3.5" />
          Vào ERP
        </Link>
      </Button>
    </div>
  )
}
