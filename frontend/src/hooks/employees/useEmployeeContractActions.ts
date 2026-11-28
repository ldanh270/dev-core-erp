import { useConfirm } from "@/components/common"
import type { ContractModalMode } from "@/components/features/employee-contract/ContractModal"
import { useUpdateContract } from "@/hooks/employee-contract/use-contracts"
import type { IContract } from "@/types/employee-contract.types"

import { useState } from "react"

import { toast } from "sonner"

/**
 * Encapsulates modal dialog controls and mutation actions for employee contracts.
 * Provides handlers for contract creation, editing, renewal, termination, and formal signing.
 *
 * @returns State and event handlers for employee contract actions
 */
export function useEmployeeContractActions() {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractModalMode, setContractModalMode] = useState<ContractModalMode>("create")
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  const confirm = useConfirm()
  const updateMutation = useUpdateContract()

  const handleCreateContract = () => {
    setContractModalMode("create")
    setSelectedContract(null)
    setIsContractModalOpen(true)
  }

  const handleEditContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("edit")
    setIsContractModalOpen(true)
  }

  const handleRenewContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("renew")
    setIsContractModalOpen(true)
  }

  const handleTerminateContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("terminate")
    setIsContractModalOpen(true)
  }

  const handleSignContract = async (contract: IContract) => {
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

  const handleCloseModal = () => {
    setIsContractModalOpen(false)
  }

  return {
    isContractModalOpen,
    contractModalMode,
    selectedContract,
    handleCreateContract,
    handleEditContract,
    handleRenewContract,
    handleTerminateContract,
    handleSignContract,
    handleCloseModal,
  }
}
