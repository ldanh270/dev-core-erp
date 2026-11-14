import type { DataTableColumn } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useMemo } from "react"

import { ArrowUpRight } from "lucide-react"

import type { TableDef } from "../database-reference.types"
import { buildTableRelations, getModuleTheme } from "../database-reference.utils"

// Maximum relationship badges to display inline before showing +N overflow indicator.
const MAX_VISIBLE_RELATION_CHIPS = 8

export interface UseDatabaseTableColumnsParams {
  allTables: TableDef[]
  onSelectTable: (table: TableDef) => void
  onSelectTableByName: (tableName: string) => void
}

/**
 * Custom hook creating DataTablePage columns configuration for database tables catalog.
 */
export function useDatabaseTableColumns({
  allTables,
  onSelectTable,
  onSelectTableByName,
}: UseDatabaseTableColumnsParams) {
  const moduleByTableName = useMemo(
    () => new Map(allTables.map((item) => [item.name, item.module])),
    [allTables],
  )

  const columns = useMemo<DataTableColumn<TableDef>[]>(
    () => [
      {
        id: "model",
        header: "Model / Bảng",
        minWidth: "220px",
        cell: (table) => (
          <div className="flex flex-col gap-1 py-1 font-mono">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {table.name}
              </span>
              <span className="text-[11px] text-muted-foreground">{table.dbName}</span>
            </div>
            <div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-6 rounded-full px-2 text-[11px] text-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTable(table)
                }}
                aria-label={`Xem chi tiết bảng ${table.name}`}
              >
                Chi tiết
                <ArrowUpRight className="ml-1 size-3" />
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: "module",
        header: "Phân hệ",
        width: "140px",
        minWidth: "140px",
        cell: (table) => {
          const theme = getModuleTheme(table.module)
          return (
            <div className="flex items-center py-1">
              <Badge
                variant="outline"
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${theme.badge}`}
              >
                {table.module}
              </Badge>
            </div>
          )
        },
      },
      // Dedicated column count metric column.
      {
        id: "columnsCount",
        header: "Số cột",
        width: "90px",
        minWidth: "90px",
        align: "center",
        cell: (table) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {table.columns.length}
          </span>
        ),
      },
      // Dedicated database index count metric column.
      {
        id: "indexesCount",
        header: "Indexes",
        width: "90px",
        minWidth: "90px",
        align: "center",
        cell: (table) => (
          <span className="font-mono text-xs text-muted-foreground">
            {table.indexes?.length ?? 0}
          </span>
        ),
      },
      {
        id: "description",
        header: "Mô tả nghiệp vụ",
        minWidth: "240px",
        cell: (table) => (
          <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground py-1">
            {table.description || "—"}
          </p>
        ),
      },
      {
        id: "relations",
        header: "Quan hệ liên kết",
        minWidth: "280px",
        cell: (table) => {
          const relations = buildTableRelations(table, moduleByTableName)
          if (relations.length === 0) {
            return <span className="text-xs text-muted-foreground py-1 block">—</span>
          }
          const theme = getModuleTheme(table.module)
          return (
            <div className="flex flex-wrap gap-1 py-1">
              {relations.slice(0, MAX_VISIBLE_RELATION_CHIPS).map((rel) => {
                const relTheme = rel.module ? getModuleTheme(rel.module) : theme
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTableByName(rel.targetTableName)
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors hover:bg-muted ${relTheme.badge}`}
                    title={rel.title}
                  >
                    <span className="font-sans font-bold">{rel.type === "out" ? "→" : "←"}</span>
                    <span>{rel.targetTableName}</span>
                  </button>
                )
              })}
              {/* Render interactive rounded pill badge for remaining overflow relationships */}
              {relations.length > MAX_VISIBLE_RELATION_CHIPS && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectTable(table)
                  }}
                  className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                  title={`Xem thêm ${relations.length - MAX_VISIBLE_RELATION_CHIPS} quan hệ liên kết khác trong chi tiết bảng`}
                  aria-label={`Xem thêm ${relations.length - MAX_VISIBLE_RELATION_CHIPS} quan hệ`}
                >
                  +{relations.length - MAX_VISIBLE_RELATION_CHIPS}
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [moduleByTableName, onSelectTable, onSelectTableByName],
  )

  return { columns, moduleByTableName }
}
