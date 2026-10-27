import { AppPagination, DataTableToolbar, EmptyState, PageCard, PageHeader } from "@/components/common"
import { SalaryComponentFormPage } from "@/components/features/payroll/salary-component-form-page"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  COMPONENT_TYPE_LABELS,
  COMPONENT_VALUE_TYPE_LABELS,
} from "@/config/entities/payroll.config"
import { useSalaryComponents } from "@/hooks/payroll/use-salary-components"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useState } from "react"

import { Calculator, Loader2, MoreHorizontal, Plus } from "lucide-react"

export default function SalaryComponents() {
  const { data: components, isLoading, isError } = useSalaryComponents()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedComponent, setSelectedComponent] = useState<ISalaryComponent | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const filteredComponents =
    components?.filter((c) => {
      const s = searchTerm.toLowerCase()
      return c.name.toLowerCase().includes(s) || c.formula.toLowerCase().includes(s)
    }) || []

  const paginatedComponents = filteredComponents.slice((page - 1) * limit, page * limit)
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
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      <PageHeader
        title="Thành phần lương"
        description="Định nghĩa các thành phần thu nhập, khấu trừ và công thức tính lương."
        actions={
          <Button className="gap-2 rounded-full font-semibold" onClick={handleCreate}>
            <Plus size={16} /> Thêm thành phần
          </Button>
        }
      />

      <PageCard className="overflow-hidden p-0" noBorder={false}>
        <DataTableToolbar
          searchQuery={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm kiếm tên, công thức..."
        />

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                  #
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Tên thành phần
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Loại thành phần
                </TableHead>
                <TableHead className="hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Kiểu giá trị
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Công thức / Giá trị tĩnh
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase hidden md:table-cell whitespace-nowrap">
                  Mô tả
                </TableHead>
                <TableHead className="min-w-12.5 px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-destructive">
                    Lỗi khi tải danh sách thành phần lương.
                  </TableCell>
                </TableRow>
              ) : paginatedComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <EmptyState
                      icon={Calculator}
                      title="Chưa có thành phần lương"
                      description="Chưa có thành phần thu nhập hay khoản khấu trừ nào được thiết lập."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedComponents.map((comp, index) => (
                  <TableRow key={comp.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell className="px-4 py-3 text-muted-foreground text-center">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(comp)}
                        className="hover:text-primary hover:underline focus:outline-none"
                      >
                        {comp.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {COMPONENT_TYPE_LABELS[comp.type]}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {COMPONENT_VALUE_TYPE_LABELS[comp.valueType]}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 truncate font-mono text-xs"
                      title={comp.formula}
                    >
                      {comp.formula}
                    </TableCell>
                    <TableCell className="px-4 py-3 hidden md:table-cell text-muted-foreground  truncate">
                      {comp.description || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleEdit(comp)}>
                            Sửa thành phần
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredComponents.length > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredComponents.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        )}
      </PageCard>
    </div>
  )
}
