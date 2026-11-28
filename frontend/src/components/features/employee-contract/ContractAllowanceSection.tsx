import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useState } from "react"

import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react"

import { CustomAllowanceModal } from "./CustomAllowanceModal"

export interface IAllowanceRow {
  id: string
  type: string
  value: number
}

const DEFAULT_ALLOWANCE_OPTIONS = [
  "Phụ cấp xăng xe",
  "Phụ cấp ăn nhậu",
  "Phụ cấp gửi xe",
  "Phụ cấp ăn trưa",
  "Phụ cấp điện thoại",
  "Phụ cấp trang phục",
]

export interface ContractAllowanceSectionProps {
  allowanceRows: IAllowanceRow[]
  onAddRow: () => void
  onUpdateRow: (id: string, field: "type" | "value", val: string | number) => void
  onRemoveRow: (id: string) => void
}

export function ContractAllowanceSection({
  allowanceRows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}: ContractAllowanceSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [allowanceOptions, setAllowanceOptions] = useState<string[]>(DEFAULT_ALLOWANCE_OPTIONS)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)

  const handleAddAllowanceOption = (name: string) => {
    if (!allowanceOptions.includes(name)) {
      setAllowanceOptions((prev) => [...prev, name])
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 flex items-center justify-between bg-muted/50 border-b border-border">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 font-semibold text-sm text-foreground"
        >
          <span className="text-muted-foreground">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
          <h2 className="font-semibold text-foreground">Phụ cấp & Thưởng cố định</h2>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          className="text-primary hover:text-primary/90 text-xs font-semibold gap-1 rounded-full"
        >
          <PlusCircle size={15} /> Thêm dòng
        </Button>
      </div>

      {isOpen && (
        <div className="p-6">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-medium">STT</TableHead>
                <TableHead className="text-xs font-medium">Loại phụ cấp</TableHead>
                <TableHead className="w-48 text-xs font-medium">Số tiền (VNĐ)</TableHead>
                <TableHead className="w-16 text-center text-xs font-medium">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowanceRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                    Chưa có khoản phụ cấp nào được thêm. Bấm "+ Thêm dòng" để thêm mới.
                  </TableCell>
                </TableRow>
              ) : (
                allowanceRows.map((row, idx) => (
                  <AllowanceTableRow
                    key={row.id}
                    row={row}
                    index={idx}
                    allowanceOptions={allowanceOptions}
                    onOpenCustomModal={() => setIsCustomModalOpen(true)}
                    onUpdateRow={onUpdateRow}
                    onRemoveRow={onRemoveRow}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CustomAllowanceModal
        open={isCustomModalOpen}
        onOpenChange={setIsCustomModalOpen}
        onAddAllowanceOption={handleAddAllowanceOption}
      />
    </div>
  )
}

function AllowanceTableRow({
  row,
  index,
  allowanceOptions,
  onOpenCustomModal,
  onUpdateRow,
  onRemoveRow,
}: {
  row: IAllowanceRow
  index: number
  allowanceOptions: string[]
  onOpenCustomModal: () => void
  onUpdateRow: (id: string, field: "type" | "value", val: string | number) => void
  onRemoveRow: (id: string) => void
}) {
  return (
    <TableRow>
      <TableCell className="text-center text-xs font-mono font-medium text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell className="p-2">
        <Select
          value={row.type}
          onValueChange={(val) => {
            if (val === "__ADD_NEW__") {
              onOpenCustomModal()
            } else {
              onUpdateRow(row.id, "type", val)
            }
          }}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder="Khoản phụ cấp" />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl">
            {allowanceOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
            <div className="p-1 border-t border-border mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenCustomModal()
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-primary font-medium hover:bg-muted rounded-lg flex items-center gap-1.5"
              >
                <PlusCircle size={13} /> Thêm phụ cấp mới...
              </button>
            </div>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="number"
          placeholder="0"
          value={row.value || ""}
          onChange={(e) => onUpdateRow(row.id, "value", Number(e.target.value))}
          className="rounded-full text-right font-mono"
        />
      </TableCell>
      <TableCell className="text-center p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveRow(row.id)}
          className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full"
        >
          <Trash2 size={15} />
        </Button>
      </TableCell>
    </TableRow>
  )
}
