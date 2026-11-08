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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import {
  useDeletePayslipTemplate,
  usePayslipTemplates,
} from "@/hooks/payroll/use-payslip-templates"
import { cn, formatDate } from "@/lib/utils"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useCallback, useMemo, useState } from "react"
import { Inbox, MoreHorizontal, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

/**
 * PayslipTemplates — Standardized payslip template management page.
 * Powered by DataTablePage master component with viewport-locked internal scrolling,
 * sticky header, standardized column widths, and pinned pagination footer.
 */
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

  const handleDelete = useCallback(async () => {
    if (!templateToDelete) return
    try {
      await deleteTemplate(templateToDelete.id)
      toast.success(PAYROLL_MESSAGES.SUCCESS.DELETE_PAYSLIP_TEMPLATE)
      setTemplateToDelete(null)
    } catch {
      toast.error(PAYROLL_MESSAGES.ERRORS.DELETE_PAYSLIP_TEMPLATE)
    }
  }, [templateToDelete, deleteTemplate])

  const handleOpenCreate = useCallback(() => {
    setSelectedTemplate(null)
    setView("create")
  }, [])

  const handleOpenEdit = useCallback((template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("edit")
  }, [])

  const handleOpenView = useCallback((template: IPayslipTemplate) => {
    setSelectedTemplate(template)
    setView("view")
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return templates
    return templates.filter((template) =>
      template.name.toLowerCase().includes(s),
    )
  }, [templates, searchTerm])

  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice((page - 1) * limit, page * limit)
  }, [filteredTemplates, page, limit])

  const totalPages = Math.ceil(filteredTemplates.length / limit) || 1

  const columns: DataTableColumn<IPayslipTemplate>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: getTableColWidthPx("INDEX"),
        minWidth: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className={TYPOGRAPHY.CELL_CODE}>
            {(page - 1) * limit + index + 1}
          </span>
        ),
      },
      {
        id: "name",
        header: "Tên mẫu phiếu lương",
        width: getTableColWidthPx("TITLE"),
        minWidth: "220px",
        sticky: true,
        cell: (template) => (
          <button
            type="button"
            onClick={() => {
              handleOpenView(template)
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
        minWidth: "130px",
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
        minWidth: "160px",
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
        minWidth: "200px",
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
        minWidth: "60px",
        align: "center",
        cell: (template) => (
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
            <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setTemplateToAssign(template)
                }}
                className="gap-2"
              >
                <Users className="size-3.5" />
                Gán cho nhân viên
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleOpenEdit(template)
                }}
                className="gap-2"
              >
                <Pencil className="size-3.5" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => {
                  setTemplateToDelete(template)
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
    [page, limit, handleOpenView, handleOpenEdit],
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
          debounceMs: 400,
          onSearch: handleSearch,
          placeholder: "Tìm kiếm mã mẫu, tên mẫu...",
        }}
        primaryAction={{
          label: "Tạo mới mẫu phiếu lương",
          icon: Plus,
          onClick: handleOpenCreate,
        }}
        emptyState={{
          icon: Inbox,
          title: searchTerm.trim()
            ? "Không tìm thấy mẫu phiếu lương"
            : "Chưa có mẫu phiếu lương",
          description: searchTerm.trim()
            ? `Không có mẫu phiếu lương nào khớp với từ khóa "${searchTerm}".`
            : "Tạo mẫu phiếu lương đầu tiên để gán cho các nhân sự trong tổ chức.",
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredTemplates.length,
          itemsPerPage: limit,
          onPageChange: setPage,
          onItemsPerPageChange: (newLimit: number) => {
            setLimit(newLimit)
            setPage(1)
          },
          pageSizeOptions: [10, 20, 50],
        }}
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
