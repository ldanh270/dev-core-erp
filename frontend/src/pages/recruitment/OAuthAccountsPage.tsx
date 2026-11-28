import { DataTablePage } from "@/components/common"
import { ConnectOAuthModal } from "@/components/features/recruitment/ConnectOAuthModal"
import { OAuthAccountsChannelFilter } from "@/components/features/recruitment/OAuthAccountsChannelFilter"
import { getOAuthAccountsColumns } from "@/components/features/recruitment/oauth-accounts-columns"
import { useOAuthAccountsManagement } from "@/hooks/recruitment/use-oauth-accounts-management"
import type { OAuthAccount } from "@/lib/api/recruitment.api"

import { useMemo } from "react"

import { Plus } from "lucide-react"

/**
 * Tier 2 Page Orchestrator for linked OAuth channels.
 * Encapsulates channel filtering, connect modals, and credential management.
 */
export default function OAuthAccountsPage() {
  const {
    accounts,
    totalAccounts,
    isLoading,
    keyword,
    channelFilter,
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    handleSearch,
    handleChannelFilterChange,
    handleResetFilters,
    hasActiveFilters,
    tabsConfig,
    isConnectModalOpen,
    setIsConnectModalOpen,
    selectedChannel,
    setSelectedChannel,
    accountName,
    setAccountName,
    isConnecting,
    handleOpenConnect,
    handleStartOAuth,
    handleDelete,
  } = useOAuthAccountsManagement()

  const columns = useMemo(
    () =>
      getOAuthAccountsColumns({
        onOpenConnect: handleOpenConnect,
        onDelete: handleDelete,
      }),
    [handleOpenConnect, handleDelete],
  )

  return (
    <>
      <DataTablePage<OAuthAccount>
        title="Tài khoản liên kết OAuth"
        description="Quản lý và cấp quyền các tài khoản mạng xã hội và Google để tự động hóa tuyển dụng"
        variant="viewport"
        data={accounts}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(acc) => acc.id}
        search={{
          value: keyword,
          onSearch: handleSearch,
          placeholder: "Tìm theo tên tài khoản, loại kênh...",
        }}
        primaryAction={{
          label: "Kết nối tài khoản",
          icon: Plus,
          onClick: () => handleOpenConnect(),
        }}
        filters={
          <OAuthAccountsChannelFilter
            channelFilter={channelFilter}
            hasActiveFilters={hasActiveFilters}
            onChannelFilterChange={handleChannelFilterChange}
            onResetFilters={handleResetFilters}
          />
        }
        emptyState={{
          title: hasActiveFilters
            ? "Không tìm thấy tài khoản OAuth nào phù hợp với bộ lọc"
            : "Chưa có tài khoản OAuth nào được liên kết",
          description: hasActiveFilters
            ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc kênh khác."
            : "Nhấn nút 'Kết nối tài khoản' phía trên để bắt đầu liên kết.",
        }}
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(totalAccounts / pageSize)),
          totalItems: totalAccounts,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: handlePageSizeChange,
        }}
      />

      <ConnectOAuthModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        selectedChannel={selectedChannel}
        onChannelChange={setSelectedChannel}
        accountName={accountName}
        onAccountNameChange={setAccountName}
        isConnecting={isConnecting}
        onStartOAuth={handleStartOAuth}
      />
    </>
  )
}
