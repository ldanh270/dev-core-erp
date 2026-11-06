import { AppPagination, PageCard, PageContainer, PageHeader } from "@/components/common"
import { ActivityLogDetailDrawer } from "@/components/features/security/ActivityLogDetailDrawer"
import { ActivityLogsTable } from "@/components/features/security/ActivityLogsTable"
import { Button } from "@/components/ui/button"
import { useLoginHistoryMaster } from "@/hooks/security/use-login-history-master"
import { History, RefreshCw } from "lucide-react"

/**
 * LoginHistory page — Personal view of login/logout activities
 */
export default function LoginHistory() {
  const {
    query,
    setQuery,
    viewingLogId,
    setViewingLogId,
    data,
    isLoading,
    isFetching,
    refetch,
  } = useLoginHistoryMaster()

  return (
    <PageContainer variant="table">
      <PageHeader
        title="Lịch sử đăng nhập"
        description="Theo dõi các phiên đăng nhập và bảo mật tài khoản của bạn."
      />

      <PageCard padding="none" className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Nhật ký hoạt động
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void refetch()
              }}
              disabled={isLoading || isFetching}
              className="gap-2 rounded-full"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>

          <ActivityLogsTable
            logs={data?.data || []}
            onViewDetail={setViewingLogId}
            hideEmployee={true}
          />

          <div className="px-4 py-3 border-t border-border bg-card shrink-0">
            <AppPagination
              currentPage={query.page || 1}
              totalPages={data?.meta.totalPages || 1}
              onPageChange={(page: number) => {
                setQuery((prev) => ({ ...prev, page }))
              }}
            />
          </div>
        </div>
      </PageCard>

      {/* Detail Drawer */}
      <ActivityLogDetailDrawer
        logId={viewingLogId}
        onClose={() => {
          setViewingLogId(null)
        }}
        scope="me"
      />
    </PageContainer>
  )
}
