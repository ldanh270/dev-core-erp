import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { BulkAssignPayslipTemplateDialog } from "@/components/features/payroll/bulk-assign-payslip-template-dialog"
import { CreatePayslipTemplateForm } from "@/components/payroll/CreatePayslipTemplateForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useDeletePayslipTemplate,
  usePayslipTemplates,
} from "@/hooks/payroll/use-payslip-templates"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useState } from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

export default function PayslipTemplates() {
  const [view, setView] = useState<"list" | "create" | "edit" | "view">("list")
  const [selectedTemplate, setSelectedTemplate] = useState<IPayslipTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<IPayslipTemplate | null>(null)
  const [templateToAssign, setTemplateToAssign] = useState<IPayslipTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data: templates, isLoading } = usePayslipTemplates()
  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeletePayslipTemplate()

  const handleDelete = async () => {
    if (!templateToDelete) return
    try {
      await deleteTemplate(templateToDelete.id)
      toast.success(PAYROLL_MESSAGES.SUCCESS.DELETE_PAYSLIP_TEMPLATE)
      setTemplateToDelete(null)
    } catch {
      toast.error(PAYROLL_MESSAGES.ERRORS.DELETE_PAYSLIP_TEMPLATE)
    }
  }

  const handleOpenCreate = () => {
    setSelectedTemplate(null)
    setView("create")
  }

  const handleOpenEdit = (template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("edit")
  }

  const handleOpenView = (template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("view")
  }

  if (view !== "list") {
    return (
      <CreatePayslipTemplateForm
        initialData={selectedTemplate}
        isReadOnly={view === "view"}
        onSuccess={() => {
          setView("list")
          setSelectedTemplate(null)
        }}
        onCancel={() => {
          setView("list")
          setSelectedTemplate(null)
        }}
        onEdit={() => {
          if (selectedTemplate) {
            setView("edit")
          }
        }}
      />
    )
  }

  // Simple client-side filtering for demonstration
  const filteredTemplates =
    templates?.filter((template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  const paginatedTemplates = filteredTemplates.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredTemplates.length / limit)

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      <PageHeader
        title="Mẫu phiếu lương"
        description="Quản lý mẫu phiếu lương và gán nhanh cho nhiều nhân viên."
        actions={
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus size={16} /> Tạo mới mẫu phiếu lương
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
          searchPlaceholder="Tìm kiếm mã mẫu, tên mẫu..."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setPage(1)
              }}
            >
              Thiết lập lại
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                  #
                </TableHead>
                <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Tên mẫu phiếu lương
                </TableHead>
                <TableHead className="hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Ngày tạo
                </TableHead>
                <TableHead className="hidden sm:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Người tạo
                </TableHead>
                <TableHead className="hidden md:table-cell px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                  Mô tả
                </TableHead>
                <TableHead className="min-w-12.5 px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : paginatedTemplates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground border-dashed"
                  >
                    Không tìm thấy mẫu phiếu lương nào.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTemplates.map((template, index) => (
                  <TableRow key={template.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center px-4 py-3 text-muted-foreground">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                      <button
                        onClick={() => {
                          handleOpenView(template)
                        }}
                        className="hover:text-primary hover:underline focus:outline-none"
                      >
                        {template.name}
                      </button>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {template.createdAt
                        ? new Date(template.createdAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {template.createdBy?.fullName || "Hệ thống"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3 text-muted-foreground max-w-50 truncate">
                      {template.description || "N/A"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setTemplateToAssign(template)
                            }}
                          >
                            Gán cho nhân viên
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleOpenEdit(template)
                            }}
                          >
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => {
                              setTemplateToDelete(template)
                            }}
                          >
                            Xoá
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

        {filteredTemplates.length > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredTemplates.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        )}
      </PageCard>

      <Dialog
        open={!!templateToDelete}
        onOpenChange={() => {
          setTemplateToDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-106.25 rounded-xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Xác nhận xoá</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-4 text-base">
              Bạn có chắc chắn muốn xoá mẫu phiếu lương{" "}
              <span className="font-semibold text-foreground">{templateToDelete?.name}</span>? Hành
              động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-full border-border hover:bg-accent px-6 shadow-none"
              onClick={() => {
                setTemplateToDelete(null)
              }}
              disabled={isDeleting}
            >
              Huỷ bỏ
            </Button>
            <Button
              variant="destructive"
              className="rounded-full px-6 shadow-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xoá..." : "Xác nhận xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkAssignPayslipTemplateDialog
        template={templateToAssign}
        open={!!templateToAssign}
        onOpenChange={(open) => {
          if (!open) setTemplateToAssign(null)
        }}
      />
    </div>
  )
}
