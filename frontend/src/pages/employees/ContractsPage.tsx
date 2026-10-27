import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { AppPagination, EmptyState, PageCard, PageHeader, useConfirm } from "@/components/common"
import { ContractModal, type ContractModalMode } from "@/components/employee-contract/ContractModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from "@/config/entities/employee-contract.config"
import { ROUTES } from "@/config/routes.config"
import { useContracts, useUpdateContract } from "@/hooks/employee-contract/use-contracts"
import { routerNavigate } from "@/lib/router-navigator"
import { formatCurrency } from "@/lib/utils"
import type { IContract } from "@/types/employee-contract.types"
import { FileText, MoreHorizontal, Plus, Search } from "lucide-react"

const EMPTY_CONTRACTS: IContract[] = []

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
    case "pending_signature":
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
    case "draft":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
    case "expired":
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
    case "terminated":
      return "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const searchTerm = searchParams.get("search") || ""
  const statusFilter = searchParams.get("status") || "all"

  const { data: paginatedData, isLoading } = useContracts({
    status: statusFilter !== "all" ? statusFilter : undefined,
  })
  const contracts = paginatedData?.data ?? EMPTY_CONTRACTS
  const [keyword, setKeyword] = useState(searchTerm)

  useEffect(() => {
    setKeyword(searchTerm)
  }, [searchTerm])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ContractModalMode>("create")
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  const confirm = useConfirm()
  const updateMutation = useUpdateContract()

  const handleCreate = () => {
    routerNavigate(ROUTES.HRM.CREATE_CONTRACT)
  }

  const handleEdit = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleRenew = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("renew")
    setIsModalOpen(true)
  }

  const handleTerminate = (contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("terminate")
    setIsModalOpen(true)
  }

  const handleSign = async (contract: IContract) => {
    const isConfirmed = await confirm({
      title: "Ký hợp đồng lao động",
      description: `Bạn có chắc chắn muốn xác nhận ký hợp đồng số ${contract.contractNumber}? Trạng thái hợp đồng sẽ chuyển sang "Đang hiệu lực".`,
    })

    if (!isConfirmed) return

    const toastId = toast.loading("Đang thực hiện ký hợp đồng...")
    try {
      await updateMutation.mutateAsync({
        id: contract.id,
        data: {
          status: "active",
          signedDate: new Date().toISOString().slice(0, 10),
        },
      })
      toast.dismiss(toastId)
    } catch (_error) {
      toast.dismiss(toastId)
    }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN")
  }

  const filteredContracts = useMemo(() => contracts.filter((c) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      c.contractNumber.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term))
    )
  }), [contracts, searchTerm])

  const pagedContracts = filteredContracts.slice((page - 1) * limit, page * limit)
  const totalPages = Math.ceil(filteredContracts.length / limit)

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      <PageHeader
        title="Hợp đồng lao động"
        description="Quản lý hợp đồng lao động của toàn bộ nhân sự công ty."
        actions={
          <Button size="sm" onClick={handleCreate} className="h-8 gap-1.5 px-3 text-xs rounded-full font-semibold">
            <Plus size={13} strokeWidth={2.5} /> Thêm hợp đồng
          </Button>
        }
      />

      <PageCard className="p-0 overflow-hidden" noBorder={false}>
        <div className="flex flex-col justify-between gap-3 border-b border-border p-4 lg:flex-row lg:items-center bg-muted/20">
          <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                value={keyword}
                onChange={(event) => {
                  const val = event.target.value
                  setKeyword(val)
                  if (val === "") {
                    const params = new URLSearchParams(searchParams)
                    params.delete("search")
                    params.set("page", "1")
                    setSearchParams(params)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const params = new URLSearchParams(searchParams)
                    if (keyword.trim()) {
                      params.set("search", keyword.trim())
                    } else {
                      params.delete("search")
                    }
                    params.set("page", "1")
                    setSearchParams(params)
                  }
                }}
                placeholder="Tìm kiếm số HĐ, tiêu đề..."
                aria-label="Tìm kiếm hợp đồng"
                className="h-9 pl-9 pr-4 text-xs bg-background shadow-none border-border rounded-full"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                params.set("status", value)
                params.set("page", "1")
                setSearchParams(params)
              }}
            >
              <SelectTrigger className="h-9 w-44 text-xs bg-background border-border shadow-none rounded-full">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="active">Đang hiệu lực</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="terminated">Đã chấm dứt</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                if (keyword.trim()) {
                  params.set("search", keyword.trim())
                } else {
                  params.delete("search")
                }
                params.set("page", "1")
                setSearchParams(params)
              }}
              className="h-9 px-4 text-xs rounded-full font-semibold"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
              Đang tải dữ liệu hợp đồng...
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="Không tìm thấy hợp đồng"
                description="Không có hợp đồng lao động nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
              />
            </div>
          ) : (
              <Table className="text-sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="min-w-12.5 px-5 py-3 text-center text-[11px] font-medium text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="px-5 py-3 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Hợp đồng
                  </TableHead>
                  <TableHead className="px-5 py-3 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Loại HĐ
                  </TableHead>
                  <TableHead className="px-5 py-3 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Ngày bắt đầu
                  </TableHead>
                  <TableHead className="px-5 py-3 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Ngày kết thúc
                  </TableHead>
                  <TableHead className="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Mức lương
                  </TableHead>
                  <TableHead className="px-5 py-3 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                    Trạng thái
                  </TableHead>
                  <TableHead className="min-w-12.5 px-5 py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {pagedContracts.map((contract, index) => (
                  <TableRow key={contract.id} className="cursor-pointer transition-colors duration-100 hover:bg-muted/25">
                    <TableCell className="px-5 py-3 text-center text-muted-foreground">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-foreground">
                      <div className="flex flex-col">
                        <button
                          onClick={() => { handleEdit(contract); }}
                          className="font-bold text-left text-foreground hover:text-primary hover:underline focus:outline-none"
                        >
                          {contract.title || "Hợp đồng lao động"}
                        </button>
                        <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          {contract.contractNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-foreground whitespace-nowrap">
                      {CONTRACT_TYPE_LABELS[contract.contractType]}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(contract.startDate)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {contract.endDate ? formatDate(contract.endDate) : "Không thời hạn"}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right font-mono text-[13px] font-medium">
                      {formatCurrency(contract.salary)}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`rounded-full shadow-none font-medium px-2.5 py-0.5 border ${getStatusBadgeClass(contract.status)}`}
                      >
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => { handleEdit(contract); }}>
                            Chỉnh sửa hợp đồng
                          </DropdownMenuItem>
                          {contract.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => { handleTerminate(contract); }}
                              className="text-destructive"
                            >
                              Chấm dứt hợp đồng
                            </DropdownMenuItem>
                          )}
                          {contract.status === "pending_signature" && (
                            <DropdownMenuItem
                              onClick={() => { void handleSign(contract); }}
                              className="text-primary font-medium"
                            >
                              Ký hợp đồng
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => { handleRenew(contract); }}>
                            Gia hạn hợp đồng
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {filteredContracts.length > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={totalPages || 1}
            onPageChange={(p) => {
              const params = new URLSearchParams(searchParams)
              params.set("page", p.toString())
              setSearchParams(params)
            }}
            totalItems={filteredContracts.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              const params = new URLSearchParams(searchParams)
              params.set("limit", newLimit.toString())
              params.set("page", "1")
              setSearchParams(params)
            }}
          />
        )}
      </PageCard>

      {/* Contract Modal */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); }}
        employeeId={selectedContract?.employeeId || ""}
        mode={modalMode}
        contract={selectedContract}
      />
    </div>
  )
}
