import {
  DataTablePage,
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  useConfirm,
} from "@/components/common"
import {
  ContractModal,
  type ContractModalMode,
} from "@/components/employee-contract/ContractModal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  getContractStatusVariant,
  type ContractStatus,
} from "@/config/entities/employee-contract.config"
import { ROUTES } from "@/config/routes.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useContracts, useUpdateContract } from "@/hooks/employee-contract/use-contracts"
import { routerNavigate } from "@/lib/router-navigator"
import { formatCurrency } from "@/lib/utils"
import type { IContract } from "@/types/employee-contract.types"

import { useCallback, useMemo, useState } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

const EMPTY_CONTRACTS: IContract[] = []

const STATUS_TABS: { id: ContractStatus | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: CONTRACT_STATUS.ACTIVE, label: CONTRACT_STATUS_LABELS.active },
  { id: CONTRACT_STATUS.PENDING_SIGNATURE, label: CONTRACT_STATUS_LABELS.pending_signature },
  { id: CONTRACT_STATUS.DRAFT, label: CONTRACT_STATUS_LABELS.draft },
  { id: CONTRACT_STATUS.EXPIRED, label: CONTRACT_STATUS_LABELS.expired },
  { id: CONTRACT_STATUS.TERMINATED, label: CONTRACT_STATUS_LABELS.terminated },
]

/**
 * Standardized Employee Contracts management page.
 * Powered by DataTablePage master primitive with internal viewport scrolling,
 * 400ms search debouncing, semantic StatusPill, and drawer/modal slots.
 */
