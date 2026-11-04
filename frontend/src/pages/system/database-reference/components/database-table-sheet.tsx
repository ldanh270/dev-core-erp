import { AppDrawer } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DbSchemaData, TableDef } from "../database-reference.types"
import { getModuleTheme } from "../database-reference.utils"
import { useDatabaseTableSheet } from "../hooks/use-database-table-sheet"
import { TableSheetColumns } from "./database-table-sheet-columns"
import { TableSheetIndexes } from "./database-table-sheet-indexes"

import { Check, Copy, Network } from "lucide-react"

interface DatabaseTableSheetProps {
  table: TableDef | null
  schema: DbSchemaData
  onClose: () => void
  onSelectTable: (tableName: string) => void
  onViewErd: (moduleId: string) => void
  copied: boolean
  onCopy: (text: string) => void
}

/**
 * Slide-over drawer presenting a selected table's overview, columns, and indexes.
 * Pure UI presentation component powered by `useDatabaseTableSheet` hook.
 */
export function DatabaseTableSheet({
  table,
  schema,
  onClose,
  onSelectTable,
  onViewErd,
  copied,
  onCopy,
}: DatabaseTableSheetProps) {
  const {
    module,
    enumDefinitions,
    indexes,
    metricCounts,
    handleCopyMetadata,
  } = useDatabaseTableSheet({
    table,
    schema,
    onCopy,
  })

  return (
    <AppDrawer
      isOpen={table !== null}
      onClose={onClose}
      title={table?.name}
      description={table?.description}
      widthClassName="w-full sm:max-w-5xl"
      className="max-w-5xl"
      contentClassName="hide-scrollbar"
    >
      {table && (
        <div className="space-y-6 p-5 sm:p-7">
          {/* Overview summary card with metadata badges and quick actions */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full ${getModuleTheme(table.module).badge}`}
                  >
                    {module?.name ?? table.module}
                  </Badge>
                  {table.dbName !== table.name && (
                    <Badge variant="secondary" className="rounded-full font-mono">
                      @@map(&quot;{table.dbName}&quot;)
                    </Badge>
                  )}
                  <Badge variant="outline" className="rounded-full">
                    {schema.metadata.schemaEngine}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  Model: {table.name} · Database table: {table.dbName}
                </p>
              </div>

              {/* Action buttons: Focus on ERD canvas & Copy JSON definition */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => onViewErd(table.module)}
                >
                  <Network className="mr-1.5 size-3.5" />
                  Xem trên ERD
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleCopyMetadata}
                >
                  {copied ? <Check className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
                  {copied ? "Đã sao chép" : "Sao chép metadata"}
                </Button>
              </div>
            </div>

            {/* Metric counters: Columns count, Indexes count, Outgoing and Incoming FKs */}
            <div className="mt-4 grid gap-3 border-t border-border pt-4 grid-cols-2 sm:grid-cols-4">
              {metricCounts.map((item) => (
                <div key={item.label}>
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                  <div className="mt-1 font-mono text-base font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
            {module?.description && (
              <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                {module.description}
              </p>
            )}
          </section>

          {/* Physical Columns Section with outgoing FKs and incoming references integrated */}
          <TableSheetColumns
            columns={table.columns}
            incomingRelations={table.incomingRelations}
            outgoingRelations={table.outgoingRelations}
            enumDefinitions={enumDefinitions}
            onSelectTable={onSelectTable}
          />

          {/* Database Indexes & Constraints Section */}
          <TableSheetIndexes indexes={indexes} />
        </div>
      )}
    </AppDrawer>
  )
}
