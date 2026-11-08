import { DataTablePage, PageContainer, PageHeader } from "@/components/common"
import { SYSTEM_CONFIG } from "@/config/system.config"
import schemaSummaryRaw from "@/data/schema-summary.json"
import { Database } from "lucide-react"
import { useMemo } from "react"

import { DatabaseErdTab } from "./database-reference/components/database-erd-tab"
import { DatabaseReferenceHeaderActions } from "./database-reference/components/database-reference-header-actions"
import { DatabaseTableSheet } from "./database-reference/components/database-table-sheet"
import type {
  DbSchemaData,
  DbSchemaSummary,
  TableDef,
} from "./database-reference/database-reference.types"
import { useDatabaseCategoryTabs } from "./database-reference/hooks/use-database-category-tabs"
import { useDatabaseReference } from "./database-reference/hooks/use-database-reference"
import { useDatabaseTableColumns } from "./database-reference/hooks/use-database-table-columns"

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
 * Powered by DataTablePage master component for unified ERP tables layout.
 */
export default function DatabaseReference() {
  const { state, actions } = useDatabaseReference({
    allTables,
    dbSchema,
    pageSize: PAGE_SIZE,
  })

  const categoryTabs = useDatabaseCategoryTabs({
    modules: dbSchema.modules,
    totalTables: dbSchema.metadata.totalTables,
  })

  const { columns } = useDatabaseTableColumns({
    allTables,
    onSelectTable: actions.handleSelectTable,
    onSelectTableByName: actions.handleSelectTableByName,
  })

  const totalPages = Math.ceil(state.filteredTables.length / PAGE_SIZE)
  const visibleTables = useMemo(
    () => state.filteredTables.slice((state.currentPage - 1) * PAGE_SIZE, state.currentPage * PAGE_SIZE),
    [state.filteredTables, state.currentPage],
  )

  const headerActions = (
    <DatabaseReferenceHeaderActions
      activeTab={state.activeTab}
      totalTables={dbSchema.metadata.totalTables}
      totalColumns={dbSchema.metadata.totalColumns}
      totalRelations={dbSchema.metadata.totalRelations}
      totalEnums={dbSchema.metadata.totalEnums}
      onTabChange={actions.setActiveTab}
    />
  )

  const detailSheet = (
    <DatabaseTableSheet
      table={state.selectedTable}
      schema={dbSchema}
      onClose={() => { actions.setSelectedTable(null); }}
      onSelectTable={actions.handleSelectTableByName}
      onViewErd={actions.handleViewErd}
      copied={state.selectedTable !== null && state.copiedTableName === state.selectedTable.name}
      onCopy={actions.handleCopyMetadata}
    />
  )

  if (state.activeTab === "diagram") {
    return (
      <PageContainer variant="table">
        <PageHeader
          title="Database Schema Reference"
          description="Tra cứu lược đồ cơ sở dữ liệu và sơ đồ quan hệ thực thể (ERD)."
          actions={headerActions}
        />
        <div className="flex-1 min-h-0 flex flex-col">
          <DatabaseErdTab
            tables={state.filteredTables}
            allTables={allTables}
            modules={dbSchema.modules}
            selectedModule={state.selectedModule}
            onModuleChange={actions.handleModuleChange}
            selectedTableName={state.selectedTable?.name ?? null}
            onSelectTable={actions.handleSelectTable}
          />
        </div>
        {detailSheet}
      </PageContainer>
    )
  }

  return (
    <DataTablePage<TableDef>
      title="Database Schema Reference"
      description="Tra cứu lược đồ cơ sở dữ liệu và sơ đồ quan hệ thực thể (ERD)."
      headerActions={headerActions}
      tabs={{
        items: categoryTabs,
        activeTab: state.selectedModule,
        onTabChange: actions.handleModuleChange,
      }}
      search={{
        placeholder: "Tìm model, bảng, cột, kiểu dữ liệu hoặc mô tả...",
        value: state.searchQuery,
        onSearch: actions.handleSearchChange,
      }}
      columns={columns}
      data={visibleTables}
      keyExtractor={(table) => table.name}
      emptyState={{
        icon: Database,
        title: "Không tìm thấy bảng",
        description: "Thử từ khóa khác hoặc bỏ bộ lọc phân hệ.",
      }}
      pagination={{
        currentPage: state.currentPage,
        totalPages,
        totalItems: state.filteredTables.length,
        itemsPerPage: PAGE_SIZE,
        onPageChange: actions.setCurrentPage,
      }}
      extraContent={detailSheet}
    />
  )
}
