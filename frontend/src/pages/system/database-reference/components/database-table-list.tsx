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

import { useMemo } from "react"
import { ArrowUpRight, Database } from "lucide-react"

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
  // Map table names to their respective modules for fast lookup in relation badges.
  const moduleByTableName = useMemo(
    () => new Map(allTables.map((item) => [item.name, item.module])),
    [allTables],
  )

  // Compute pagination slices for the current table view.
  const totalPages = Math.ceil(tables.length / pageSize)
  const visibleTables = tables.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
                const relations = buildTableRelations(table, moduleByTableName)

                return (
                  <TableRow
                    key={table.name}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/25"
                  >
                    {/* Model name and physical database table name */}
                    <TableCell className="px-5 py-3">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => onSelectTable(table)}
                        className="h-auto justify-start p-0 font-mono text-sm font-semibold text-primary"
                        aria-label={`Xem chi tiết bảng ${table.name}`}
                      >
                        {table.name}
                        <ArrowUpRight className="ml-1 size-3.5" />
                      </Button>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {table.dbName}
                      </div>
                    </TableCell>

                    {/* Subsystem / Module pill badge */}
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`rounded-full text-[10px] ${getModuleTheme(table.module).badge}`}
                      >
                        {table.module}
                      </Badge>
                    </TableCell>

                    {/* Business description */}
                    <TableCell className="max-w-xl px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                      {table.description}
                    </TableCell>

                    {/* Linked relations: -> outgoing foreign key, <- incoming foreign key */}
                    <TableCell className="px-4 py-3">
                      {relations.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex max-h-44 flex-col items-start gap-1.5 overflow-y-auto pr-1">
                          {relations.map((rel) => (
                            <div
                              key={rel.id}
                              title={rel.title}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs"
                            >
                              {/* Arrow icon denoting direction: outgoing (->) or incoming (<-) */}
                              <span
                                title={
                                  rel.type === "out"
                                    ? "Outgoing FK (References)"
                                    : "Incoming FK (Referenced by)"
                                }
                                className={`shrink-0 text-xs font-extrabold ${
                                  rel.type === "out"
                                    ? "text-primary"
                                    : "text-violet-600 dark:text-violet-400"
                                }`}
                              >
                                {rel.type === "out" ? "\u2192" : "\u2190"}
                              </span>

                              {/* Target table button that opens drawer directly */}
                              <button
                                type="button"
                                onClick={() => onSelectTableByName(rel.targetTableName)}
                                className="rounded-full font-mono text-xs font-semibold text-primary hover:underline"
                              >
                                {rel.label}
                              </button>

                              {/* Cross-module tag if the related table belongs to another subsystem */}
                              {rel.module && rel.module !== table.module && (
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {rel.module}
                                </span>
                              )}
                            </div>
                          ))}
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

      {/* Pagination bar */}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={tables.length}
        itemsPerPage={pageSize}
        onPageChange={onPageChange}
      />
    </>
  )
}
