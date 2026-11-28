import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { TableIndexDef } from "../database-reference.types"

interface TableSheetIndexesProps {
  indexes: TableIndexDef[]
}

/**
 * Displays database indexes & constraints (Primary, Unique, Standard)
 * formatted to match the reference schema data table.
 */
export function TableSheetIndexes({ indexes }: TableSheetIndexesProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{`Chỉ Mục & Khóa (Indexes - ${indexes.length})`}</h2>
      </div>

      {/* Index table container with horizontal scroll support */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-48">Tên chỉ mục</TableHead>
              <TableHead className="min-w-48">Các cột tham gia</TableHead>
              <TableHead className="min-w-32">Loại Index</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indexes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-xs text-muted-foreground">
                  Không có index.
                </TableCell>
              </TableRow>
            ) : (
              indexes.map((index) => (
                <TableRow key={index.name}>
                  {/* Index identifier name */}
                  <TableCell className="font-mono text-xs font-semibold">{index.name}</TableCell>

                  {/* Comma-separated participating column names */}
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {index.columns.join(", ")}
                  </TableCell>

                  {/* Index type badge: Primary key vs Unique constraint vs Standard index */}
                  <TableCell className="text-xs">
                    {index.isPrimary ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-amber-500/30 bg-amber-500/15 font-semibold text-amber-700 dark:text-amber-300"
                      >
                        Primary
                      </Badge>
                    ) : index.isUnique ? (
                      <Badge variant="secondary" className="rounded-full font-medium">
                        Unique
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-full font-medium">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
