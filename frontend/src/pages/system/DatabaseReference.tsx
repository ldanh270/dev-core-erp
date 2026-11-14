import { DataTablePage, PageContainer, PageHeader } from "@/components/common"
import { SYSTEM_CONFIG } from "@/config/system.config"
import schemaSummaryRaw from "@/data/schema-summary.json"

import { useMemo } from "react"

import { Database } from "lucide-react"

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

/**
 * Extracted schema summary and individual table metadata JSON records generated from prisma schema.
 */
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
const DEFAULT_PAGE_SIZE = SYSTEM_CONFIG.PAGINATION.DEFAULT_LIMIT

/**
 * Page size selector options including full 210-table view.
 */
const DATABASE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 210]

/**
 * Main coordinator page for Database Schema Reference & Interactive ERD Viewer.
 * Powered by DataTablePage master component for unified ERP tables layout.
 */
export default function DatabaseReference() {
  const { state, actions } = useDatabaseReference({
    allTables,
    dbSchema,
    pageSize: DEFAULT_PAGE_SIZE,
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

  const totalPages = Math.ceil(state.filteredTables.length / state.pageSize)
  const visibleTables = useMemo(
    () =>
      state.filteredTables.slice(
        (state.currentPage - 1) * state.pageSize,
        state.currentPage * state.pageSize,
      ),
    [state.filteredTables, state.currentPage, state.pageSize],
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
      onClose={() => {
        actions.setSelectedTable(null)
      }}
      onSelectTable={actions.handleSelectTableByName}
      onViewErd={actions.handleViewErd}
      copied={state.selectedTable !== null && state.copiedTableName === state.selectedTable.name}
      onCopy={actions.handleCopyMetadata}
    />
  )

  if (state.activeTab === "diagram") {
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
      variant="viewport"
      containerClassName="h-dvh p-3 md:px-5 md:py-3 gap-2"
      headerActions={headerActions}
      tabs={{
        items: categoryTabs,
        activeTab: state.selectedModule,
        onTabChange: actions.handleModuleChange,
      }}
      search={{
        placeholder: "Tìm tên bảng, cột, mô tả...",
        value: state.searchQuery,
        onSearch: actions.handleSearchChange,
      }}
      columns={columns}
      data={visibleTables}
      keyExtractor={(table) => table.name}
      onRowClick={actions.handleSelectTable}
      rowClassName={(table) =>
        state.selectedTable?.name === table.name ? "bg-primary/10 hover:bg-primary/15" : undefined
      }
      emptyState={{
        icon: Database,
        title: "Không tìm thấy bảng",
        description: "Thử từ khóa khác hoặc bỏ bộ lọc phân hệ.",
      }}
      pagination={{
        currentPage: state.currentPage,
        totalPages,
        totalItems: state.filteredTables.length,
        itemsPerPage: state.pageSize,
        onPageChange: actions.setCurrentPage,
        onItemsPerPageChange: (limit) => {
          actions.setPageSize(limit)
          actions.setCurrentPage(1)
        },
        pageSizeOptions: DATABASE_PAGE_SIZE_OPTIONS,
      }}
      extraContent={detailSheet}
    />
  )
}
