import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/config/entities/employee-contract.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useContracts, useUpdateContract } from "@/hooks/employee-contract/use-contracts"
import type { ContractModalMode } from "@/components/features/employee-contract/ContractModal"
import type { IContract } from "@/types/employee-contract.types"

import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

export const CONTRACT_STATUS_TABS: { id: ContractStatus | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: CONTRACT_STATUS.ACTIVE, label: CONTRACT_STATUS_LABELS.active },
  { id: CONTRACT_STATUS.PENDING_SIGNATURE, label: CONTRACT_STATUS_LABELS.pending_signature },
  { id: CONTRACT_STATUS.DRAFT, label: CONTRACT_STATUS_LABELS.draft },
  { id: CONTRACT_STATUS.EXPIRED, label: CONTRACT_STATUS_LABELS.expired },
  { id: CONTRACT_STATUS.TERMINATED, label: CONTRACT_STATUS_LABELS.terminated },
]

const EMPTY_CONTRACTS: IContract[] = []

/**
 * Custom hook to encapsulate ContractsPage state, URL search sync, tabs, and mutations.
 * Adheres strictly to Single Responsibility Principle (SRP).
 *
 * @returns Filtered and paginated contract state, tab indicators, and modal action handlers
 */
export function useContractsManagement() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const activeTab = (searchParams.get("status") as ContractStatus | "all") || "all"
  const searchTerm = searchParams.get("search") || ""

  const [modalMode, setModalMode] = useState<ContractModalMode | null>(null)
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  // Query contracts with active tab filter
  const { data: contractsResponse, isLoading } = useContracts(
    activeTab !== "all" ? { status: activeTab, limit: 100 } : { limit: 100 },
  )
  const contracts = contractsResponse?.data ?? EMPTY_CONTRACTS
  const updateMutation = useUpdateContract()

  // URL search params sync handlers
  const handleTabChange = useCallback(
    (tabId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (tabId === "all") {
          next.delete("status")
        } else {
          next.set("status", tabId)
        }
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (keyword.trim()) {
          next.set("search", keyword.trim())
        } else {
          next.delete("search")
        }
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(nextPage))
        return next
      })
    },
    [setSearchParams],
  )

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set("limit", String(nextLimit))
        next.set("page", "1")
        return next
      })
    },
    [setSearchParams],
  )

  // Modal action handlers
  const handleEdit = useCallback((contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("edit")
  }, [])

  const handleRenew = useCallback((contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("renew")
  }, [])

  const handleTerminate = useCallback((contract: IContract) => {
    setSelectedContract(contract)
    setModalMode("terminate")
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalMode(null)
    setSelectedContract(null)
  }, [])

  // Formal contract signing flow
  const handleSignContract = useCallback(
    async (
      contract: IContract,
      confirmFn: (opts: { title: string; description: string }) => Promise<boolean>,
    ) => {
      const isConfirmed = await confirmFn({
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
    },
    [updateMutation],
  )

  // Search keyword filtering and pagination calculations
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
  const totalPages = Math.ceil(filteredContracts.length / limit) || 1

  const getTabCount = useCallback(
    (tabId: ContractStatus | "all") => {
      if (tabId === "all") return contracts.length
      return contracts.filter((c) => c.status === tabId).length
    },
    [contracts],
  )

  return {
    contracts: pagedContracts,
    rawContracts: contracts,
    isLoading,
    totalItems: filteredContracts.length,
    totalPages,
    currentPage: page,
    pageSize: limit,
    activeTab,
    searchTerm,
    modalMode,
    selectedContract,
    handleEdit,
    handleRenew,
    handleTerminate,
    handleCloseModal,
    getTabCount,
    handleTabChange,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    handleSignContract,
  }
}
