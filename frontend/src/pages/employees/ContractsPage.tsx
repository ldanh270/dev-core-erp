import { DataTablePage, useConfirm } from "@/components/common"
import { ContractModal } from "@/components/employee-contract/ContractModal"
import { useContractsColumns } from "@/components/features/employee-contract/use-contracts-columns"
import { ROUTES } from "@/config/routes.config"
import {
  CONTRACT_STATUS_TABS,
  useContractsManagement,
} from "@/hooks/employee-contract/use-contracts-management"
import { routerNavigate } from "@/lib/router-navigator"
import type { IContract } from "@/types/employee-contract.types"

import { useMemo } from "react"
import { Plus } from "lucide-react"

/**
 * Standardized Employee Contracts management page.
 * Thin declarative composition shell powered by DataTablePage, useContractsManagement, and useContractsColumns.
 */
export default function ContractsPage() {
  const confirm = useConfirm()
  const {
    contracts,
    isLoading,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
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
  } = useContractsManagement()

  const columns = useContractsColumns({
    confirm,
    onEdit: handleEdit,
    onRenew: handleRenew,
    onTerminate: handleTerminate,
    onSignContract: handleSignContract,
  })

  const tabsConfig = useMemo(
    () => ({
      items: CONTRACT_STATUS_TABS.map((t) => ({
        id: t.id,
        label: t.label,
        count: getTabCount(t.id),
      })),
      activeTab,
      onTabChange: handleTabChange,
    }),
    [activeTab, getTabCount, handleTabChange],
  )

  return (
    <>
      <DataTablePage<IContract>
        title="Quản lý Hợp đồng"
        description="Theo dõi danh sách, trạng thái và vòng đời hợp đồng lao động nhân sự"
        density="compact"
        primaryAction={{
          label: "Thêm hợp đồng",
          icon: Plus,
          onClick: () => {
            routerNavigate(ROUTES.HRM.CREATE_CONTRACT)
          },
        }}
        tabs={tabsConfig}
        search={{
          placeholder: "Tìm theo số hợp đồng, tiêu đề...",
          value: searchTerm,
          onSearch: handleSearch,
        }}
        columns={columns}
        data={contracts}
        keyExtractor={(contract) => contract.id}
        isLoading={isLoading}
        emptyState={{
          title: "Chưa có hợp đồng nào",
          description: "Bắt đầu tạo hợp đồng lao động đầu tiên cho nhân sự.",
        }}
        pagination={{
          currentPage,
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: handlePageChange,
          onItemsPerPageChange: handleLimitChange,
        }}
      />

      {modalMode && selectedContract && (
        <ContractModal
          isOpen={Boolean(modalMode)}
          onClose={handleCloseModal}
          employeeId={selectedContract.employeeId}
          mode={modalMode}
          contract={selectedContract}
        />
      )}
    </>
  )
}
