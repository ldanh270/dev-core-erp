import { Button } from "@/components/ui/button"

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react"

import { AVAILABLE_COLUMNS } from "./issue-columns.config"

interface CustomQueryColumnsTransferProps {
  newQuerySelectedCols: string[]
  setNewQuerySelectedCols: React.Dispatch<React.SetStateAction<string[]>>
  availSelectedKey: string | null
  setAvailSelectedKey: (val: string | null) => void
  selSelectedKey: string | null
  setSelSelectedKey: (val: string | null) => void
}

/** Dual-column selector for toggling visible issue table columns. */
export function CustomQueryColumnsTransfer({
  newQuerySelectedCols,
  setNewQuerySelectedCols,
  availSelectedKey,
  setAvailSelectedKey,
  selSelectedKey,
  setSelSelectedKey,
}: CustomQueryColumnsTransferProps) {
  const isFirstSelected =
    !selSelectedKey || newQuerySelectedCols.indexOf(selSelectedKey) === 0
  const isLastSelected =
    !selSelectedKey ||
    newQuerySelectedCols.indexOf(selSelectedKey) === newQuerySelectedCols.length - 1

  const handleMoveUp = () => {
    if (!selSelectedKey) return
    setNewQuerySelectedCols((prev) => {
      const idx = prev.indexOf(selSelectedKey)
      if (idx > 0) {
        const copy = [...prev]
        const removed = copy.splice(idx, 1)
        const item = removed.at(0)
        if (item !== undefined) {
          copy.splice(idx - 1, 0, item)
        }
        return copy
      }
      return prev
    })
  }

  const handleMoveDown = () => {
    if (!selSelectedKey) return
    setNewQuerySelectedCols((prev) => {
      const idx = prev.indexOf(selSelectedKey)
      if (idx >= 0 && idx < prev.length - 1) {
        const copy = [...prev]
        const removed = copy.splice(idx, 1)
        const item = removed.at(0)
        if (item !== undefined) {
          copy.splice(idx + 1, 0, item)
        }
        return copy
      }
      return prev
    })
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Cột
      </span>
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Available Columns */}
        <div className="col-span-5 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Các cột có sẵn
          </label>
          <select
            multiple
            size={6}
            value={availSelectedKey ? [availSelectedKey] : []}
            onChange={(e) => {
              setAvailSelectedKey(e.target.value)
            }}
            className="w-full text-xs p-2 border border-border rounded-xl h-32 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {AVAILABLE_COLUMNS.filter(
              (col) => !newQuerySelectedCols.includes(col.key),
            ).map((col) => (
              <option
                key={col.key}
                value={col.key}
                className="p-1 rounded-lg hover:bg-muted cursor-pointer"
              >
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer buttons */}
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
            className="rounded-full h-8 w-8"
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
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        </div>

        {/* Selected Columns */}
        <div className="col-span-4 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Các cột được lựa chọn
          </label>
          <select
            multiple
            size={6}
            value={selSelectedKey ? [selSelectedKey] : []}
            onChange={(e) => {
              setSelSelectedKey(e.target.value)
            }}
            className="w-full text-xs p-2 border border-border rounded-xl h-32 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {newQuerySelectedCols.map((colKey) => {
              const col = AVAILABLE_COLUMNS.find((c) => c.key === colKey)
              return (
                <option
                  key={colKey}
                  value={colKey}
                  className="p-1 rounded-lg hover:bg-muted cursor-pointer"
                >
                  {col ? col.label : colKey}
                </option>
              )
            })}
          </select>
        </div>

        {/* Reorder buttons */}
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
            className="rounded-full h-7 w-7"
          >
            <ChevronsUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isFirstSelected}
            onClick={handleMoveUp}
            title="Lên một vị trí"
            className="rounded-full h-7 w-7"
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isLastSelected}
            onClick={handleMoveDown}
            title="Xuống một vị trí"
            className="rounded-full h-7 w-7"
          >
            <ChevronDown className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            disabled={isLastSelected}
            onClick={() => {
              if (selSelectedKey) {
                setNewQuerySelectedCols((prev) => {
                  const filtered = prev.filter((k) => k !== selSelectedKey)
                  return [...filtered, selSelectedKey]
                })
              }
            }}
            title="Đưa xuống cuối"
            className="rounded-full h-7 w-7"
          >
            <ChevronsDown className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
