"use client"

import { ApplicationDetail } from "@/components/features/application/ApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { ApplicationModals } from "@/components/features/application/ApplicationModals"
import { LeavesSummaryTab } from "@/components/features/application/LeavesSummaryTab"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

/** Coordinates route-scoped application lists, leaves view, and the lazy detail view. */
export default function ApplicationDashboard() {
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [mineSubTab, setMineSubTab] = useState<"list" | "leaves">("list")
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<IApplication | null>(null)
  const [swapConfirmTarget, setSwapConfirmTarget] = useState<IApplication | null>(null)

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

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return
    await manageApps.handleReject(rejectTarget.id, reason)
    setRejectTarget(null)
    if (view === "detail" && selectedApp?.id === rejectTarget.id) {
      setView("list")
    }
  }

  const handleSwapRejectConfirm = async (reason: string) => {
    if (!swapConfirmTarget) return
    await manageApps.handleSwapReject(swapConfirmTarget.id, reason)
    setSwapConfirmTarget(null)
    if (view === "detail" && selectedApp?.id === swapConfirmTarget.id) {
      setView("list")
    }
  }

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

  const subHeader =
    activeTab === "mine" ? (
      <div className="border-b border-border px-1 shrink-0">
        <Tabs
          value={mineSubTab}
          onValueChange={(val) => {
            setMineSubTab(val as "list" | "leaves")
          }}
        >
          <TabsList variant="line" className="h-10 gap-6 bg-transparent p-0">
            <TabsTrigger
              value="list"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-2 font-medium text-sm transition-colors shadow-none"
            >
              Danh sách đơn
            </TabsTrigger>
            <TabsTrigger
              value="leaves"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-1 py-2 font-medium text-sm transition-colors shadow-none"
            >
              Tổng phép
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    ) : undefined

  const modals = (
    <ApplicationModals
      showSubmitModal={showSubmitModal}
      onCloseSubmit={() => {
        setShowSubmitModal(false)
      }}
      onSuccessSubmit={() => {
        myApps.refetch()
        manageApps.refetch()
        allApps.refetch()
      }}
      rejectTarget={rejectTarget}
      onCloseReject={() => {
        setRejectTarget(null)
      }}
      onConfirmReject={(reason) => {
        void handleRejectConfirm(reason)
      }}
      isRejectProcessing={manageApps.processingId === rejectTarget?.id}
      swapConfirmTarget={swapConfirmTarget}
      onCloseSwapReject={() => {
        setSwapConfirmTarget(null)
      }}
      onConfirmSwapReject={(reason) => {
        void handleSwapRejectConfirm(reason)
      }}
      isSwapRejectProcessing={manageApps.processingId === swapConfirmTarget?.id}
    />
  )

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
          onApprove={async (app) => {
            await manageApps.handleApprove(app.id)
            setView("list")
          }}
          onReject={setRejectTarget}
          onSwapConfirm={async (app) => {
            await manageApps.handleSwapConfirm(app.id)
            setView("list")
          }}
          onSwapReject={setSwapConfirmTarget}
        />
        {modals}
      </>
    )
  }

  if (activeTab === "mine" && mineSubTab === "leaves") {
    return (
      <LeavesSummaryTab
        subHeader={subHeader}
        onOpenCreate={() => {
          setShowSubmitModal(true)
        }}
        extraContent={modals}
      />
    )
  }

  return (
    <ApplicationList
      key={activeTab}
      mode={activeTab}
      title={
        activeTab === "manage" ? "Bạn duyệt" : activeTab === "mine" ? "Đơn của tôi" : "Đơn thư"
      }
      description={
        activeTab === "manage"
          ? "Theo dõi và xử lý các đơn đang chờ bạn duyệt."
          : activeTab === "mine"
            ? "Tra cứu, theo dõi và quản lý đơn từ cá nhân."
            : "Tra cứu, theo dõi và quản lý toàn bộ đơn từ của công ty."
      }
      primaryAction={{
        label: "Tạo đơn",
        icon: Plus,
        onClick: () => {
          setShowSubmitModal(true)
        },
      }}
      subHeader={subHeader}
      onRowClick={(app) => {
        void handleRowClick(app)
      }}
      hookState={activeTab === "mine" ? myApps : activeTab === "manage" ? manageApps : allApps}
      extraContent={modals}
    />
  )
}
