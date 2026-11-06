import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ColumnDef, OutgoingRelation } from "../database-reference.types"
import { ExternalLink } from "lucide-react"

interface ColumnConstraintsCellProps {
  column: ColumnDef
  outgoingRelations: OutgoingRelation[]
  onSelectTable: (tableName: string) => void
}

/**
 * Renders column constraints (PK), outgoing foreign key links (->), and default values.
 */
export function ColumnConstraintsCell({
  column,
  outgoingRelations,
  onSelectTable,
}: ColumnConstraintsCellProps) {
  return (
    <div className="space-y-1.5 text-xs">
      {column.isPk && (
        <Badge
          variant="outline"
          className="rounded-full border-amber-500/30 bg-amber-500/15 font-semibold text-amber-700 dark:text-amber-300"
        >
          PK
        </Badge>
      )}

      {/* Outgoing FK links replacing standalone bottom section */}
      {outgoingRelations.length > 0 ? (
        <div className="flex flex-col gap-1">
          {outgoingRelations.map((rel, idx) => (
            <div key={idx} className="flex flex-col items-start gap-0.5">
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 font-mono text-xs font-semibold text-primary justify-start"
                onClick={() => { onSelectTable(rel.targetTable); }}
              >
                → {rel.targetTable}.{rel.targetColumn}
                <ExternalLink className="ml-1 size-3" />
              </Button>
              {rel.relationName && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  ({rel.relationName})
                </span>
              )}
            </div>
          ))}
        </div>
      ) : column.isFk && column.fkTargetTable ? (
        <div className="flex flex-col items-start gap-0.5">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-mono text-xs font-semibold text-primary justify-start"
            onClick={() => {
              if (column.fkTargetTable) onSelectTable(column.fkTargetTable)
            }}
          >
            → {column.fkTargetTable}.{column.fkTargetField}
            <ExternalLink className="ml-1 size-3" />
          </Button>
          {column.relationName && (
            <span className="font-mono text-[10px] text-muted-foreground">
              ({column.relationName})
            </span>
          )}
        </div>
      ) : null}

      {column.defaultValue && (
        <div className="font-mono text-[11px] text-muted-foreground">
          Mặc định: {column.defaultValue}
        </div>
      )}

      {!column.isPk && !column.isFk && outgoingRelations.length === 0 && !column.defaultValue && (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  )
}
