import { PAYROLL_MESSAGES } from "@/config/messages/payroll.message"
import {
  useDeletePayslipTemplate,
  usePayslipTemplates,
} from "@/hooks/payroll/use-payslip-templates"
import type { IPayslipTemplate } from "@/types/payroll.types"

import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

/**
 * Custom hook orchestrating payslip template listing, delete confirmations, and assignment dialogs.
 */
export function usePayslipTemplatesManagement() {
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

  const handleCloseForm = useCallback(() => {
    setView("list")
    setSelectedTemplate(null)
  }, [])

  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleLimitChange = useCallback((nextLimit: number) => {
    setLimit(nextLimit)
    setPage(1)
  }, [])

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    const s = searchTerm.toLowerCase().trim()
    if (!s) return templates
    return templates.filter((template) => template.name.toLowerCase().includes(s))
  }, [templates, searchTerm])

  const paginatedTemplates = useMemo(() => {
    return filteredTemplates.slice((page - 1) * limit, page * limit)
  }, [filteredTemplates, page, limit])

  const totalPages = Math.ceil(filteredTemplates.length / limit) || 1

  return {
    view,
    setView,
    selectedTemplate,
    templateToDelete,
    setTemplateToDelete,
    templateToAssign,
    setTemplateToAssign,
    searchTerm,
    page,
    limit,
    isLoading,
    isDeleting,
    paginatedTemplates,
    totalItems: filteredTemplates.length,
    totalPages,
    handleDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenView,
    handleCloseForm,
    handleSearch,
    handlePageChange,
    handleLimitChange,
  }
}
