import { APPLICATION_MESSAGES } from "@/config/messages/application.message"
import { ROUTES } from "@/config/routes.config"
import { useAllApplications } from "@/hooks/application/useAllApplications"
import { useManageApplications } from "@/hooks/application/useManageApplications"
import { useMyApplications } from "@/hooks/application/useMyApplications"
import {
  type IApplication,
  type IApplicationListItem,
  applicationApi,
} from "@/lib/api/application.api"

import { startTransition, useCallback, useEffect, useState } from "react"

import { useLocation, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

const { ERRORS } = APPLICATION_MESSAGES

type UseMyApplicationsReturn = ReturnType<typeof useMyApplications>
type UseManageApplicationsReturn = ReturnType<typeof useManageApplications>
type UseAllApplicationsReturn = ReturnType<typeof useAllApplications>

export interface UseApplicationDashboardReturn {
  view: "list" | "detail"
  selectedApp: IApplication | null
  isDetailLoading: boolean
  mineSubTab: "list" | "leaves"
  setMineSubTab: (tab: "list" | "leaves") => void
  showSubmitModal: boolean
  setShowSubmitModal: (show: boolean) => void
  rejectTarget: IApplication | null
  setRejectTarget: (app: IApplication | null) => void
  swapConfirmTarget: IApplication | null
  setSwapConfirmTarget: (app: IApplication | null) => void
  activeTab: "mine" | "manage" | "all"
  activeAppHook: UseMyApplicationsReturn | UseManageApplicationsReturn | UseAllApplicationsReturn
  myApps: UseMyApplicationsReturn
  manageApps: UseManageApplicationsReturn
  allApps: UseAllApplicationsReturn
  handleRejectConfirm: (reason: string) => Promise<void>
  handleSwapRejectConfirm: (reason: string) => Promise<void>
  handleRowClick: (app: IApplicationListItem) => Promise<void>
  handleBackToList: () => void
}

/**
 * Custom hook to coordinate application lists, view switching, modals, and queries.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
export function useApplicationDashboard(): UseApplicationDashboardReturn {
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

  const handleRejectConfirm = useCallback(
    async (reason: string) => {
      if (!rejectTarget) return
      await manageApps.handleReject(rejectTarget.id, reason)
      setRejectTarget(null)
      if (view === "detail" && selectedApp?.id === rejectTarget.id) {
        setView("list")
      }
    },
    [rejectTarget, manageApps, view, selectedApp],
  )

  const handleSwapRejectConfirm = useCallback(
    async (reason: string) => {
      if (!swapConfirmTarget) return
      await manageApps.handleSwapReject(swapConfirmTarget.id, reason)
      setSwapConfirmTarget(null)
      if (view === "detail" && selectedApp?.id === swapConfirmTarget.id) {
        setView("list")
      }
    },
    [swapConfirmTarget, manageApps, view, selectedApp],
  )

  const handleRowClick = useCallback(async (app: IApplicationListItem) => {
    setView("detail")
    setIsDetailLoading(true)
    try {
      const detail = await applicationApi.getById(app.id)
      setSelectedApp(detail)
    } catch (error) {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } }
      toast.error(apiError.response?.data?.error?.message ?? ERRORS.FETCH_DETAIL_FAILED)
      setView("list")
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  const handleBackToList = useCallback(() => {
    setView("list")
    setSelectedApp(null)
  }, [])

  const activeAppHook =
    activeTab === "mine" ? myApps : activeTab === "manage" ? manageApps : allApps

  return {
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
  }
}
