import {
  type DataTableColumn,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn, formatDate } from "@/lib/utils"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useMemo } from "react"
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react"

interface UsePayslipTemplatesColumnsProps {
  page: number
  limit: number
  onOpenView: (template: IPayslipTemplate) => void
  onOpenEdit: (template: IPayslipTemplate) => void
  onAssign: (template: IPayslipTemplate) => void
  onDelete: (template: IPayslipTemplate) => void
}

/**
 * Hook returning DataTableColumn definitions for payslip template management table.
 */
export function usePayslipTemplatesColumns({
  page,
  limit,
  onOpenView,
  onOpenEdit,
  onAssign,
  onDelete,
}: UsePayslipTemplatesColumnsProps) {
  return useMemo<DataTableColumn<IPayslipTemplate>[]>(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Tên mẫu phiếu lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (template) => (
          <button
            type="button"
            onClick={() => {
              onOpenView(template)
            }}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "font-medium text-foreground hover:text-primary hover:underline text-left cursor-pointer transition-colors block truncate max-w-full",
            )}
          >
            {template.name}
          </button>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        width: getTableColWidthPx("DATE"),
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        hideBelow: "md",
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_DATE}>
            {template.createdAt ? formatDate(template.createdAt) : "—"}
          </span>
        ),
      },
      {
        id: "createdBy",
        header: "Người tạo",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        hideBelow: "md",
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>
            {template.createdBy?.fullName || "Hệ thống"}
          </span>
        ),
      },
      {
        id: "description",
        header: "Mô tả",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        hideBelow: "md",
        truncate: true,
        cell: (template) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>{template.description || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        align: "center",
        cell: (template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  onAssign(template)
                }}
                className="gap-2 cursor-pointer"
              >
                <Users className="size-3.5" />
                Gán cho nhân viên
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onOpenEdit(template)
                }}
                className="gap-2 cursor-pointer"
              >
                <Pencil className="size-3.5" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                onClick={() => {
                  onDelete(template)
                }}
              >
                <Trash2 className="size-3.5" />
                Xoá mẫu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit, onOpenView, onOpenEdit, onAssign, onDelete],
  )
}
