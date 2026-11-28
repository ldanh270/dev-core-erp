import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  COMPONENT_TYPE,
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE_LABELS,
} from "@/config/entities/payroll.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useMemo } from "react"

import { MoreHorizontal, Pencil } from "lucide-react"

const COMPONENT_TYPE_LABELS_MAP = new Map(Object.entries(COMPONENT_TYPE_LABELS))
const COMPONENT_VALUE_TYPE_LABELS_MAP = new Map(Object.entries(COMPONENT_VALUE_TYPE_LABELS))

interface UseSalaryComponentsColumnsProps {
  currentPage: number
  pageSize: number
  onEdit: (item: ISalaryComponent) => void
}

/**
 * Hook returning DataTableColumn definitions for salary component configuration table.
 */
export function useSalaryComponentsColumns({
  currentPage,
  pageSize,
  onEdit,
}: UseSalaryComponentsColumnsProps) {
  return useMemo<DataTableColumn<ISalaryComponent>[]>(
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
        id: "name",
        header: "Tên thành phần",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
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
        header: "Loại",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (item) => {
          const label = COMPONENT_TYPE_LABELS_MAP.get(item.type) || item.type
          return (
            <StatusPill
              label={label}
              variant={item.type === COMPONENT_TYPE.ADDITION ? "success" : "danger"}
            />
          )
        },
      },
      {
        id: "valueType",
        header: "Kiểu giá trị",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (item) => {
          const label = COMPONENT_VALUE_TYPE_LABELS_MAP.get(item.valueType) || item.valueType
          return <span className={TYPOGRAPHY.CELL_SECONDARY}>{label}</span>
        },
      },
      {
        id: "formula",
        header: "Công thức / Giá trị",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (item) => (
          <span
            className={cn(
              TYPOGRAPHY.CELL_CODE,
              "bg-muted/50 px-2 py-0.5 rounded-md font-mono text-xs",
            )}
          >
            {item.formula}
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
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-md border-border">
              <DropdownMenuItem
                onClick={() => {
                  onEdit(item)
                }}
                className="cursor-pointer text-xs font-medium"
              >
                <Pencil className="size-3.5 mr-2" /> Chỉnh sửa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [currentPage, pageSize, onEdit],
  )
}
