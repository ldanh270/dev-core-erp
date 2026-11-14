import { type DataTableColumn, DataTablePage, StatusPill } from "@/components/common"
import { SalaryComponentFormPage } from "@/components/features/payroll/salary-component-form-page"
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
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import { cn } from "@/lib/utils"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useCallback, useMemo, useState } from "react"

import { Inbox, MoreHorizontal, Pencil, Plus } from "lucide-react"

/**
 * SalaryComponents — Standardized salary components management page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
export default function SalaryComponents() {
  const { data: components, isLoading } = useSalaryComponents()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedComponent, setSelectedComponent] = useState<ISalaryComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const handleCreate = useCallback(() => {
    setSelectedComponent(null)
    setView("create")
  }, [])

  const handleEdit = useCallback((comp: ISalaryComponent) => {
    setSelectedComponent(comp)
    setView("edit")
  }, [])

  const handleCloseForm = useCallback(() => {
    setView("list")
    setSelectedComponent(null)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredComponents = useMemo(() => {
    if (!components) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return components
    return components.filter(
      (c) => c.name.toLowerCase().includes(s) || c.formula.toLowerCase().includes(s),
    )
  }, [components, searchTerm])

  const paginatedComponents = useMemo(() => {
    return filteredComponents.slice((page - 1) * limit, page * limit)
  }, [filteredComponents, page, limit])

  const totalPages = Math.ceil(filteredComponents.length / limit) || 1

  const columns: DataTableColumn<ISalaryComponent>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Tên thành phần",
        width: getTableColWidthPx("TITLE"),
        minWidth: "220px",
        sticky: true,
        cell: (comp) => (
          <button
            type="button"
            onClick={() => {
              handleEdit(comp)
            }}
            className={cn(
              TYPOGRAPHY.CELL_PRIMARY,
              "font-medium text-foreground hover:text-primary hover:underline text-left cursor-pointer transition-colors block truncate max-w-full",
            )}
          >
            {comp.name}
          </button>
        ),
      },
      {
        id: "type",
        header: "Loại thành phần",
        width: getTableColWidthPx("TYPE"),
        minWidth: "140px",
        cell: (comp) => (
          <StatusPill
            label={COMPONENT_TYPE_LABELS[comp.type]}
            variant={comp.type === COMPONENT_TYPE.ADDITION ? "success" : "danger"}
          />
        ),
      },
      {
        id: "valueType",
        header: "Kiểu giá trị",
        width: getTableColWidthPx("TYPE"),
        minWidth: "130px",
        hideBelow: "md",
        cell: (comp) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>
            {COMPONENT_VALUE_TYPE_LABELS[comp.valueType]}
          </span>
        ),
      },
      {
        id: "formula",
        header: "Công thức / Giá trị",
        width: getTableColWidthPx("TITLE"),
        minWidth: "240px",
        cell: (comp) => (
          <span
            className={cn(
              TYPOGRAPHY.CELL_CODE,
              "text-foreground bg-muted/60 px-2.5 py-1 rounded-md block truncate max-w-full font-mono text-xs",
            )}
            title={comp.formula}
          >
            {comp.formula}
          </span>
        ),
      },
      {
        id: "description",
        header: "Mô tả",
        width: getTableColWidthPx("TITLE"),
        minWidth: "200px",
        hideBelow: "md",
        truncate: true,
        cell: (comp) => (
          <span className={TYPOGRAPHY.CELL_SECONDARY}>{comp.description || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        cell: (comp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Thao tác"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl text-xs">
              <DropdownMenuItem
                onClick={() => {
                  handleEdit(comp)
                }}
                className="gap-2"
              >
                <Pencil className="size-3.5" />
                Sửa thành phần
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit, handleEdit],
  )

  if (view !== "list") {
    return (
      <SalaryComponentFormPage
        initialData={selectedComponent}
        onSuccess={handleCloseForm}
        onCancel={handleCloseForm}
      />
    )
  }

  return (
    <DataTablePage<ISalaryComponent>
      title="Thành phần lương"
      description="Định nghĩa các thành phần thu nhập, khấu trừ và công thức tính lương."
      variant="viewport"
      data={paginatedComponents}
      columns={columns}
      isLoading={isLoading}
      keyExtractor={(comp) => comp.id}
      search={{
        value: searchTerm,
        debounceMs: 400,
        onSearch: handleSearch,
        placeholder: "Tìm kiếm tên, công thức...",
      }}
      primaryAction={{
        label: "Thêm thành phần",
        icon: Plus,
        onClick: handleCreate,
      }}
      emptyState={{
        icon: Inbox,
        title: searchTerm.trim() ? "Không tìm thấy thành phần lương" : "Chưa có thành phần lương",
        description: searchTerm.trim()
          ? `Không có thành phần lương nào khớp với từ khóa "${searchTerm}".`
          : "Chưa có thành phần thu nhập hay khoản khấu trừ nào được thiết lập.",
      }}
      pagination={{
        currentPage: page,
        totalPages,
        totalItems: filteredComponents.length,
        itemsPerPage: limit,
        onPageChange: setPage,
        onItemsPerPageChange: (newLimit: number) => {
          setLimit(newLimit)
          setPage(1)
        },
        pageSizeOptions: [10, 20, 50],
      }}
    />
  )
}
