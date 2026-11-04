import { AppPagination, EmptyState } from "@/components/common"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildTableRelations, getModuleTheme } from "../database-reference.utils"
import type { TableDef } from "../database-reference.types"
import { useDatabaseTableList } from "../hooks/use-database-table-list"

import { ArrowUpRight, Database } from "lucide-react"

// Maximum relationship badges to display inline before showing +N overflow indicator.
const MAX_VISIBLE_RELATION_CHIPS = 8

interface DatabaseTableListProps {
  tables: TableDef[]
  allTables: TableDef[]
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onSelectTable: (table: TableDef) => void
  onSelectTableByName: (tableName: string) => void
}

/**
 * Shows schema models in a responsive table with linked relation badges and pagination.
 * Pure UI presentation component powered by `useDatabaseTableList` hook.
 */
export function DatabaseTableList({
  tables,
  allTables,
  currentPage,
  pageSize,
  onPageChange,
  onSelectTable,
  onSelectTableByName,
}: DatabaseTableListProps) {
  const { moduleByTableName, totalPages, visibleTables } = useDatabaseTableList({
    tables,
    allTables,
    currentPage,
    pageSize,
  })

  return (
    <>
      {/* Scrollable table container preserving responsive layout without body overflow */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-56 px-5 py-3 text-xs">Model / Bảng</TableHead>
              <TableHead className="w-40 px-4 py-3 text-xs">Phân hệ</TableHead>
              <TableHead className="min-w-64 px-4 py-3 text-xs">Mô tả nghiệp vụ</TableHead>
              <TableHead className="min-w-72 px-4 py-3 text-xs">Quan hệ liên kết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-8">
                  <EmptyState
                    icon={Database}
                    title="Không tìm thấy bảng"
                    description="Thử từ khóa khác hoặc bỏ bộ lọc phân hệ."
                  />
                </TableCell>
              </TableRow>
            ) : (
              visibleTables.map((table) => {
                const theme = getModuleTheme(table.module)
                const relations = buildTableRelations(table, moduleByTableName)

                return (
                  <TableRow
                    key={table.name}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => onSelectTable(table)}
                  >
                    {/* Model name, database table name, and quick inspection action */}
                    <TableCell className="px-5 py-3 align-top font-mono">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">{table.name}</span>
                        <span className="text-[11px] text-muted-foreground">{table.dbName}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
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
                          <ArrowUpRight className="size-3" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Subsystem module badge and column count */}
                    <TableCell className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-0 text-[10px] font-medium ${theme.badge}`}
                        >
                          {table.module}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {table.columns.length} cột
                        </span>
                      </div>
                    </TableCell>

                    {/* Business documentation summary */}
                    <TableCell className="px-4 py-3 align-top text-xs text-muted-foreground">
                      <p className="line-clamp-2 max-w-xl">{table.description || "—"}</p>
                    </TableCell>

                    {/* Linked entity chips with direction arrow and module coloring */}
                    <TableCell className="px-4 py-3 align-top">
                      {relations.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
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
                                <span className="font-sans font-bold">
                                  {rel.type === "out" ? "→" : "←"}
                                </span>
                                <span>{rel.targetTableName}</span>
                              </button>
                            )
                          })}
                          {relations.length > MAX_VISIBLE_RELATION_CHIPS && (
                            <span className="self-center font-mono text-[10px] text-muted-foreground">
                              +{relations.length - MAX_VISIBLE_RELATION_CHIPS}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-3">
          <AppPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  )
}
