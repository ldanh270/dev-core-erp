import { usePermission } from "@/hooks/use-permission"
import { jobPostingApi, requisitionApi } from "@/lib/api/recruitment.api"
import type { JobPosting } from "@/types/recruitment.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

export const REQUISITION_DETAIL_TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "postings", label: "Bài đăng tuyển dụng" },
  { id: "candidate", label: "Ứng viên" },
  { id: "kanban", label: "Bảng Kanban" },
  { id: "interviews", label: "Phỏng vấn" },
  { id: "offers", label: "Offer" },
  { id: "background-checks", label: "Background Check" },
  { id: "activity", label: "Hoạt động" },
] as const

export type RequisitionDetailTabId = (typeof REQUISITION_DETAIL_TABS)[number]["id"]

export function useRequisitionDetail() {
  const { id = "", tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = usePermission()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [isPostingOpen, setIsPostingOpen] = useState(searchParams.get("createPosting") === "1")
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  const activeTab: RequisitionDetailTabId = REQUISITION_DETAIL_TABS.some((t) => t.id === tab)
    ? (tab as RequisitionDetailTabId)
    : "overview"

  useEffect(() => {
    if (id && tab !== activeTab) {
      navigate(`/recruitment/requisitions/${id}/${activeTab}`, { replace: true })
    }
  }, [activeTab, id, navigate, tab])

  const {
    data: workspace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recruitment", "requisition-workspace", id],
    queryFn: () => requisitionApi.workspace(id),
    enabled: Boolean(id),
  })

  const { data: activities = [] } = useQuery({
    queryKey: ["recruitment", "requisition-activities", id],
    queryFn: () => requisitionApi.activities(id),
    enabled: Boolean(id),
  })

  const postings = workspace?.requisition.postings ?? []
  const applications = useMemo(
    () => workspace?.applications.data ?? [],
    [workspace?.applications.data],
  )
  const stages = useMemo(() => workspace?.stages ?? [], [workspace?.stages])

  const publishMutation = useMutation({
    mutationFn: (postingId: string) => jobPostingApi.publish({ id: postingId, mode: "connector" }),
    onSuccess: () => {
      toast.success("Đã tạo và public Google Form")
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "requisition-workspace", id],
      })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const syncMutation = useMutation({
    mutationFn: (postingId: string) => jobPostingApi.sync(postingId),
    onSuccess: (result) => {
      toast.success(`Đã đồng bộ ${result.applicationsCreated} lượt ứng tuyển`)
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "requisition-workspace", id],
      })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const filteredCandidates = useMemo(
    () =>
      applications.filter((application) =>
        `${application.candidate.fullName} ${application.candidate.email} ${application.pipelineStage?.name ?? ""} ${application.postingId}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      ),
    [applications, search],
  )

  const stageCounts = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        count: applications.filter((application) => application.pipelineStage?.id === stage.id)
          .length,
      })),
    [applications, stages],
  )

  const handleTabChange = useCallback(
    (newTab: string) => {
      navigate(`/recruitment/requisitions/${id}/${newTab}`)
    },
    [id, navigate],
  )

  const handlePostingOpenChange = useCallback(
    (open: boolean) => {
      setIsPostingOpen(open)
      if (!open) {
        setSearchParams({}, { replace: true })
        void queryClient.invalidateQueries({
          queryKey: ["recruitment", "requisition-workspace", id],
        })
      }
    },
    [id, queryClient, setSearchParams],
  )

  const canManagePosting = hasPermission("recruitment.posting.manage")
  const canManageIntake = hasPermission("recruitment.intake.manage")
  const canCreate = hasPermission("recruitment.create")

  return {
    id,
    activeTab,
    workspace,
    postings,
    applications,
    stages,
    activities,
    filteredCandidates,
    stageCounts,
    search,
    setSearch,
    isPostingOpen,
    setIsPostingOpen,
    handlePostingOpenChange,
    selectedPosting,
    setSelectedPosting,
    selectedAppId,
    setSelectedAppId,
    isLoading,
    error,
    handleTabChange,
    publishMutation,
    syncMutation,
    canManagePosting,
    canManageIntake,
    canCreate,
  }
}
