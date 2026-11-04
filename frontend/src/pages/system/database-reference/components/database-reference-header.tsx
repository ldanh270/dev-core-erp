import { PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Code2,
  Layers,
  Network,
  Table2,
} from "lucide-react"

interface DatabaseReferenceHeaderProps {
  activeTab: "tables" | "diagram"
  totalTables: number
  totalColumns: number
  totalRelations: number
  totalEnums: number
  onTabChange: (tab: "tables" | "diagram") => void
}

/**
 * Top PageHeader for Database Schema Reference:
 * View switcher (Table List / ERD), schema statistics badges, and ERP return navigation.
 */
export function DatabaseReferenceHeader({
  activeTab,
  totalTables,
  totalColumns,
  totalRelations,
  totalEnums,
  onTabChange,
}: DatabaseReferenceHeaderProps) {
  return (
    <PageHeader
      title="Database Schema Reference"
      actions={
        <div
          data-testid="database-schema-toolbar"
          className="flex flex-wrap items-center gap-2 sm:gap-3"
        >
          {/* View switcher tabs: h-9 container with separated pill triggers */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === "tables" || value === "diagram") onTabChange(value)
            }}
          >
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
            <MetadataBadge icon={Table2} label="Bảng" value={totalTables} />
            <MetadataBadge icon={Layers} label="Cột" value={totalColumns} />
            <MetadataBadge icon={Network} label="Quan hệ" value={totalRelations} />
            <MetadataBadge icon={Code2} label="Enums" value={totalEnums} />
          </div>

          {/* ERP navigation button with unified h-9 height */}
          <Button asChild size="sm" variant="outline" className="h-9 rounded-full px-3.5 text-xs font-medium">
            <Link to="/">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Vào ERP
            </Link>
          </Button>
        </div>
      }
    />
  )
}

// Single metric pill badge with h-9 height to match TabsList and Button exactly.
function MetadataBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Table2
  label: string
  value: number
}) {
  return (
    <Badge
      variant="outline"
      className="h-9 gap-1.5 rounded-full px-3.5 text-xs font-medium"
    >
      <Icon className="size-3.5 text-primary" />
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </Badge>
  )
}
