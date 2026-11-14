import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { KeyRound, Link2 } from "lucide-react"

import type {
  ColumnDef,
  EnumDef,
  IncomingRelation,
  OutgoingRelation,
} from "../database-reference.types"
import { useTableSheetColumns } from "../hooks/use-table-sheet-columns"
import { ColumnConstraintsCell } from "./database-column-constraints-cell"
import { ColumnIncomingCell } from "./database-column-incoming-cell"

interface TableSheetColumnsProps {
  columns: ColumnDef[]
  incomingRelations: IncomingRelation[]
  outgoingRelations: OutgoingRelation[]
  enumDefinitions: Map<string, EnumDef>
  onSelectTable: (tableName: string) => void
}

/**
 * Renders the table's physical database columns with constraints, default values,
 * outgoing foreign key links (replacing standalone outgoing section),
 * and incoming references from other tables.
 * Presentation component powered by `useTableSheetColumns` hook.
 */
export function TableSheetColumns({
  columns,
  incomingRelations,
  outgoingRelations,
  enumDefinitions,
  onSelectTable,
}: TableSheetColumnsProps) {
  const { incomingByTargetCol, outgoingBySourceCol } = useTableSheetColumns({
    incomingRelations,
    outgoingRelations,
  })

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Danh sách cột</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {`${columns.length} trường theo schema đã sinh`}
        </p>
      </div>

      {/* Columns table with horizontal scroll support */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-36">Tên cột</TableHead>
              <TableHead className="min-w-32">Kiểu dữ liệu</TableHead>
              <TableHead className="min-w-48">Ràng buộc / mặc định</TableHead>
              <TableHead className="min-w-56">Được tham chiếu bởi</TableHead>
              <TableHead className="min-w-64">Mô tả</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map((column) => {
              const enumDef = column.isEnum ? enumDefinitions.get(column.type) : undefined
              const isFk = column.isFk || Boolean(column.fkTargetTable)
              const colIncoming = incomingByTargetCol.get(column.name) ?? []
              const colOutgoing = outgoingBySourceCol.get(column.name) ?? []

              return (
                <TableRow key={column.name} className="hover:bg-muted/50">
                  {/* Column name with primary / foreign key icon indicators */}
                  <TableCell className="align-top font-mono text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      {column.isPk && (
                        <KeyRound
                          className="size-3.5 text-amber-600 dark:text-amber-400"
                          aria-label="Khóa chính (PK)"
                        />
                      )}
                      {isFk && (
                        <Link2
                          className="size-3.5 text-sky-600 dark:text-sky-400"
                          aria-label="Khóa ngoại (FK)"
                        />
                      )}
                      <span>{column.name}</span>
                    </div>
                  </TableCell>

                  {/* Data type and optional clickable enum values */}
                  <TableCell className="align-top font-mono text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <span>{column.type}</span>
                      {enumDef && (
                        <div className="space-y-1 pt-1">
                          <span className="block font-sans text-[10px] font-semibold text-foreground">
                            Enum: {enumDef.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {enumDef.values.map((val) => (
                              <Badge
                                key={val}
                                variant="outline"
                                className="rounded-full px-1.5 py-0 text-[10px]"
                              >
                                {val}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Column Constraints & Outgoing Relations (replacing bottom section) */}
                  <TableCell className="align-top">
                    <ColumnConstraintsCell
                      column={column}
                      outgoingRelations={colOutgoing}
                      onSelectTable={onSelectTable}
                    />
                  </TableCell>

                  {/* Incoming References from other tables ("Được tham chiếu bởi") */}
                  <TableCell className="align-top">
                    <ColumnIncomingCell
                      incomingRelations={colIncoming}
                      onSelectTable={onSelectTable}
                    />
                  </TableCell>

                  {/* Business Documentation */}
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {column.description || "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
