import type {
  DbSchemaData,
  ModuleTheme,
  TableDef,
} from "./database-reference.types"

// Normalized relationship item rendered in the "Quan hệ liên kết" column (-> outgoing, <- incoming).
export interface TableRelationItem {
  id: string
  type: "out" | "in"
  targetTableName: string
  label: string
  title: string
  module: string | null
}

// Centralized semantic Tailwind utility themes per business module (no hardcoded hex literals).
export const MODULE_THEMES: Record<string, ModuleTheme> = {
  HRM: {
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    border: "border-sky-500/30",
    bgLight: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  ATTENDANCE: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-500/30",
    bgLight: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  PAYROLL: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-500/30",
    bgLight: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  PROJECT: {
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    border: "border-violet-500/30",
    bgLight: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  RECRUITMENT: {
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    border: "border-orange-500/30",
    bgLight: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  SECURITY: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    border: "border-rose-500/30",
    bgLight: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  SYSTEM: {
    badge: "bg-muted text-muted-foreground border-border",
    border: "border-border",
    bgLight: "bg-muted/40",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

const moduleThemeMap = new Map(Object.entries(MODULE_THEMES))

export function getModuleTheme(moduleId: string): ModuleTheme {
  return moduleThemeMap.get(moduleId) ?? MODULE_THEMES.SYSTEM
}

export function filterTables(
  tables: TableDef[],
  modules: DbSchemaData["modules"],
  enums: DbSchemaData["enums"],
  selectedModule: string,
  searchQuery: string,
): TableDef[] {
  const query = searchQuery.trim().toLocaleLowerCase()
  const moduleName = new Map(modules.map((module) => [module.id, module.name]))
  const enumDefinitions = new Map(Object.entries(enums))

  return tables.filter((table) => {
    if (selectedModule !== "ALL" && table.module !== selectedModule) return false
    if (!query) return true

    return [
      table.name,
      table.dbName,
      table.description,
      table.module,
      moduleName.get(table.module) ?? "",
      ...table.columns.flatMap((column) => [
        column.name,
        column.type,
        column.description,
        column.fkTargetTable ?? "",
        ...(column.isEnum ? enumDefinitions.get(column.type)?.values ?? [] : []),
      ]),
    ].some((value) => value.toLocaleLowerCase().includes(query))
  })
}

export function formatTableSummary(table: TableDef): string {
  return JSON.stringify(
    {
      model: table.name,
      dbTable: table.dbName,
      module: table.module,
      description: table.description,
      columns: table.columns,
      indexes: table.indexes ?? [],
      outgoingRelations: table.outgoingRelations,
      incomingRelations: table.incomingRelations,
    },
    null,
    2,
  )
}

// Combine outgoing (->) and incoming (<-) foreign-key relations for a table row.
export function buildTableRelations(
  table: TableDef,
  moduleByTableName: ReadonlyMap<string, string>,
): TableRelationItem[] {
  const outgoing: TableRelationItem[] = table.outgoingRelations.map((rel, index) => ({
    id: `out-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}-${index}`,
    type: "out",
    targetTableName: rel.targetTable,
    label: `${rel.targetTable}.${rel.targetColumn}`,
    title: `References ${rel.targetTable}.${rel.targetColumn} (${table.name}.${rel.sourceColumn})`,
    module: moduleByTableName.get(rel.targetTable) ?? null,
  }))

  const incoming: TableRelationItem[] = table.incomingRelations.map((rel, index) => ({
    id: `in-${rel.sourceTable}-${rel.sourceColumn}-${rel.targetColumn}-${index}`,
    type: "in",
    targetTableName: rel.sourceTable,
    label: `${rel.sourceTable}.${rel.sourceColumn}`,
    title: `Referenced by ${rel.sourceTable}.${rel.sourceColumn} (${table.name}.${rel.targetColumn})`,
    module: moduleByTableName.get(rel.sourceTable) ?? null,
  }))

  return [...outgoing, ...incoming]
}
