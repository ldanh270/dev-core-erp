import { Badge } from "@/components/ui/badge"
import { ERD_NODE_WIDTH } from "../database-erd-layout"
import type { ErdPoint } from "../database-erd-layout"
import type { ModuleDef, TableDef } from "../database-reference.types"
import { useDatabaseErdNode } from "../hooks/use-database-erd-node"

import { KeyRound, Link2 } from "lucide-react"

// Props required to render a single draggable ERD table node card.
interface DatabaseErdNodeProps {
  table: TableDef
  modules: ModuleDef[]
  selectedModule: string
  selectedTableName: string | null
  position: ErdPoint
  onSelectTable: (table: TableDef) => void
}

/**
 * Renders an ERD table card with internal tables, dimmed external cross-module tables, and linked fields.
 * Pure UI presentation component powered by `useDatabaseErdNode` hook.
 */
export function DatabaseErdNode({
  table,
  modules,
  selectedModule,
  selectedTableName,
  position,
  onSelectTable,
}: DatabaseErdNodeProps) {
  const {
    theme,
    linkedColumns,
    isSelected,
    isExternal,
    isPrimary,
    externalModuleName,
  } = useDatabaseErdNode({
    table,
    modules,
    selectedModule,
    selectedTableName,
  })

  return (
    <button
      type="button"
      onClick={() => onSelectTable(table)}
      aria-label={`Xem chi tiết bảng ${table.name}`}
      data-erd-node={table.name}
      data-erd-role={isPrimary ? "primary" : "foreign-key"}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: ERD_NODE_WIDTH,
      }}
      className={`group cursor-move touch-none overflow-hidden rounded-xl text-left transition-shadow ${
        isSelected
          ? "z-20 border-2 border-primary bg-card opacity-100 shadow-xl ring-2 ring-primary/30"
          : isExternal
            ? "z-0 border-2 border-dashed border-primary/80 bg-card/75 shadow-none hover:z-20 hover:border-primary hover:bg-card hover:shadow-md"
            : isPrimary
              ? `z-10 border-2 ${theme.border} bg-card opacity-100 shadow-lg ring-1 ring-border/60 hover:z-20 hover:shadow-xl`
              : "z-0 border border-border/80 bg-card opacity-100 shadow-xs hover:z-20 hover:border-border hover:shadow-md"
      }`}
    >
      {/* Header bar with model name, primary table badge ("Chính"), and total column count. */}
      <span
        className={`flex items-center justify-between gap-2 border-b border-border/80 px-3 py-2 ${
          isExternal
            ? "border-dashed bg-muted/50"
            : isPrimary
              ? theme.bgLight
              : "bg-muted/40"
        }`}
      >
        <span className="min-w-0 break-all font-mono text-xs font-bold text-foreground">
          {table.name}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {isPrimary && (
            <Badge
              variant="outline"
              className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${theme.badge}`}
            >
              Chính
            </Badge>
          )}
          <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
            {table.columns.length} cột
          </Badge>
        </span>
      </span>

      {/* Body listing all linked PK and FK columns with outgoing target table indicators. */}
      <span
        className={`block space-y-1 p-2.5 font-mono text-[11px] ${
          isExternal ? "opacity-75 transition-opacity group-hover:opacity-100" : ""
        }`}
      >
        {isExternal && externalModuleName && (
          <span className="block truncate border-b border-border/50 pb-1 font-sans text-[10px] text-muted-foreground">
            {externalModuleName}
          </span>
        )}
        {linkedColumns.map((col) => (
          <span
            key={col.name}
            className="flex items-center justify-between gap-2 text-muted-foreground"
          >
            <span className="flex min-w-0 items-center gap-1">
              {col.isPk && (
                <KeyRound
                  className="size-3 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-label="PK"
                />
              )}
              {col.isFk && (
                <Link2
                  className="size-3 shrink-0 text-sky-600 dark:text-sky-400"
                  aria-label="FK"
                />
              )}
              <span className="truncate text-foreground">{col.name}</span>
            </span>
            <span className="shrink-0 text-[10px]">
              {col.fkTargetTable ? `→ ${col.fkTargetTable}` : col.type}
            </span>
          </span>
        ))}
      </span>
    </button>
  )
}
