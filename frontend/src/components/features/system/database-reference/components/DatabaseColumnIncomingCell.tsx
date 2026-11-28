import { Button } from "@/components/ui/button"

import { ExternalLink } from "lucide-react"

import type { IncomingRelation } from "../database-reference.types"

interface ColumnIncomingCellProps {
  incomingRelations: IncomingRelation[]
  onSelectTable: (tableName: string) => void
}

/**
 * Renders incoming foreign key references from other models (<-) for a specific column.
 */
export function ColumnIncomingCell({ incomingRelations, onSelectTable }: ColumnIncomingCellProps) {
  if (incomingRelations.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex max-h-36 flex-col items-start gap-1.5 overflow-y-auto pr-1">
      {incomingRelations.map((rel, idx) => (
        <div key={idx} className="flex flex-col items-start gap-0.5">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-mono text-xs font-semibold text-primary justify-start"
            onClick={() => {
              onSelectTable(rel.sourceTable)
            }}
          >
            <span className="mr-1 font-extrabold text-violet-600 dark:text-violet-400">←</span>
            <span>
              {rel.sourceTable}.{rel.sourceColumn}
            </span>
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
  )
}
