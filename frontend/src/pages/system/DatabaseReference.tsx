import { PageCard, SearchInput } from "@/components/common"
import { SYSTEM_CONFIG } from "@/config/system.config"
import schemaSummaryRaw from "@/data/schema-summary.json"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DatabaseCategoryTabs } from "./database-reference/components/database-category-tabs"
import { DatabaseErdTab } from "./database-reference/components/database-erd-tab"
import { DatabaseReferenceHeader } from "./database-reference/components/database-reference-header"
import { DatabaseTableList } from "./database-reference/components/database-table-list"
import { DatabaseTableSheet } from "./database-reference/components/database-table-sheet"
import type {
  DbSchemaData,
  DbSchemaSummary,
  TableDef,
} from "./database-reference/database-reference.types"
import { filterTables } from "./database-reference/database-reference.utils"

// Load extracted schema summary and individual table metadata JSON records generated from prisma schema.
const schemaSummary: DbSchemaSummary = schemaSummaryRaw
const tableFiles = import.meta.glob<TableDef>("@/data/tables/*.json", {
  eager: true,
  import: "default",
})
const allTables = Object.values(tableFiles)
const dbSchema: DbSchemaData = {
  metadata: schemaSummary.metadata,
  modules: schemaSummary.modules,
  tables: Object.fromEntries(allTables.map((table) => [table.name, table])),
  enums: schemaSummary.enums,
}
const PAGE_SIZE = SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT

type ActiveTab = "tables" | "diagram"

/**
 * Main coordinator page for Database Schema Reference & Interactive ERD Viewer.
 * Orchestrates module filtering, full-text search, pagination, drawer details, and ERD diagram state.
 */
export default function DatabaseReference() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tables")
  const [selectedModule, setSelectedModule] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTable, setSelectedTable] = useState<TableDef | null>(null)
  const [copiedTableName, setCopiedTableName] = useState<string | null>(null)

  // Filter tables by current module selection and multi-field keyword search.
  const filteredTables = useMemo(
    () => filterTables(allTables, dbSchema.modules, dbSchema.enums, selectedModule, searchQuery),
    [selectedModule, searchQuery],
  )

  // Open the detail drawer for a selected table object.
  const handleSelectTable = (table: TableDef) => {
    setSelectedTable(table)
  }

  // Open the detail drawer by resolving table name from relationship badges.
  const handleSelectTableByName = (tableName: string) => {
    const table = allTables.find((item) => item.name === tableName)
    if (table) setSelectedTable(table)
  }

  // Handle live search input and reset pagination to page 1.
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Handle module category tab switch and reset pagination.
  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId)
    setCurrentPage(1)
  }

  // Switch to the ERD tab and auto-focus the selected table's parent module.
  const handleViewErd = (moduleId: string) => {
    setSelectedModule(moduleId)
    setSelectedTable(null)
    setActiveTab("diagram")
  }

  // Copy full table definition JSON to system clipboard with a temporary success badge indicator.
  const handleCopyMetadata = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTableName(selectedTable?.name ?? null)
      window.setTimeout(() => setCopiedTableName(null), 2000)
    } catch {
      toast.error("Không thể sao chép metadata. Hãy kiểm tra quyền truy cập clipboard.")
    }
  }

  return (
    <div className="w-full max-w-none space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      {/* Top statistics and view switcher header */}
      <DatabaseReferenceHeader
        activeTab={activeTab}
        totalTables={dbSchema.metadata.totalTables}
        totalColumns={dbSchema.metadata.totalColumns}
        totalRelations={dbSchema.metadata.totalRelations}
        totalEnums={dbSchema.metadata.totalEnums}
        onTabChange={setActiveTab}
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        {/* Module category tabs styled like DataTablePage / EmployeeList */}
        <DatabaseCategoryTabs
          modules={dbSchema.modules}
          selectedModule={selectedModule}
          totalTables={dbSchema.metadata.totalTables}
          onSelectModule={handleModuleChange}
        />

        {/* Search input toolbar */}
        <div className="relative z-30 flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Tìm model, bảng, cột, kiểu dữ liệu hoặc mô tả..."
              value={searchQuery}
              onSearch={handleSearchChange}
              className="w-full sm:max-w-md"
            />
          </div>
        </div>

        {/* Content view: Table list view or Interactive ERD Diagram */}
        {activeTab === "tables" ? (
          <DatabaseTableList
            tables={filteredTables}
            allTables={allTables}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onSelectTable={handleSelectTable}
            onSelectTableByName={handleSelectTableByName}
          />
        ) : (
          <div className="p-3 sm:p-5">
            <DatabaseErdTab
              tables={filteredTables}
              allTables={allTables}
              modules={dbSchema.modules}
              selectedModule={selectedModule}
              onModuleChange={handleModuleChange}
              limitNodes={selectedModule === "ALL"}
              selectedTableName={selectedTable?.name ?? null}
              onSelectTable={handleSelectTable}
            />
          </div>
        )}
      </PageCard>

      {/* Slide-over table inspection drawer */}
      <DatabaseTableSheet
        table={selectedTable}
        schema={dbSchema}
        onClose={() => setSelectedTable(null)}
        onSelectTable={handleSelectTableByName}
        onViewErd={handleViewErd}
        copied={selectedTable !== null && copiedTableName === selectedTable.name}
        onCopy={handleCopyMetadata}
      />
    </div>
  )
}
