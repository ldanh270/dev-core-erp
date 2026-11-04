import { PageCard, SearchInput } from "@/components/common"
import { SYSTEM_CONFIG } from "@/config/system.config"
import schemaSummaryRaw from "@/data/schema-summary.json"

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
import { useDatabaseReference } from "./database-reference/hooks/use-database-reference"

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

/**
 * Main coordinator page for Database Schema Reference & Interactive ERD Viewer.
 * Decouples business logic into `useDatabaseReference` hook and renders clean UI layout.
 */
export default function DatabaseReference() {
  const { state, actions } = useDatabaseReference({
    allTables,
    dbSchema,
    pageSize: PAGE_SIZE,
  })

  return (
    <div className="w-full max-w-none space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      {/* Top statistics and view switcher header */}
      <DatabaseReferenceHeader
        activeTab={state.activeTab}
        totalTables={dbSchema.metadata.totalTables}
        totalColumns={dbSchema.metadata.totalColumns}
        totalRelations={dbSchema.metadata.totalRelations}
        totalEnums={dbSchema.metadata.totalEnums}
        onTabChange={actions.setActiveTab}
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        {/* Module category tabs styled like DataTablePage / EmployeeList */}
        <DatabaseCategoryTabs
          modules={dbSchema.modules}
          selectedModule={state.selectedModule}
          totalTables={dbSchema.metadata.totalTables}
          onSelectModule={actions.handleModuleChange}
        />

        {/* Search input toolbar */}
        <div className="relative z-30 flex flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <SearchInput
              placeholder="Tìm model, bảng, cột, kiểu dữ liệu hoặc mô tả..."
              value={state.searchQuery}
              onSearch={actions.handleSearchChange}
              className="w-full sm:max-w-md"
            />
          </div>
        </div>

        {/* Content view: Table list view or Interactive ERD Diagram */}
        {state.activeTab === "tables" ? (
          <DatabaseTableList
            tables={state.filteredTables}
            allTables={allTables}
            currentPage={state.currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={actions.setCurrentPage}
            onSelectTable={actions.handleSelectTable}
            onSelectTableByName={actions.handleSelectTableByName}
          />
        ) : (
          <div className="p-3 sm:p-5">
            <DatabaseErdTab
              tables={state.filteredTables}
              allTables={allTables}
              modules={dbSchema.modules}
              selectedModule={state.selectedModule}
              onModuleChange={actions.handleModuleChange}
              limitNodes={state.selectedModule === "ALL"}
              selectedTableName={state.selectedTable?.name ?? null}
              onSelectTable={actions.handleSelectTable}
            />
          </div>
        )}
      </PageCard>

      {/* Slide-over table inspection drawer */}
      <DatabaseTableSheet
        table={state.selectedTable}
        schema={dbSchema}
        onClose={() => actions.setSelectedTable(null)}
        onSelectTable={actions.handleSelectTableByName}
        onViewErd={actions.handleViewErd}
        copied={state.selectedTable !== null && state.copiedTableName === state.selectedTable.name}
        onCopy={actions.handleCopyMetadata}
      />
    </div>
  )
}
