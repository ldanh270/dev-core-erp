import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
  useConfirm,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TYPOGRAPHY } from "@/config/typography.config"
import type { VariableRow } from "@/hooks/payroll/use-salary-variables-management"
import { cn } from "@/lib/utils"

import { useMemo } from "react"
import { Pencil, Trash2 } from "lucide-react"

interface UseSalaryVariablesColumnsProps {
  currentPage: number
  pageSize: number
  confirm: ReturnType<typeof useConfirm>
  onEdit: (item: VariableRow) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

/**
 * Hook returning DataTableColumn definitions for salary calculation variables table.
 */
export function useSalaryVariablesColumns({
  currentPage,
  pageSize,
  confirm,
  onEdit,
  onDelete,
  isDeleting,
}: UseSalaryVariablesColumnsProps) {
  return useMemo<DataTableColumn<VariableRow>[]>(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        sticky: true,
        cell: (_, idx) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(currentPage - 1) * pageSize + idx + 1}</span>
        ),
      },
      {
        id: "code",
        header: "Mã biến",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        sticky: true,
        cell: (item) => (
          <span className={cn(TYPOGRAPHY.CELL_CODE, "font-mono font-medium text-primary")}>
            {item.code}
          </span>
        ),
      },
      {
        id: "name",
        header: "Tên hiển thị",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (item) => (
          <div className="flex flex-col">
            <span className={TYPOGRAPHY.CELL_PRIMARY}>{item.name}</span>
            {item.description && (
              <span className={TYPOGRAPHY.CELL_SECONDARY}>{item.description}</span>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: "Phân loại",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (item) => (
          <Badge
            variant={item.isSystem ? "secondary" : "outline"}
            className="rounded-full text-xs font-normal"
          >
            {item.isSystem ? "Hệ thống" : "Tùy chỉnh"}
          </Badge>
        ),
      },
      {
        id: "value",
        header: "Giá trị mặc định",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (item) => (
          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "tabular-nums")}>
            {typeof item.value === "number" ? item.value.toLocaleString("vi-VN") : item.value}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (item) => (
          <StatusPill
            label={item.isActive ? "Đang áp dụng" : "Ngừng dùng"}
            variant={item.isActive ? "success" : "neutral"}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        align: "right",
        sticky: true,
        cell: (item) => {
          if (item.isSystem) return null
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onEdit(item)
                }}
                className="size-8 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Chỉnh sửa"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: "Xác nhận xoá biến",
                    description: `Bạn có chắc chắn muốn xoá biến "${item.name}"? Hành động này không thể hoàn tác.`,
                    confirmText: "Xoá",
                    cancelText: "Huỷ",
                    variant: "destructive",
                  })
                  if (confirmed) {
                    onDelete(item.id)
                  }
                }}
                disabled={isDeleting}
                className="size-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Xoá"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )
        },
      },
    ],
    [currentPage, pageSize, onEdit, confirm, onDelete, isDeleting],
  )
}
