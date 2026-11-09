import { Badge } from "@/components/ui/badge"
import { ERD_NODE_WIDTH } from "../database-erd-layout"
import type { ErdPoint } from "../database-erd-layout"
import type { ModuleDef, TableDef } from "../database-reference.types"
import { useDatabaseErdNode } from "../hooks/use-database-erd-node"

import { KeyRound, Link2 } from "lucide-react"
import { memo } from "react"

// Props required to render a single draggable ERD table node card.
interface DatabaseErdNodeProps {
  table: TableDef
  modules: ModuleDef[]
  selectedModule: string
  selectedTableName: string | null
  isFocused?: boolean
  position: ErdPoint
  onSelectTable: (table: TableDef) => void
  onHoverTable?: (tableName: string | null) => void
}

/**
 * Renders an ERD table card with synchronized 24px row heights for exact orthogonal port alignment.
 * Memoized presentation component powered by `useDatabaseErdNode` hook.
 */
export const DatabaseErdNode = memo(function DatabaseErdNode({
  table,
  modules,
  selectedModule,
  selectedTableName,
  isFocused,
  position,
  onSelectTable,
  onHoverTable,
}: DatabaseErdNodeProps) {
  const {
    theme,
    linkedColumns,
    isSelected: hookSelected,
    isExternal,
    isPrimary,
    externalModuleName,
  } = useDatabaseErdNode({
    table,
    modules,
    selectedModule,
    selectedTableName,
  })
  const isSelected = isFocused ?? hookSelected

  return (
    <button
      type="button"
      onClick={() => {
        onSelectTable(table)
      }}
      onMouseEnter={() => {
        onHoverTable?.(table.name)
      }}
      onMouseLeave={() => {
        onHoverTable?.(null)
      }}
      aria-label={`Xem chi tiết bảng ${table.name}`}
      data-erd-node={table.name}
      data-erd-role={isPrimary ? "primary" : "foreign-key"}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: ERD_NODE_WIDTH,
        contain: "layout style paint",
      }}
      className={`group cursor-move touch-none overflow-hidden rounded-xl text-left transition-shadow ${
        isSelected
          ? "z-20 border-2 border-primary bg-card opacity-100 shadow-xl ring-2 ring-primary/30"
          : isExternal
            ? "z-10 border-2 border-dashed border-primary/80 bg-card/90 shadow-xs hover:z-20 hover:border-primary hover:bg-card hover:shadow-md"
            : isPrimary
              ? `z-10 border-2 ${theme.border} bg-card opacity-100 shadow-md ring-1 ring-border/60 hover:z-20 hover:shadow-xl`
              : "z-10 border border-border bg-card opacity-100 shadow-xs hover:z-20 hover:border-primary/60 hover:shadow-md"
      }`}
    >
      {/* Fixed 36px (h-9) header bar so row anchor Y coordinates stay pixel-accurate. */}
      <span
        className={`flex h-9 items-center justify-between gap-1.5 border-b border-border/80 px-3 ${
          isExternal
            ? "border-dashed bg-muted/50"
            : isPrimary
              ? theme.bgLight
              : "bg-muted/40"
        }`}
      >
        <span
          className="min-w-0 truncate font-mono text-xs font-bold text-foreground"
          title={externalModuleName ? `${table.name} (${externalModuleName})` : table.name}
        >
          {table.name}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {isExternal ? (
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-medium">
              {table.module}
            </Badge>
          ) : (
            isPrimary && (
              <Badge
                variant="outline"
                className={`rounded-full px-1.5 py-0 text-[9px] font-semibold ${theme.badge}`}
              >
                Chính
              </Badge>
            )
          )}
          <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px]">
            {table.columns.length} cột
          </Badge>
        </span>
      </span>

      {/* Body listing all linked PK and FK columns with fixed 24px (h-6) row height. */}
      <span
        className={`block px-2.5 py-2 font-mono text-[11px] ${
          isExternal ? "opacity-85 transition-opacity group-hover:opacity-100" : ""
        }`}
      >
        {linkedColumns.map((col) => (
          <span
            key={col.name}
            className="flex h-6 items-center justify-between gap-2 text-muted-foreground"
          >
            <span className="flex min-w-0 items-center gap-1.5">
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
              <span className="truncate font-medium text-foreground">{col.name}</span>
            </span>
            <span className="shrink-0 truncate max-w-[115px] text-[10px]">
              {col.fkTargetTable ? `→ ${col.fkTargetTable}` : col.type}
            </span>
          </span>
        ))}
      </span>
    </button>
  )
})
