import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ColumnDef,
  EnumDef,
  IncomingRelation,
  OutgoingRelation,
} from "../database-reference.types"
import {
  ColumnConstraintsCell,
  ColumnIncomingCell,
} from "./database-table-sheet-column-cells"
import { KeyRound, Link2 } from "lucide-react"

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
 */
export function TableSheetColumns({
  columns,
  incomingRelations,
  outgoingRelations,
  enumDefinitions,
  onSelectTable,
}: TableSheetColumnsProps) {
  // Map incoming relations by target column name for fast lookup per table row.
  const incomingByTargetCol = new Map<string, IncomingRelation[]>()
  for (const rel of incomingRelations) {
    const list = incomingByTargetCol.get(rel.targetColumn) ?? []
    list.push(rel)
    incomingByTargetCol.set(rel.targetColumn, list)
  }

  // Map outgoing relations by source column name for fast lookup per table row.
  const outgoingBySourceCol = new Map<string, OutgoingRelation[]>()
  for (const rel of outgoingRelations) {
    const list = outgoingBySourceCol.get(rel.sourceColumn) ?? []
    list.push(rel)
    outgoingBySourceCol.set(rel.sourceColumn, list)
  }

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
              const columnIncoming = incomingByTargetCol.get(column.name) ?? []
              const columnOutgoing = outgoingBySourceCol.get(column.name) ?? []

              return (
                <TableRow key={column.name} className="align-top">
                  {/* Column name with PK / FK indicators */}
                  <TableCell className="font-mono text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      {column.isPk && (
                        <KeyRound className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      {column.isFk && (
                        <Link2 className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                      )}
                      <span>{column.name}</span>
                    </div>
                  </TableCell>

                  {/* Data type, array, optionality, virtual relation, and enum values */}
                  <TableCell className="font-mono text-xs">
                    {column.type}
                    {column.isArray ? "[]" : ""}
                    {column.isOptional ? "?" : ""}
                    {column.isPrismaVirtual && (
                      <Badge variant="secondary" className="ml-2 rounded-full text-[10px]">
                        Relation
                      </Badge>
                    )}
                    {enumDef && (
                      <div className="mt-2 space-y-1.5">
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          Enum: {column.type}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {enumDef.values.map((value) => (
                            <Badge
                              key={value}
                              variant="outline"
                              className="rounded-full text-[10px]"
                            >
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Constraints, Primary Key, Outgoing FK link with relation name, Default value */}
                  <TableCell>
                    <ColumnConstraintsCell
                      column={column}
                      outgoingRelations={columnOutgoing}
                      onSelectTable={onSelectTable}
                    />
                  </TableCell>

                  {/* Incoming References from other tables ("Được tham chiếu bởi") */}
                  <TableCell>
                    <ColumnIncomingCell
                      incomingRelations={columnIncoming}
                      onSelectTable={onSelectTable}
                    />
                  </TableCell>

                  {/* Human-readable business description */}
                  <TableCell className="text-xs text-muted-foreground">
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
