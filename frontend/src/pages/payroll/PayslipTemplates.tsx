import {
  DataTablePage,
  type DataTableColumn,
} from "@/components/common"
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
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useDeletePayslipTemplate,
  usePayslipTemplates,
} from "@/hooks/payroll/use-payslip-templates"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useMemo, useState } from "react"

import { FileSpreadsheet, MoreHorizontal, Plus } from "lucide-react"
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

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    return templates.filter((template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [templates, searchTerm])

  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice((page - 1) * limit, page * limit)
  }, [filteredTemplates, page, limit])

  const totalPages = Math.ceil(filteredTemplates.length / limit)

  const columns: DataTableColumn<IPayslipTemplate>[] = useMemo(
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
        header: "Tên mẫu phiếu lương",
        minWidth: "220px",
        sticky: true,
        cell: (template) => (
          <button
            type="button"
            onClick={() => { handleOpenView(template); }}
            className="font-medium text-foreground hover:text-primary hover:underline text-left transition-colors"
          >
            {template.name}
          </button>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        minWidth: "140px",
        hideBelow: "md",
        cell: (template) => (
          <span className="text-muted-foreground">
            {template.createdAt
              ? new Date(template.createdAt).toLocaleDateString("vi-VN")
              : "—"}
          </span>
        ),
      },
      {
        id: "createdBy",
        header: "Người tạo",
        minWidth: "160px",
        hideBelow: "md",
        cell: (template) => (
          <span className="text-muted-foreground">
            {template.createdBy?.fullName || "Hệ thống"}
          </span>
        ),
      },
      {
        id: "description",
        header: "Mô tả",
        minWidth: "200px",
        hideBelow: "md",
        truncate: true,
        cell: (template) => (
          <span className="text-muted-foreground">{template.description || "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "60px",
        align: "center",
        cell: (template) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs rounded-xl">
              <DropdownMenuItem onClick={() => { setTemplateToAssign(template); }}>
                Gán cho nhân viên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { handleOpenEdit(template); }}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => { setTemplateToDelete(template); }}
              >
                Xoá
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

  return (
    <>
      <DataTablePage<IPayslipTemplate>
        title="Mẫu phiếu lương"
        description="Quản lý mẫu phiếu lương và gán nhanh cho nhiều nhân viên."
        variant="viewport"
        data={paginatedTemplates}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(template) => template.id}
        search={{
          value: searchTerm,
          onSearch: (val: string) => {
            setSearchTerm(val)
            setPage(1)
          },
          placeholder: "Tìm kiếm mã mẫu, tên mẫu...",
        }}
        primaryAction={{
          label: "Tạo mới mẫu phiếu lương",
          icon: Plus,
          onClick: handleOpenCreate,
        }}
        emptyState={{
          icon: FileSpreadsheet,
          title: "Chưa có mẫu phiếu lương",
          description: "Tạo mẫu phiếu lương đầu tiên để gán cho các nhân sự trong tổ chức.",
        }}
        pagination={
          filteredTemplates.length > 0
            ? {
                currentPage: page,
                totalPages,
                totalItems: filteredTemplates.length,
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

      <Dialog
        open={!!templateToDelete}
        onOpenChange={() => {
          setTemplateToDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-md rounded-xl border border-border">
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
              Huỷ
            </Button>
            <Button
              variant="destructive"
              className="rounded-full px-6 shadow-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {templateToAssign && (
        <BulkAssignPayslipTemplateDialog
          open={!!templateToAssign}
          onOpenChange={(open) => {
            if (!open) setTemplateToAssign(null)
          }}
          template={templateToAssign}
        />
      )}
    </>
  )
}
