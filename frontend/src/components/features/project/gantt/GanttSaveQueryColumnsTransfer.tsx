import { Button } from "@/components/ui/button"

import {
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react"

import { GANTT_AVAILABLE_COLUMNS } from "@/constants/gantt.constants"

interface GanttSaveQueryColumnsTransferProps {
  newQuerySelectedCols: string[]
  setNewQuerySelectedCols: React.Dispatch<React.SetStateAction<string[]>>
  availSelectedKey: string | null
  setAvailSelectedKey: (val: string | null) => void
  selSelectedKey: string | null
  setSelSelectedKey: (val: string | null) => void
}

/** Dual-list transfer control for configuring visible columns in custom queries. */
export function GanttSaveQueryColumnsTransfer({
  newQuerySelectedCols,
  setNewQuerySelectedCols,
  availSelectedKey,
  setAvailSelectedKey,
  selSelectedKey,
  setSelSelectedKey,
}: GanttSaveQueryColumnsTransferProps) {
  const isFirstSelected =
    !selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === 0
  const isLastSelected =
    !selSelectedKey ||
    newQuerySelectedCols.indexOf(selSelectedKey) === newQuerySelectedCols.length - 1

  const handleMoveDown = () => {
    if (!selSelectedKey) return
    setNewQuerySelectedCols((prev) => {
      const idx = prev.indexOf(selSelectedKey)
      if (idx === -1 || idx === prev.length - 1) return prev
      const nextItem = prev.at(idx + 1)
      if (nextItem === undefined) return prev
      return [
        ...prev.slice(0, idx),
        nextItem,
        selSelectedKey,
        ...prev.slice(idx + 2),
      ]
    })
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Cột
      </span>
      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-5 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Các cột có sẵn
          </label>
          <select
            multiple
            size={3}
            value={availSelectedKey ? [availSelectedKey] : []}
            onChange={(e) => {
              setAvailSelectedKey(e.target.value)
            }}
            className="w-full text-xs p-1.5 border border-border rounded-lg h-24 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {GANTT_AVAILABLE_COLUMNS.filter(
              (col) => !newQuerySelectedCols.includes(col.key),
            ).map((col) => (
              <option key={col.key} value={col.key} className="p-0.5 rounded hover:bg-muted">
                {col.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex flex-col gap-2 items-center justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={!availSelectedKey}
            onClick={() => {
              if (availSelectedKey) {
                setNewQuerySelectedCols((prev) => [...prev, availSelectedKey])
                setAvailSelectedKey(null)
              }
            }}
            className="rounded-full"
          >
            <ArrowRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={!selSelectedKey}
            onClick={() => {
              if (selSelectedKey) {
                setNewQuerySelectedCols((prev) => prev.filter((k) => k !== selSelectedKey))
                setSelSelectedKey(null)
              }
            }}
            className="rounded-full"
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        </div>

        <div className="col-span-4 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Các cột được lựa chọn
          </label>
          <select
            multiple
            size={3}
            value={selSelectedKey ? [selSelectedKey] : []}
            onChange={(e) => {
              setSelSelectedKey(e.target.value)
            }}
            className="w-full text-xs p-1.5 border border-border rounded-lg h-24 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {newQuerySelectedCols.map((colKey) => {
              const col = GANTT_AVAILABLE_COLUMNS.find((c) => c.key === colKey)
              return (
                <option key={colKey} value={colKey} className="p-0.5 rounded hover:bg-muted">
                  {col ? col.label : colKey}
                </option>
              )
            })}
          </select>
        </div>

        <div className="col-span-1 flex flex-col gap-1.5 items-center justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isFirstSelected}
            onClick={() => {
              if (selSelectedKey) {
                setNewQuerySelectedCols((prev) => {
                  const filtered = prev.filter((k) => k !== selSelectedKey)
                  return [selSelectedKey, ...filtered]
                })
              }
            }}
            title="Đưa lên đầu"
            className="rounded-full"
          >
            <ChevronsUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isLastSelected}
            onClick={handleMoveDown}
            title="Đưa xuống dưới"
            className="rounded-full"
          >
            <ChevronsDown className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
