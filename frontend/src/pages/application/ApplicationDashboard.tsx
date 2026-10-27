"use client"

import { PageCard, PageHeader } from "@/components/common"
import { ApplicationDetail } from "@/components/features/application/ApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { CancelDialog } from "@/components/features/application/CancelDialog"
import { RejectDialog } from "@/components/features/application/RejectDialog"
import { SubmitApplicationModal } from "@/components/features/application/SubmitApplicationModal"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROUTES } from "@/config/routes.config"
import { useAllApplications } from "@/hooks/application/useAllApplications"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import {
  type IApplication,
  type IApplicationListItem,
  applicationApi,
} from "@/lib/api/application.api"

import { startTransition, useEffect, useState } from "react"

import { Plus } from "lucide-react"
import { useLocation, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

// ─── Main Page ────────────────────────────────────────────────────────────────

/** Coordinates route-scoped application lists and the lazy detail view. */
export default function ApplicationDashboard() {
  // View State: "list" | "detail"
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [mineSubTab, setMineSubTab] = useState<"list" | "leaves">("list")

  const [searchParams] = useSearchParams()
  const location = useLocation()

  let activeTab: "mine" | "manage" | "all" = "mine"
  if (location.pathname.startsWith(ROUTES.APPLICATION.MANAGE)) activeTab = "manage"
  else if (location.pathname.startsWith(ROUTES.APPLICATION.ALL)) activeTab = "all"

  const activeType = searchParams.get("type") || "all"

  const myApps = useMyApplications(activeTab === "mine")
  const manageApps = useManageApplications(activeTab === "manage")
  const allApps = useAllApplications(activeTab === "all")

  const { setTypeFilter: setMyTypeFilter } = myApps
  const { setTypeFilter: setManageTypeFilter } = manageApps
  const { setTypeFilter: setAllTypeFilter } = allApps

  useEffect(() => {
    startTransition(() => {
      setView("list")
      setSelectedApp(null)
    })
    setMyTypeFilter(activeType)
    setManageTypeFilter(activeType)
    setAllTypeFilter(activeType)
  }, [activeTab, activeType, setManageTypeFilter, setMyTypeFilter, setAllTypeFilter])

  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const [createType, setCreateType] = useState<string | undefined>(undefined)
  const [cancelTarget, setCancelTarget] = useState<IApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)
  const [swapConfirmTarget, setSwapConfirmTarget] = useState<IApplication | null>(null)

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    await myApps.handleCancel(cancelTarget.id)
    setCancelTarget(null)
    if (view === "detail" && selectedApp?.id === cancelTarget.id) setView("list")
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
    if (view === "detail" && selectedApp?.id === rejectTarget.id) {
      setView("list")
    }
  }

  const handleApproveFromDetail = async (app: IApplication) => {
    await manageApps.handleApprove(app.id)
    setView("list")
  }

  const handleSwapConfirmFromDetail = async (app: IApplication) => {
    await manageApps.handleSwapConfirm(app.id)
    setView("list")
  }

  const handleSwapRejectConfirm = async (reason: string) => {
    if (!swapConfirmTarget) return
    await manageApps.handleSwapReject(swapConfirmTarget.id, reason)
    setSwapConfirmTarget(null)
    if (view === "detail" && selectedApp?.id === swapConfirmTarget.id) setView("list")
  }

  /** Loads the complete application before switching from list to detail view. */
  const handleRowClick = async (app: IApplicationListItem) => {
    setView("detail")
    setIsDetailLoading(true)
    try {
      const detail = await applicationApi.getById(app.id)
      setSelectedApp(detail)
    } catch (error) {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(apiError.response?.data?.error?.message ?? "Lỗi khi tải chi tiết đơn")
      setView("list")
    } finally {
      setIsDetailLoading(false)
    }
  }

  if (view === "detail") {
    return (
      <>
        <ApplicationDetail
          application={selectedApp}
          isLoading={isDetailLoading}
          mode={activeTab}
          onBack={() => {
            setView("list")
            setSelectedApp(null)
          }}
          onApprove={handleApproveFromDetail}
          onReject={setRejectTarget}
          onSwapConfirm={handleSwapConfirmFromDetail}
          onSwapReject={setSwapConfirmTarget}
        />
        {/* Detail View Modals */}
        {rejectTarget && (
          <RejectDialog
            app={rejectTarget}
            onCancel={() => {
              setRejectTarget(null)
            }}
            onConfirm={(reason: string) => {
              void handleRejectConfirm(reason)
            }}
            isLoading={manageApps.processingId === rejectTarget.id}
          />
        )}
        {swapConfirmTarget && (
          <RejectDialog
            app={swapConfirmTarget}
            onCancel={() => {
              setSwapConfirmTarget(null)
            }}
            onConfirm={(reason: string) => {
              void handleSwapRejectConfirm(reason)
            }}
            isLoading={manageApps.processingId === swapConfirmTarget.id}
            title="Không duyệt đổi ca"
            description="Bạn có chắc chắn muốn không duyệt đổi ca này không?"
            optionalReason={true}
          />
        )}
      </>
    )
  }

  return (
    <main className="container mx-auto w-full space-y-6 p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-4">
        <PageHeader
          title={activeTab === "manage" ? "Bạn duyệt" : activeTab === "mine" ? "Đơn của tôi" : "Đơn thư"}
          description={
            activeTab === "manage"
              ? "Theo dõi và xử lý các đơn đang chờ bạn duyệt."
              : activeTab === "mine"
                ? "Tra cứu, theo dõi và quản lý đơn từ cá nhân."
                : "Tra cứu, theo dõi và quản lý toàn bộ đơn từ của công ty."
          }
          actions={
            <Button
              size="sm"
              className="h-9 px-4 rounded-full font-semibold gap-1.5 text-xs"
              onClick={() => {
                setCreateType(undefined)
                setShowSubmitModal(true)
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Tạo đơn
            </Button>
          }
        />

        {activeTab === "mine" && (
          <div className="flex items-center gap-6 border-b border-border mt-2">
            <button
              onClick={() => {
                setMineSubTab("list")
              }}
              className={`relative flex items-center py-3 font-medium text-[14px] transition-colors ${
                mineSubTab === "list"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Danh sách đơn
              {mineSubTab === "list" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => {
                setMineSubTab("leaves")
              }}
              className={`relative flex items-center py-3 font-medium text-[14px] transition-colors ${
                mineSubTab === "leaves"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tổng phép
              {mineSubTab === "leaves" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
          </div>
        )}
      </div>

      {mineSubTab === "list" || activeTab === "manage" || activeTab === "all" ? (
        <PageCard className="min-w-0 overflow-hidden p-0" noBorder={false}>
          <ApplicationList
            key={activeTab}
            mode={activeTab}
            onRowClick={(app) => {
              void handleRowClick(app)
            }}
            hookState={
              activeTab === "mine" ? myApps : activeTab === "manage" ? manageApps : allApps
            }
          />
        </PageCard>
      ) : (
        <PageCard className="min-w-0 overflow-hidden p-0 rounded-xl" noBorder={false}>
          <div className="overflow-x-auto p-4">
            <Table className="text-sm">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="text-center font-semibold text-foreground text-xs uppercase">
                    Số phép
                  </TableHead>
                  <TableHead className="text-center font-semibold text-foreground text-xs uppercase">
                    Đã dùng
                  </TableHead>
                  <TableHead className="text-center font-semibold text-foreground text-xs uppercase">
                    Còn lại
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-transparent border-b-0">
                  <TableCell className="py-6 text-center font-mono font-medium text-foreground text-lg">
                    7
                  </TableCell>
                  <TableCell className="py-6 text-center font-mono font-medium text-foreground text-lg">
                    0
                  </TableCell>
                  <TableCell className="py-6 text-center font-mono font-bold text-primary text-lg">
                    7
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </PageCard>
      )}

      {/* Modals */}
      {showSubmitModal && (
        <SubmitApplicationModal
          onClose={() => {
            setShowSubmitModal(false)
          }}
          onSuccess={() => {
            void myApps.refetch()
            void manageApps.refetch()
            void allApps.refetch()
          }}
          initialType={createType}
        />
      )}
      {cancelTarget && (
        <CancelDialog
          app={cancelTarget}
          onCancel={() => {
            setCancelTarget(null)
          }}
          onConfirm={() => {
            void handleCancelConfirm()
          }}
          isLoading={myApps.cancellingId === cancelTarget.id}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          app={rejectTarget}
          onCancel={() => {
            setRejectTarget(null)
          }}
          onConfirm={(reason: string) => {
            void handleRejectConfirm(reason)
          }}
          isLoading={manageApps.processingId === rejectTarget.id}
        />
      )}
      {swapConfirmTarget && (
        <RejectDialog
          app={swapConfirmTarget}
          onCancel={() => {
            setSwapConfirmTarget(null)
          }}
          onConfirm={(reason: string) => {
            void handleSwapRejectConfirm(reason)
          }}
          isLoading={manageApps.processingId === swapConfirmTarget.id}
          title="Không duyệt đổi ca"
          description="Bạn có chắc chắn muốn không duyệt đổi ca này không?"
          optionalReason={true}
        />
      )}
    </main>
  )
}