export default function ContractsPage() {
  // ==========================================
  // 1. URL Query State & Filters
  // ==========================================
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const searchTerm = searchParams.get("search") || ""
  const statusFilter = (searchParams.get("status") as ContractStatus | "all") || "all"

  // ==========================================
  // 2. Data Queries & Mutation Hooks
  // ==========================================
  const { data: paginatedData, isLoading } = useContracts({
    status: statusFilter !== "all" ? statusFilter : undefined,
  })
  const contracts = paginatedData?.data ?? EMPTY_CONTRACTS
  const confirm = useConfirm()
  const updateMutation = useUpdateContract()

  // Modal State for Contract actions
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ContractModalMode>("create")
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  // ==========================================
  // 3. Action Handlers
  // ==========================================
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

  const handleSign = useCallback(async (contract: IContract) => {
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
          status: CONTRACT_STATUS.ACTIVE,
          signedDate: new Date().toISOString().slice(0, 10),
        },
      })
      toast.dismiss(toastId)
    } catch (_error) {
      toast.dismiss(toastId)
    }
  }, [confirm, updateMutation])

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN")
  }

  // Filter contracts locally by keyword (contractNumber, title)
  const filteredContracts = useMemo(() => {
    if (!searchTerm) return contracts
    const term = searchTerm.toLowerCase()
    return contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(term) ||
        (c.title && c.title.toLowerCase().includes(term)),
    )
  }, [contracts, searchTerm])

  const pagedContracts = useMemo(
    () => filteredContracts.slice((page - 1) * limit, page * limit),
    [filteredContracts, page, limit],
  )
  const totalPages = Math.ceil(filteredContracts.length / limit)

  // Calculate live item count for each status tab
  const getTabCount = (tabId: ContractStatus | "all") => {
    if (tabId === "all") return contracts.length
    return contracts.filter((c) => c.status === tabId).length
  }

  // ==========================================
  // 4. Table Columns Definition
  // ==========================================
  const columns: DataTableColumn<IContract>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        align: "center",
        width: `${TABLE_COL_WIDTH.INDEX}px`,
        minWidth: `${TABLE_COL_WIDTH.INDEX}px`,
        sticky: true,
        cell: (_contract, index) => (
          <span className="text-muted-foreground text-xs">
            {(page - 1) * limit + index + 1}
          </span>
        ),
      },
      {
        id: "contract",
        header: "Hợp đồng",
        width: `${TABLE_COL_WIDTH.TITLE}px`,
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (contract) => (
          <div className="flex flex-col justify-center min-w-0">
            <button
              type="button"
              onClick={() => {
                handleEdit(contract)
              }}
              className="font-semibold text-left text-sm leading-5 text-foreground hover:text-primary transition-colors truncate focus:outline-none cursor-pointer"
              title={contract.title || "Hợp đồng lao động"}
            >
              {contract.title || "Hợp đồng lao động"}
            </button>
            <span className="font-mono text-xs leading-4 text-muted-foreground truncate">
              {contract.contractNumber}
            </span>
          </div>
        ),
      },
      {
        id: "type",
        header: "Loại HĐ",
        width: `${TABLE_COL_WIDTH.TYPE}px`,
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (contract) => (
          <span className="text-foreground whitespace-nowrap">
            {CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}
          </span>
        ),
      },
      {
        id: "startDate",
        header: "Ngày bắt đầu",
        width: `${TABLE_COL_WIDTH.DATE}px`,
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        hideBelow: "lg",
        cell: (contract) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(contract.startDate)}
          </span>
        ),
      },
      {
        id: "endDate",
        header: "Ngày kết thúc",
        width: `${TABLE_COL_WIDTH.DATE}px`,
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        hideBelow: "lg",
        cell: (contract) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {contract.endDate ? formatDate(contract.endDate) : "Không thời hạn"}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Mức lương",
        align: "right",
        width: `${TABLE_COL_WIDTH.CURRENCY}px`,
        minWidth: `${TABLE_COL_WIDTH.CURRENCY}px`,
        cell: (contract) => (
          <span className="font-mono font-medium text-foreground whitespace-nowrap">
            {formatCurrency(contract.salary)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: `${TABLE_COL_WIDTH.STATUS}px`,
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        cell: (contract) => (
          <StatusPill
            label={CONTRACT_STATUS_LABELS[contract.status] || contract.status}
            variant={getContractStatusVariant(contract.status)}
          />
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        align: "center",
        width: `${TABLE_COL_WIDTH.ACTIONS}px`,
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        cell: (contract) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Mở menu thao tác</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  onClick={() => {
                    handleEdit(contract)
                  }}
                  className="cursor-pointer"
                >
                  Chỉnh sửa hợp đồng
                </DropdownMenuItem>
                {contract.status === CONTRACT_STATUS.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => {
                      handleTerminate(contract)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Chấm dứt hợp đồng
                  </DropdownMenuItem>
                )}
                {contract.status === CONTRACT_STATUS.PENDING_SIGNATURE && (
                  <DropdownMenuItem
                    onClick={() => {
                      void handleSign(contract)
                    }}
                    className="cursor-pointer text-primary font-medium focus:text-primary"
                  >
                    Ký hợp đồng
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    handleRenew(contract)
                  }}
                  className="cursor-pointer"
                >
                  Gia hạn hợp đồng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [page, limit, handleSign],
  )

  // ==========================================
  // 5. Render Master DataTablePage
  // ==========================================
  return (
    <DataTablePage<IContract>
      title="Hợp đồng lao động"
      description="Quản lý hợp đồng lao động của toàn bộ nhân sự công ty."
      primaryAction={{
        label: "Thêm hợp đồng",
        icon: Plus,
        onClick: handleCreate,
      }}
      tabs={{
        items: STATUS_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: getTabCount(tab.id),
        })),
        activeTab: statusFilter,
        onTabChange: (id) => {
          const params = new URLSearchParams(searchParams)
          params.set("status", id)
          params.set("page", "1")
          setSearchParams(params)
        },
      }}
      search={{
        placeholder: "Tìm kiếm số HĐ, tiêu đề...",
        value: searchTerm,
        onSearch: (value) => {
          const params = new URLSearchParams(searchParams)
          if (value.trim()) {
            params.set("search", value.trim())
          } else {
            params.delete("search")
          }
          params.set("page", "1")
          setSearchParams(params)
        },
      }}
      columns={columns}
      data={pagedContracts}
      isLoading={isLoading}
      emptyState={{
        title: "Chưa có hợp đồng nào",
        description: "Bắt đầu tạo hợp đồng lao động đầu tiên cho nhân sự.",
      }}
      onResetFilters={() => {
        setSearchParams(new URLSearchParams())
      }}
      pagination={{
        currentPage: page,
        totalPages: totalPages || 1,
        totalItems: filteredContracts.length,
        itemsPerPage: limit,
        onPageChange: (newPage) => {
          const params = new URLSearchParams(searchParams)
          params.set("page", newPage.toString())
          setSearchParams(params)
        },
        onItemsPerPageChange: (newLimit) => {
          const params = new URLSearchParams(searchParams)
          params.set("limit", newLimit.toString())
          params.set("page", "1")
          setSearchParams(params)
        },
        pageSizeOptions: [10, 20, 50, 100],
      }}
      extraContent={
        <ContractModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
          }}
          employeeId={selectedContract?.employeeId || ""}
          mode={modalMode}
          contract={selectedContract}
        />
      }
    />
  )
}
