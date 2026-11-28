"use client"

import { ApplicationDetail } from "@/components/features/application/ApplicationDetail"
import { ApplicationList } from "@/components/features/application/ApplicationList"
import { ApplicationModals } from "@/components/features/application/ApplicationModals"
import { ApplicationSubHeader } from "@/components/features/application/ApplicationSubHeader"
import { LeavesSummaryTab } from "@/components/features/application/LeavesSummaryTab"
import { useApplicationDashboard } from "@/hooks/application/use-application-dashboard"

import { Plus } from "lucide-react"

/**
 * Coordinates route-scoped application lists, leaves view, and the lazy detail view.
 * Thin declarative composition shell powered by useApplicationDashboard presenter hook.
 */
export default function ApplicationDashboard() {
  const {
    view,
    selectedApp,
    isDetailLoading,
    mineSubTab,
    setMineSubTab,
    showSubmitModal,
    setShowSubmitModal,
    rejectTarget,
    setRejectTarget,
    swapConfirmTarget,
    setSwapConfirmTarget,
    activeTab,
    activeAppHook,
    myApps,
    manageApps,
    allApps,
    handleRejectConfirm,
    handleSwapRejectConfirm,
    handleRowClick,
    handleBackToList,
  } = useApplicationDashboard()

  const subHeader = (
    <ApplicationSubHeader
      activeTab={activeTab}
      mineSubTab={mineSubTab}
      onSubTabChange={setMineSubTab}
    />
  )

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
          onBack={handleBackToList}
          onApprove={async (app) => {
            await manageApps.handleApprove(app.id)
            handleBackToList()
          }}
          onReject={setRejectTarget}
          onSwapConfirm={async (app) => {
            await manageApps.handleSwapConfirm(app.id)
            handleBackToList()
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
      hookState={activeAppHook}
      extraContent={modals}
    />
  )
}
