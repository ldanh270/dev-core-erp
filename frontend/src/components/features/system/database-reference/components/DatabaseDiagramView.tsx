import { PageContainer, PageHeader } from "@/components/common"
import type React from "react"
import { DatabaseErdTab } from "./DatabaseErdTab"
import type { DbSchemaData, TableDef } from "../database-reference.types"

interface DatabaseDiagramViewProps {
  headerActions: React.ReactNode
  detailSheet: React.ReactNode
  filteredTables: TableDef[]
  allTables: TableDef[]
  modules: DbSchemaData["modules"]
  selectedModule: string
  onModuleChange: (mod: string) => void
  selectedTableName: string | null
  onSelectTable: (table: TableDef) => void
}

export function DatabaseDiagramView({
  headerActions,
  detailSheet,
  filteredTables,
  allTables,
  modules,
  selectedModule,
  onModuleChange,
  selectedTableName,
  onSelectTable,
}: DatabaseDiagramViewProps) {
  return (
    <PageContainer
      variant="table"
      className="h-dvh p-3 md:px-5 md:py-3 gap-2 flex flex-col overflow-hidden"
    >
      <PageHeader
        title="Database Schema Reference"
        description="Tra cứu lược đồ cơ sở dữ liệu và sơ đồ quan hệ thực thể (ERD)."
        actions={headerActions}
      />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <DatabaseErdTab
          tables={filteredTables}
          allTables={allTables}
          modules={modules}
          selectedModule={selectedModule}
          onModuleChange={onModuleChange}
          selectedTableName={selectedTableName}
          onSelectTable={onSelectTable}
        />
      </div>
      {detailSheet}
    </PageContainer>
  )
}
