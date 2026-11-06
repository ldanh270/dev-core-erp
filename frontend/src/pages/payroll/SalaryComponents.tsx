import {
  DataTablePage,
  type DataTableColumn,
} from "@/components/common"
import { SalaryComponentFormPage } from "@/components/features/payroll/salary-component-form-page"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE_LABELS,
} from "@/config/entities/payroll.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useMemo, useState } from "react"

import { Calculator, MoreHorizontal, Plus } from "lucide-react"

export default function SalaryComponents() {
  const { data: components, isLoading } = useSalaryComponents()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedComponent, setSelectedComponent] = useState<ISalaryComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const filteredComponents = useMemo(() => {
    if (!components) return []
    const s = searchTerm.toLowerCase()
    return components.filter(
      (c) => c.name.toLowerCase().includes(s) || c.formula.toLowerCase().includes(s),
    )
  }, [components, searchTerm])

  const paginatedComponents = useMemo(() => {
    return filteredComponents.slice((page - 1) * limit, page * limit)
  }, [filteredComponents, page, limit])

  const totalPages = Math.ceil(filteredComponents.length / limit)

  const handleCreate = () => {
    setSelectedComponent(null)
    setView("create")
  }

  const handleEdit = (comp: ISalaryComponent) => {
    setSelectedComponent(comp)
    setView("edit")
  }

  const handleCloseForm = () => {
    setView("list")
    setSelectedComponent(null)
  }

  const columns: DataTableColumn<ISalaryComponent>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className="text-muted-foreground">{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Tên thành phần",
        minWidth: "200px",
        sticky: true,
        cell: (comp) => (
          <button
            type="button"
            onClick={() => handleEdit(comp)}
            className="font-medium text-foreground hover:text-primary hover:underline text-left transition-colors"
          >
            {comp.name}
          </button>
        ),
      },
      {
        id: "type",
        header: "Loại thành phần",
        minWidth: "140px",
        cell: (comp) => (
          <span className="text-muted-foreground">{COMPONENT_TYPE_LABELS[comp.type]}</span>
        ),
      },
      {
        id: "valueType",
        header: "Kiểu giá trị",
        minWidth: "140px",
        hideBelow: "md",
        cell: (comp) => (
          <span className="text-muted-foreground">
            {COMPONENT_VALUE_TYPE_LABELS[comp.valueType]}
          </span>
        ),
      },
      {
        id: "formula",
        header: "Công thức / Giá trị",
        minWidth: "200px",
        cell: (comp) => (
          <span className="font-mono text-xs text-foreground bg-muted/50 px-2 py-1 rounded-md">
            {comp.formula}
          </span>
        ),
      },
      {
        id: "description",
        header: "Mô tả",
        minWidth: "180px",
        hideBelow: "md",
        truncate: true,
        cell: (comp) => (
          <span className="text-muted-foreground">{comp.description || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "60px",
        align: "center",
        cell: (comp) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl text-xs">
              <DropdownMenuItem onClick={() => handleEdit(comp)}>
                Sửa thành phần
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [page, limit],
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
        onSearch: (val: string) => {
          setSearchTerm(val)
          setPage(1)
        },
        placeholder: "Tìm kiếm tên, công thức...",
      }}
      primaryAction={{
        label: "Thêm thành phần",
        icon: Plus,
        onClick: handleCreate,
      }}
      emptyState={{
        icon: Calculator,
        title: "Chưa có thành phần lương",
        description: "Chưa có thành phần thu nhập hay khoản khấu trừ nào được thiết lập.",
      }}
      pagination={
        filteredComponents.length > 0
          ? {
              currentPage: page,
              totalPages,
              totalItems: filteredComponents.length,
              itemsPerPage: limit,
              onPageChange: setPage,
              onItemsPerPageChange: (newLimit) => {
                setLimit(newLimit)
                setPage(1)
              },
            }
          : undefined
      }
    />
  )
}
