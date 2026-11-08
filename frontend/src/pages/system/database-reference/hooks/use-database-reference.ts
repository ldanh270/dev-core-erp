import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { DbSchemaData, TableDef } from "../database-reference.types"
import { filterTables } from "../database-reference.utils"

export type ActiveTab = "tables" | "diagram"

// Duration in milliseconds to display the copy feedback badge.
const CLIPBOARD_FEEDBACK_DURATION_MS = 2000

export interface UseDatabaseReferenceParams {
  allTables: TableDef[]
  dbSchema: DbSchemaData
  pageSize: number
}

/**
 * Master coordinator hook managing state and actions for the Database Reference view.
 * Decouples table filtering, module switching, search queries, pagination, and detail drawers.
 */
export function useDatabaseReference({
  allTables,
  dbSchema,
}: UseDatabaseReferenceParams) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("tables")
  const [selectedModule, setSelectedModule] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTable, setSelectedTable] = useState<TableDef | null>(null)
  const [copiedTableName, setCopiedTableName] = useState<string | null>(null)

  // Filter tables by current module selection and multi-field keyword search.
  const filteredTables = useMemo(
    () => filterTables(allTables, dbSchema.modules, dbSchema.enums, selectedModule, searchQuery),
    [allTables, dbSchema.modules, dbSchema.enums, selectedModule, searchQuery],
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
      window.setTimeout(() => { setCopiedTableName(null); }, CLIPBOARD_FEEDBACK_DURATION_MS)
    } catch {
      toast.error("Không thể sao chép metadata. Hãy kiểm tra quyền truy cập clipboard.")
    }
  }

  return {
    state: {
      activeTab,
      selectedModule,
      searchQuery,
      currentPage,
      selectedTable,
      copiedTableName,
      filteredTables,
    },
    actions: {
      setActiveTab,
      setCurrentPage,
      setSelectedTable,
      handleSelectTable,
      handleSelectTableByName,
      handleSearchChange,
      handleModuleChange,
      handleViewErd,
      handleCopyMetadata,
    },
  }
}
