import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  COMPONENT_TYPE,
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE_LABELS,
} from "@/config/entities/payroll.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useMemo, useState } from "react"

import { Search } from "lucide-react"

interface SalaryComponentSelectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (components: ISalaryComponent[]) => void
  existingComponentIds?: string[]
}

export function SalaryComponentSelectModal({
  open,
  onOpenChange,
  onSelect,
  existingComponentIds = [],
}: SalaryComponentSelectModalProps) {
  const { data: salaryComponents, isLoading } = useSalaryComponents()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredComponents = useMemo(() => {
    if (!salaryComponents) return []
    return salaryComponents.filter((comp) => {
      // Exclude already added components if we want, or just disable them. The mockup doesn't explicitly hide them.
      // Let's just allow selecting, but we can visually indicate they are already in the form if we want.
      // For now, we only show ones not already selected.
      if (existingComponentIds.includes(comp.id)) return false

      const matchesSearch =
        comp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || comp.type === filterType

      return matchesSearch && matchesType
    })
  }, [salaryComponents, searchTerm, filterType, existingComponentIds])

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleToggleAll = () => {
    if (selectedIds.size === filteredComponents.length && filteredComponents.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredComponents.map((c) => c.id)))
    }
  }

  const handleSave = () => {
    if (!salaryComponents) return
    const selected = salaryComponents.filter((c) => selectedIds.has(c.id))
    onSelect(selected)
    onOpenChange(false)
    setTimeout(() => setSelectedIds(new Set()), 200)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setTimeout(() => setSelectedIds(new Set()), 200)
  }

  const handleReset = () => {
    setSearchTerm("")
    setFilterType("all")
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleCancel()}>
      <DialogContent className="w-full max-w-5xl max-h-[90vh] flex flex-col p-0 mx-auto overflow-hidden bg-background border border-border shadow-lg rounded-xl">
        <DialogHeader className="p-6 border-b border-border text-center shrink-0">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            Chọn thành phần
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 w-full flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 flex-1 w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm mã thành phần, tên thành phần"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-full border-border shadow-none"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-45 rounded-full border-border h-11 bg-card shadow-none focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Loại thành phần" />
                </SelectTrigger>
                <SelectContent className="border-border rounded-xl shadow-sm">
                  <SelectItem value="all" className="rounded-lg cursor-pointer focus:bg-muted">
                    Tất cả loại
                  </SelectItem>
                  <SelectItem
                    value={COMPONENT_TYPE.ADDITION}
                    className="rounded-lg cursor-pointer focus:bg-muted"
                  >
                    Cộng vào
                  </SelectItem>
                  <SelectItem
                    value={COMPONENT_TYPE.DEDUCTION}
                    className="rounded-lg cursor-pointer focus:bg-muted"
                  >
                    Khấu trừ
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-full hover:bg-muted" onClick={handleReset}>
                Thiết lập lại
              </Button>
              <Button
                variant="default"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-background flex-1 flex flex-col min-h-0">
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border cursor-pointer"
                        checked={
                          selectedIds.size === filteredComponents.length &&
                          filteredComponents.length > 0
                        }
                        onChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-foreground">Tên thành phần</TableHead>
                    <TableHead className="font-semibold text-foreground">Loại</TableHead>
                    <TableHead className="font-semibold text-foreground">Kiểu giá trị</TableHead>
                    <TableHead className="font-semibold text-foreground">Giá trị tính</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Đang tải danh sách thành phần lương...
                      </TableCell>
                    </TableRow>
                  ) : filteredComponents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground border-dashed"
                      >
                        Không tìm thấy thành phần lương nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComponents.map((comp) => (
                      <TableRow
                        key={comp.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border cursor-pointer"
                            checked={selectedIds.has(comp.id)}
                            onChange={() => handleToggleSelect(comp.id)}
                          />
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{comp.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {COMPONENT_TYPE_LABELS[comp.type]}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {COMPONENT_VALUE_TYPE_LABELS[comp.valueType]}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {comp.formula}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-border bg-muted/30 flex items-center justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            className="rounded-full border-border text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none px-6"
            onClick={handleCancel}
          >
            Huỷ bỏ
          </Button>
          <Button
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-none px-8"
            onClick={handleSave}
            disabled={selectedIds.size === 0}
          >
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
