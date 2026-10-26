import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  ArrowLeft,
  Building,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Send,
  Star,
  UserCheck,
  Video,
  XCircle,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { PageCard, StatusPill } from "@/components/common"
import { CreateOfferDialog } from "@/components/features/recruitment/create-offer-dialog"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  APPLICATION_STATUS_LABELS,
  INTERVIEW_FORMAT,
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
  RECRUITMENT_APPLICATION_STATUSES,
} from "@/config/entities/recruitment.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { usePermission } from "@/hooks/use-permission"
import { applicationApi, interviewApi, requisitionApi } from "@/lib/api/recruitment.api"
import type { ApplicationNote, InterviewRound, KanbanApplication, Scorecard } from "@/types/recruitment.types"
import { extractErrorMessage } from "@/utils/error-helper"

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const applicationId = id ?? ""
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get("tab") ?? "overview"
  const [activeTab, setActiveTab] = useState(defaultTab)

  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const canManage = hasPermission("recruitment.create")

  // State modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState("")

  // Schedule modal form state
  const [roundTitle, setRoundTitle] = useState("")
  const [roundFormat, setRoundFormat] = useState<string>(INTERVIEW_FORMAT.VIDEO_CALL)
  const [roundScheduledAt, setRoundScheduledAt] = useState("")
  const [roundDuration, setRoundDuration] = useState("60")
  const [roundInterviewerId, setRoundInterviewerId] = useState("")

  // Fetch application data
  const { data: application, isLoading } = useQuery({
    queryKey: ["recruitment", "application", id],
    queryFn: () => applicationApi.getOne(applicationId),
    enabled: Boolean(id),
  })

  // Fetch interview rounds
  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["recruitment", "application-interviews", id],
    queryFn: () => interviewApi.listByApplication(applicationId),
    enabled: Boolean(id),
  })

  // Fetch application notes
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["recruitment", "application-notes", id],
    queryFn: () => applicationApi.getNotes(applicationId),
    enabled: Boolean(id),
  })

  // Fetch employees list for assigning interviewers & recruiter
  const { data: employeeData } = useEmployees({ limit: 200 }, { enabled: Boolean(id) })
  const employees = employeeData?.data ?? []

  // Fetch requisition workspace for dynamic pipeline stages
  const { data: requisitionWorkspace } = useQuery({
    queryKey: ["recruitment", "requisition-workspace", application?.requisitionId],
    queryFn: () => application?.requisitionId ? requisitionApi.workspace(application.requisitionId) : Promise.reject(new Error("No requisition ID")),
    enabled: Boolean(application?.requisitionId),
  })
  const dynamicStages = requisitionWorkspace?.stages ?? []

  // Add Note mutation
  const addNoteMutation = useMutation({
    mutationFn: (text: string) => applicationApi.addNote(applicationId, text),
    onSuccess: () => {
      toast.success("Đã thêm ghi chú")
      setNoteText("")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application-notes", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Update Application Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => applicationApi.updateStatus(applicationId, { status }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Assign Recruiter mutation
  const assignRecruiterMutation = useMutation({
    mutationFn: (assignedToId: string) => applicationApi.assignRecruiter(applicationId, assignedToId),
    onSuccess: () => {
      toast.success("Đã phân công người phụ trách")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Create Interview Round mutation
  const createInterviewMutation = useMutation({
    mutationFn: () => {
      return interviewApi.create({
        applicationId: id ?? "",
        title: roundTitle.trim(),
        roundNumber: interviews.length + 1,
        format: roundFormat,
        scheduledAt: roundScheduledAt && !isNaN(new Date(roundScheduledAt).getTime())
          ? new Date(roundScheduledAt).toISOString()
          : new Date().toISOString(),
        durationMinutes: Number(roundDuration) || 60,
        interviewerIds: roundInterviewerId ? [roundInterviewerId] : (employees[0]?.id ? [employees[0].id] : []),
      })
    },
    onSuccess: () => {
      toast.success("Đã tạo lịch phỏng vấn thành công")
      setIsScheduleModalOpen(false)
      setRoundTitle("")
      setRoundScheduledAt("")
      setRoundInterviewerId("")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application-interviews", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Edit Interview Round state
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editFormat, setEditFormat] = useState<string>(INTERVIEW_FORMAT.VIDEO_CALL)
  const [editDuration, setEditDuration] = useState("60")
  const [editScheduledAt, setEditScheduledAt] = useState("")
  const [editInterviewerId, setEditInterviewerId] = useState("")

  const updateInterviewRoundMutation = useMutation({
    mutationFn: () => {
      if (!editingRound) return Promise.reject(new Error("Chưa chọn vòng phỏng vấn"))
      return interviewApi.update(editingRound.id, {
        title: editTitle.trim(),
        format: editFormat,
        durationMinutes: Number(editDuration) || 60,
        scheduledAt: editScheduledAt && !isNaN(new Date(editScheduledAt).getTime())
          ? new Date(editScheduledAt).toISOString()
          : new Date().toISOString(),
        interviewerIds: editInterviewerId ? [editInterviewerId] : [],
      })
    },
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin vòng phỏng vấn thành công")
      setIsEditModalOpen(false)
      setEditingRound(null)
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application-interviews", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })



  if (isLoading) {
    return (
      <div className="container space-y-6 p-8">
        <Skeleton className="h-10 w-1/3 rounded-full" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="col-span-4 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="container flex h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy ứng viên</h2>
        <p className="text-sm text-muted-foreground">Hồ sơ ứng tuyển không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => { navigate(-1) }} variant="outline" className="rounded-full">
          Quay lại
        </Button>
      </div>
    )
  }

  const candidatePortfolioUrl = (application.candidate as { portfolioUrl?: string | null }).portfolioUrl

  return (
    <div className="container space-y-6 px-3 py-4 sm:px-6 sm:py-6">
      {/* ── Top Header / Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button variant="ghost" size="icon" className="size-7 rounded-full" onClick={() => { navigate(-1); }}>
              <ArrowLeft className="size-4" />
            </Button>
            <Link to="/recruitment/requisitions" className="hover:text-primary transition-colors">
              Tuyển dụng
            </Link>
            <span>/</span>
            <Link to={`/recruitment/requisitions/${application.requisitionId}`} className="hover:text-primary font-medium">
              {application.requisition?.title ?? "Yêu cầu"}
            </Link>
            <span>/</span>
            <span className="font-mono">#{application.id.substring(0, 8)}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{application.candidate.fullName}</h1>
            <StatusPill label={application.pipelineStage?.name ?? APPLICATION_STATUS_LABELS[application.status] ?? application.status} variant="info" />
            <Badge variant="outline" className="rounded-full bg-secondary/50 font-mono text-xs">
              {application.source}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button onClick={() => { setIsScheduleModalOpen(true); }} className="rounded-full gap-1.5 shadow-sm">
              <Plus className="size-4" />
              Lên lịch phỏng vấn
            </Button>
          )}
          <Button variant="outline" onClick={() => { setActiveTab("notes"); }} className="rounded-full gap-1.5 border-border">
            <MessageSquare className="size-4 text-muted-foreground" />
            Thêm ghi chú
          </Button>
        </div>
      </div>

      {/* ── Pipeline Stepper Progress Bar (Dynamic from Requisition Workspace) ───── */}
      {(() => {
        interface PipelineStageItem {
          id: string
          name: string
          isCompleted?: boolean
        }
        const fallbackStages: PipelineStageItem[] = [
          { id: "new", name: "Nộp CV" },
          { id: "reviewing", name: "Sàng lọc hồ sơ" },
          { id: "interviewing", name: "Phỏng vấn" },
          { id: "offer_sent", name: "Gửi Offer" },
          { id: "hired", name: "Đã tuyển dụng" },
        ]

        const stagesList: PipelineStageItem[] = dynamicStages.length > 0 ? dynamicStages : fallbackStages

        const currentStageId = (application as { pipelineStageId?: string }).pipelineStageId || application.pipelineStage?.id
        const currentStageIndex = stagesList.findIndex(
          (s: PipelineStageItem) => s.id === currentStageId || s.name === application.pipelineStage?.name
        )
        const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0

        return (
          <PageCard className="p-4 border border-border/60 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tiến trình trạng thái hồ sơ ({stagesList.length} giai đoạn)
                </span>
              </div>
              <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                Trạng thái hiện tại: {application.pipelineStage?.name ?? APPLICATION_STATUS_LABELS[application.status] ?? application.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {stagesList.map((stg: PipelineStageItem, idx: number) => {
                const isCurrent = idx === activeIdx
                const isPast = idx < activeIdx || application.status === "hired"

                // Find linked interview round for this stage
                const linkedRound = interviews.find(
                  (r) =>
                    r.title.toLowerCase().includes(stg.name.toLowerCase()) ||
                    stg.name.toLowerCase().includes(r.title.toLowerCase()) ||
                    (stg.name.toLowerCase().includes("phỏng vấn") && r.roundNumber === idx - 1)
                )

                return (
                  <div key={stg.id || idx} className="flex flex-1 items-center gap-2 min-w-[140px]">
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isPast
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="size-4" /> : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-semibold ${isCurrent ? "text-primary font-bold" : "text-foreground"}`}>
                        {stg.name}
                      </p>

                      {/* Linked Interview Round Result Badge */}
                      {linkedRound ? (
                        <div className="mt-0.5 flex items-center gap-1">
                          {linkedRound.result === "pass" ? (
                            <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px] px-1.5 py-0 font-bold">
                              ✓ Đạt vòng PV
                            </Badge>
                          ) : linkedRound.result === "fail" ? (
                            <Badge variant="outline" className="rounded-full bg-destructive/10 text-destructive border-destructive/30 text-[9px] px-1.5 py-0 font-bold">
                              ✗ Loại
                            </Badge>
                          ) : linkedRound.scorecards && linkedRound.scorecards.length > 0 ? (
                            <Badge variant="outline" className="rounded-full bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] px-1.5 py-0 font-bold flex items-center gap-0.5">
                              <Star className="size-2.5 fill-amber-500 text-amber-500" />
                              {linkedRound.scorecards.length} đánh giá
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {linkedRound.scheduledAt ? format(new Date(linkedRound.scheduledAt), "dd/MM") : "Chờ PV"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          {isPast ? "Đã hoàn thành" : isCurrent ? "Đang ở giai đoạn này" : "Chờ xử lý"}
                        </p>
                      )}
                    </div>
                    {idx < stagesList.length - 1 && (
                      <div className={`h-0.5 flex-1 rounded-full ${isPast ? "bg-emerald-500" : "bg-muted/60"}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </PageCard>
        )
      })()}

      {/* ── 2-Column Grid Layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Main Content Area (8 Cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="inline-flex max-w-full overflow-x-auto rounded-full border border-border/40 bg-secondary p-1">
              <TabsTrigger value="overview" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="interviews" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Vòng phỏng vấn ({interviews.length})
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Offer
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Ghi chú ({notes.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="m-0 space-y-6">
              {/* Profile Details Card */}
              <PageCard className="p-6 transition-all duration-200 hover:shadow-md border border-border/60 hover:border-primary/30">
                <h3 className="mb-4 font-bold text-base text-foreground border-b border-border pb-2">
                  Thông tin cơ bản ứng viên
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Họ và tên:</span>
                    <span className="font-bold text-foreground">{application.candidate.fullName}</span>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Email liên hệ:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {application.candidate.email}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Số điện thoại:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      {application.candidate.phone ?? "Chưa cung cấp"}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Yêu cầu tuyển dụng:</span>
                    <span className="font-semibold text-foreground">
                      {application.requisition?.title ?? "—"}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Phòng ban:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Building className="size-3.5 text-muted-foreground" />
                      {application.requisition?.department ?? "Chưa rõ"}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-border/40 pb-2.5 pt-1 px-2 rounded-lg transition-colors hover:bg-muted/30">
                    <span className="font-medium text-muted-foreground">Nguồn ứng tuyển:</span>
                    <Badge variant="outline" className="rounded-full text-[10px] font-semibold bg-secondary/60 hover:bg-secondary transition-colors">
                      {application.source}
                    </Badge>
                  </div>
                </div>
              </PageCard>

              {/* CV & Links Card */}
              <PageCard className="p-6 transition-all duration-200 hover:shadow-md border border-border/60 hover:border-primary/30">
                <h3 className="mb-4 font-bold text-base text-foreground border-b border-border pb-2">
                  Hồ sơ & Tài liệu
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {application.candidate.cvUrl ? (
                    <Button variant="outline" className="rounded-xl border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 hover:bg-primary/5" asChild>
                      <a href={application.candidate.cvUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 size-4 text-primary" />
                        Xem / Tải CV ứng viên
                        <ExternalLink className="ml-2 size-3 text-muted-foreground" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Chưa đính kèm tệp CV</span>
                  )}

                  {candidatePortfolioUrl && (
                    <Button variant="outline" className="rounded-xl border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20" asChild>
                      <a href={candidatePortfolioUrl} target="_blank" rel="noreferrer">
                        <LinkIcon className="mr-2 size-4 text-blue-500" />
                        Portfolio / Dự án
                        <ExternalLink className="ml-2 size-3 text-muted-foreground" />
                      </a>
                    </Button>
                  )}
                </div>
              </PageCard>
            </TabsContent>

            {/* TAB 2: INTERVIEW ROUNDS WITH INLINE RESULTS & FEEDBACK */}
            <TabsContent value="interviews" className="m-0 space-y-4">
              <PageCard className="p-6 border border-border/60">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Các vòng phỏng vấn & Kết quả</h3>
                    <p className="text-xs text-muted-foreground">Chi tiết thời gian, người phỏng vấn và đánh giá kết quả từng vòng</p>
                  </div>
                  {canManage && (
                    <Button size="sm" onClick={() => { setIsScheduleModalOpen(true); }} className="rounded-full text-xs h-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                      <Plus className="mr-1.5 size-3.5" />
                      Thêm vòng PV
                    </Button>
                  )}
                </div>

                {isLoadingInterviews ? (
                  <span className="text-sm text-muted-foreground">Đang tải lịch phỏng vấn...</span>
                ) : interviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/50 py-10 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Chưa có vòng phỏng vấn nào được thiết lập.</p>
                    {canManage && (
                      <Button size="sm" variant="outline" onClick={() => { setIsScheduleModalOpen(true); }} className="rounded-full text-xs">
                        <Plus className="mr-1 size-3.5" /> Thêm lịch phỏng vấn mới
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((round: InterviewRound) => (
                      <div
                        key={round.id}
                        className="rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                                Vòng {round.roundNumber}
                              </Badge>
                              <h4 className="font-bold text-base text-foreground">{round.title}</h4>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-primary" />
                                <span>
                                  {round.scheduledAt
                                    ? format(new Date(round.scheduledAt), "HH:mm, dd/MM/yyyy")
                                    : "Chưa lên lịch"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {round.format === "video_call" ? (
                                  <Video className="size-3.5 text-blue-500" />
                                ) : (
                                  <MapPin className="size-3.5 text-green-500" />
                                )}
                                <span>{INTERVIEW_FORMAT_LABELS[round.format] ?? round.format}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusPill
                              label={
                                round.status === "completed"
                                  ? INTERVIEW_RESULT_LABELS[round.result as string] ?? "Đã xong"
                                  : round.status === "scheduled"
                                    ? "Sắp diễn ra"
                                    : round.status === "cancelled"
                                      ? "Đã hủy"
                                      : "Chưa phỏng vấn"
                              }
                              variant={
                                round.result === "pass"
                                  ? "success"
                                  : round.result === "fail" || round.status === "cancelled" || round.status === "no_show"
                                    ? "danger"
                                    : "info"
                              }
                            />
                            {canManage && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingRound(round)
                                  setEditTitle(round.title)
                                  setEditFormat(round.format)
                                  setEditDuration(String(round.durationMinutes || 60))
                                  setEditScheduledAt(round.scheduledAt ? format(new Date(round.scheduledAt), "yyyy-MM-dd'T'HH:mm") : "")
                                  setEditInterviewerId(round.interviewerIds?.[0] ?? "")
                                  setIsEditModalOpen(true)
                                }}
                                className="h-7 rounded-full px-2.5 text-xs text-foreground font-semibold hover:border-primary/50 flex items-center gap-1 shadow-2xs transition-all duration-200 hover:shadow-xs hover:-translate-y-0.5"
                                title="Chỉnh sửa thông tin vòng phỏng vấn"
                              >
                                <Pencil className="size-3 text-primary" />
                                <span>Chỉnh sửa</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Interviewer Assignment Bar */}
                        {(() => {
                          const assignedInterviewers = (round.interviewers && round.interviewers.length > 0)
                            ? round.interviewers
                            : (round.interviewerIds || [])
                                .map((empId) => employees.find((e) => e.id === empId))
                                .filter(Boolean) as Array<{ id: string; fullName: string }>

                          return (
                            <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-3 gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Người phỏng vấn:
                                </span>
                                <div className="flex items-center gap-2">
                                  {assignedInterviewers.length > 0 ? (
                                    <>
                                      <div className="flex -space-x-1.5">
                                        {assignedInterviewers.map((interviewer) => (
                                          <div
                                            key={interviewer.id}
                                            className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary/20 text-xs font-bold text-primary transition-transform hover:scale-110 hover:z-10 shadow-xs"
                                            title={interviewer.fullName}
                                          >
                                            {interviewer.fullName.charAt(0)}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-xs font-bold text-foreground">
                                        {assignedInterviewers.map((i) => i.fullName).join(", ")}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Chưa phân công</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })()}

                        {/* ── Inline Scorecard & Interview Results for this Round ──────── */}
                        {round.scorecards && round.scorecards.length > 0 ? (
                          <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                            <div className="flex items-center justify-between text-xs font-bold text-foreground">
                              <span>Kết quả đánh giá từ người phỏng vấn ({round.scorecards.length})</span>
                            </div>
                            {round.scorecards.map((sc: Scorecard) => (
                              <div key={sc.id} className="rounded-xl border border-border/50 bg-secondary/15 p-3.5 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-foreground">{sc.evaluator?.fullName ?? "Interviewer"}</span>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                      <Star key={val} className={`size-3.5 ${val <= sc.overallRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                    ))}
                                  </div>
                                </div>
                                {sc.recommendation && (
                                  <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                                    Đề xuất: {sc.recommendation}
                                  </Badge>
                                )}
                                {sc.strengths && (
                                  <p className="text-xs text-foreground">
                                    <strong className="text-green-600 dark:text-green-400 block mb-0.5">Điểm mạnh:</strong> {sc.strengths}
                                  </p>
                                )}
                                {sc.weaknesses && (
                                  <p className="text-xs text-foreground">
                                    <strong className="text-destructive block mb-0.5">Điểm cần cải thiện:</strong> {sc.weaknesses}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-2 border-t border-border/40 pt-2 text-xs text-muted-foreground italic flex items-center justify-between">
                            <span>Chưa có phiếu đánh giá cho vòng này</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PageCard>
            </TabsContent>

            {/* TAB 3: OFFERS */}
            <TabsContent value="offers" className="m-0 space-y-4">
              <PageCard className="p-6 border border-border/60">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-base text-foreground">
                    Thông tin Offer & Lời mời làm việc
                  </h3>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() => { setIsOfferDialogOpen(true); }}
                      className="rounded-full text-xs font-semibold shadow-xs"
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Tạo Offer
                    </Button>
                  )}
                </div>
                {application.offers && application.offers.length > 0 ? (
                  <div className="space-y-4">
                    {application.offers.map((offer) => (
                      <div key={offer.id} className="rounded-2xl border border-border/60 p-5 space-y-2 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-base">{offer.jobTitle ?? "Offer"}</span>
                          <StatusPill label={offer.status} variant={offer.status === "accepted" ? "success" : "neutral"} />
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          Lương: {Number(offer.offeredSalary).toLocaleString()} {offer.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ngày bắt đầu dự kiến: {offer.startDate ? format(new Date(offer.startDate), "dd/MM/yyyy") : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Chưa có offer nào được tạo cho ứng viên này.</p>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setIsOfferDialogOpen(true); }}
                        className="rounded-full text-xs font-semibold"
                      >
                        <Plus className="mr-1.5 size-3.5" />
                        Tạo Offer ngay
                      </Button>
                    )}
                  </div>
                )}
              </PageCard>
              {application && (
                <CreateOfferDialog
                  open={isOfferDialogOpen}
                  onOpenChange={setIsOfferDialogOpen}
                  applications={[application as unknown as KanbanApplication]}
                  onCreated={() => {
                    void queryClient.invalidateQueries({ queryKey: ["recruitment", "application", id] })
                  }}
                />
              )}
            </TabsContent>

            {/* TAB 5: NOTES */}
            <TabsContent value="notes" className="m-0 space-y-4">
              <PageCard className="p-6 space-y-4 border border-border/60">
                <h3 className="font-bold text-base text-foreground border-b border-border pb-2">
                  Ghi chú & Thảo luận nội bộ
                </h3>

                <div className="space-y-3">
                  <Textarea
                    value={noteText}
                    onChange={(e) => { setNoteText(e.target.value); }}
                    placeholder="Nhập ghi chú hoặc thảo luận về ứng viên này..."
                    className="min-h-[90px] rounded-xl text-xs transition-all focus:border-primary/60"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (noteText.trim()) addNoteMutation.mutate(noteText.trim())
                      }}
                      disabled={!noteText.trim() || addNoteMutation.isPending}
                      className="rounded-full text-xs px-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <Send className="mr-1.5 size-3.5" />
                      Gửi ghi chú
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40">
                  {isLoadingNotes ? (
                    <span className="text-xs text-muted-foreground">Đang tải ghi chú...</span>
                  ) : notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có ghi chú nào.</p>
                  ) : (
                    notes.map((note: ApplicationNote) => (
                      <div key={note.id} className="rounded-xl border border-border/50 bg-secondary/10 p-3.5 space-y-1 transition-all duration-200 hover:bg-secondary/20 hover:border-primary/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{note.addedBy.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {format(new Date(note.createdAt), "HH:mm, dd/MM/yyyy")}
                          </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </PageCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar Info Panel (4 Cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Candidate Profile Summary */}
          <PageCard className="p-6 flex flex-col items-center text-center transition-all duration-200 hover:shadow-md border border-border/60 hover:border-primary/30">
            <div className="flex size-20 items-center justify-center rounded-2xl border-4 border-background bg-primary/10 text-2xl font-bold text-primary shadow-sm overflow-hidden mb-3 transition-transform duration-300 hover:scale-105 hover:rotate-1">
              {application.candidate.avatarUrl ? (
                <img src={application.candidate.avatarUrl} alt={application.candidate.fullName} className="size-full object-cover" />
              ) : (
                application.candidate.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground">{application.candidate.fullName}</h2>
            <p className="text-xs text-muted-foreground">{application.requisition?.title ?? "—"}</p>

            <div className="mt-6 w-full space-y-3 text-left border-t border-border/40 pt-4 text-xs">
              <div className="flex items-center gap-2 text-foreground truncate px-2 py-1 rounded-lg transition-colors hover:bg-muted/30">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{application.candidate.email}</span>
              </div>
              {application.candidate.phone && (
                <div className="flex items-center gap-2 text-foreground px-2 py-1 rounded-lg transition-colors hover:bg-muted/30">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{application.candidate.phone}</span>
                </div>
              )}
            </div>
          </PageCard>

          {/* Application Controls (Status & Assigned HR) */}
          <PageCard className="p-6 space-y-4 transition-all duration-200 hover:shadow-md border border-border/60 hover:border-primary/30">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Quản lý trạng thái
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Trạng thái hồ sơ</Label>
              <Select
                value={application.status}
                onValueChange={(val) => { updateStatusMutation.mutate(val); }}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="h-9 rounded-full text-xs transition-all hover:border-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECRUITMENT_APPLICATION_STATUSES.map((statusVal) => (
                    <SelectItem key={statusVal} value={statusVal} className="text-xs font-medium">
                      {new Map(Object.entries(APPLICATION_STATUS_LABELS)).get(statusVal) || statusVal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Người phụ trách (Recruiter)</Label>
              <Select
                value={application.assignedToId ?? ""}
                onValueChange={(empId) => { assignRecruiterMutation.mutate(empId); }}
                disabled={assignRecruiterMutation.isPending}
              >
                <SelectTrigger className="h-9 rounded-full text-xs transition-all hover:border-primary/50">
                  <SelectValue placeholder="Chọn nhân sự phụ trách" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium">
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PageCard>
        </div>
      </div>

      {/* ── Schedule Interview Modal ────────────────────────────────────────────── */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
          <DialogHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Lên lịch phỏng vấn mới</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Chọn vòng phỏng vấn (Cột Kanban), thời gian & người phụ trách</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* 1. Select Kanban Stage / Round Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  <span>Vòng phỏng vấn (Cột Kanban)</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">Tự động gắn vào Kanban</span>
              </Label>
              {dynamicStages.length > 0 ? (
                <Select value={roundTitle} onValueChange={setRoundTitle}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="-- Chọn giai đoạn phỏng vấn từ Cột Kanban --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    {dynamicStages.map((stg) => (
                      <SelectItem key={stg.id} value={stg.name} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-primary" />
                          <span className="font-semibold">{stg.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={roundTitle}
                  onChange={(e) => { setRoundTitle(e.target.value); }}
                  placeholder="Ví dụ: Phỏng vấn vòng 1, Phỏng vấn vòng 2"
                  className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold"
                />
              )}
            </div>

            {/* 2. Single Row for Format, Duration & Scheduled DateTime */}
            <div className="grid grid-cols-3 gap-3">
              {/* Col 1: Hình thức */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Video className="size-3 text-blue-500" />
                  <span>Hình thức</span>
                </Label>
                <Select value={roundFormat} onValueChange={setRoundFormat}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    <SelectItem value={INTERVIEW_FORMAT.VIDEO_CALL} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Video className="size-3 text-blue-500" />
                        <span>Online</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={INTERVIEW_FORMAT.IN_PERSON} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-emerald-500" />
                        <span>Trực tiếp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={INTERVIEW_FORMAT.PHONE} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3 text-purple-500" />
                        <span>Điện thoại</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Col 2: Thời lượng */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Clock className="size-3 text-amber-500" />
                  <span>Thời lượng</span>
                </Label>
                <Select value={String(roundDuration)} onValueChange={setRoundDuration}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    <SelectItem value="30" className="text-xs font-medium">30 phút</SelectItem>
                    <SelectItem value="45" className="text-xs font-medium">45 phút</SelectItem>
                    <SelectItem value="60" className="text-xs font-medium">60 phút</SelectItem>
                    <SelectItem value="90" className="text-xs font-medium">90 phút</SelectItem>
                    <SelectItem value="120" className="text-xs font-medium">120 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Col 3: Thời gian (Shadcn Popover DateTime Picker) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <CalendarClock className="size-3 text-emerald-500" />
                  <span>Thời gian</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start rounded-2xl border border-border/70 bg-background px-3 text-xs font-semibold hover:border-primary/50 transition-colors shadow-2xs"
                    >
                      <Calendar className="mr-1.5 size-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        {roundScheduledAt
                          ? format(new Date(roundScheduledAt), "HH:mm, dd/MM")
                          : "Chọn ngày & giờ"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3 rounded-2xl space-y-3 bg-popover border border-border shadow-xl">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">Chọn ngày</Label>
                      <DatePicker
                        value={roundScheduledAt ? roundScheduledAt.split("T")[0] : null}
                        onChange={(val) => {
                          const timeVal = roundScheduledAt.split("T")[1] || "09:00";
                          setRoundScheduledAt(val ? `${val}T${timeVal}` : "");
                        }}
                        size="sm"
                        placeholder="Chọn ngày..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">Chọn giờ phỏng vấn</Label>
                      <Select
                        value={roundScheduledAt.split("T")[1]?.substring(0, 5) || "09:00"}
                        onValueChange={(timeVal) => {
                          const dateVal = roundScheduledAt ? roundScheduledAt.split("T")[0] : format(new Date(), "yyyy-MM-dd")
                          setRoundScheduledAt(`${dateVal}T${timeVal}`)
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-border/70 text-xs font-semibold">
                          <SelectValue placeholder="Chọn giờ" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 rounded-xl">
                          {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map((t) => (
                            <SelectItem key={t} value={t} className="text-xs font-medium">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 4. Main Interviewer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-purple-500" />
                <span>Người phỏng vấn chính (Interviewer)</span>
              </Label>
              <Select value={roundInterviewerId} onValueChange={setRoundInterviewerId}>
                <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="-- Chọn người phỏng vấn phụ trách --" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-lg max-h-56">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground">{emp.fullName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsScheduleModalOpen(false); }}
              className="h-9 rounded-full px-5 text-xs font-bold border-border/80 hover:bg-secondary"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => { createInterviewMutation.mutate(); }}
              disabled={!roundTitle.trim() || !roundScheduledAt || createInterviewMutation.isPending}
              className="h-9 rounded-full px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              {createInterviewMutation.isPending ? "Đang tạo..." : "Xác nhận tạo lịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Interview Round Modal ───────────────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
          <DialogHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
                <Pencil className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Chỉnh sửa vòng phỏng vấn</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Cập nhật thông tin vòng phỏng vấn, thời gian & người phụ trách</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* 1. Select Kanban Stage / Round Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" />
                  <span>Vòng phỏng vấn (Cột Kanban)</span>
                </div>
              </Label>
              {dynamicStages.length > 0 ? (
                <Select value={editTitle} onValueChange={setEditTitle}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="-- Chọn giai đoạn phỏng vấn từ Cột Kanban --" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    {dynamicStages.map((stg) => (
                      <SelectItem key={stg.id} value={stg.name} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-primary" />
                          <span className="font-semibold">{stg.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); }}
                  placeholder="Ví dụ: Phỏng vấn vòng 1, Phỏng vấn vòng 2"
                  className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold"
                />
              )}
            </div>

            {/* 2. Format, Duration & Scheduled DateTime on 1 Single Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Col 1: Format */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Video className="size-3 text-blue-500" />
                  <span>Hình thức</span>
                </Label>
                <Select value={editFormat} onValueChange={setEditFormat}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    <SelectItem value={INTERVIEW_FORMAT.VIDEO_CALL} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Video className="size-3 text-blue-500" />
                        <span>Online</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={INTERVIEW_FORMAT.IN_PERSON} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-emerald-500" />
                        <span>Trực tiếp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={INTERVIEW_FORMAT.PHONE} className="text-xs font-medium py-1.5 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3 text-purple-500" />
                        <span>Điện thoại</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Col 2: Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Clock className="size-3 text-amber-500" />
                  <span>Thời lượng</span>
                </Label>
                <Select value={String(editDuration)} onValueChange={setEditDuration}>
                  <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover shadow-lg">
                    <SelectItem value="30" className="text-xs font-medium">30 phút</SelectItem>
                    <SelectItem value="45" className="text-xs font-medium">45 phút</SelectItem>
                    <SelectItem value="60" className="text-xs font-medium">60 phút</SelectItem>
                    <SelectItem value="90" className="text-xs font-medium">90 phút</SelectItem>
                    <SelectItem value="120" className="text-xs font-medium">120 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Col 3: Scheduled DateTime (Shadcn Popover) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <CalendarClock className="size-3 text-emerald-500" />
                  <span>Thời gian</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start rounded-2xl border border-border/70 bg-background px-3 text-xs font-semibold hover:border-primary/50 transition-colors shadow-2xs"
                    >
                      <Calendar className="mr-1.5 size-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">
                        {editScheduledAt
                          ? format(new Date(editScheduledAt), "HH:mm, dd/MM")
                          : "Chọn ngày & giờ"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3 rounded-2xl space-y-3 bg-popover border border-border shadow-xl">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">Chọn ngày</Label>
                      <DatePicker
                        value={editScheduledAt ? editScheduledAt.split("T")[0] : null}
                        onChange={(val) => {
                          const timeVal = editScheduledAt.split("T")[1] || "09:00";
                          setEditScheduledAt(val ? `${val}T${timeVal}` : "");
                        }}
                        size="sm"
                        placeholder="Chọn ngày..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">Chọn giờ phỏng vấn</Label>
                      <Select
                        value={editScheduledAt ? editScheduledAt.split("T")[1]?.substring(0, 5) || "09:00" : "09:00"}
                        onValueChange={(timeVal) => {
                          const dateVal = editScheduledAt ? editScheduledAt.split("T")[0] : format(new Date(), "yyyy-MM-dd")
                          setEditScheduledAt(`${dateVal}T${timeVal}`)
                        }}
                      >
                        <SelectTrigger className="h-9 rounded-xl border-border/70 text-xs font-semibold">
                          <SelectValue placeholder="Chọn giờ" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 rounded-xl">
                          {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"].map((t) => (
                            <SelectItem key={t} value={t} className="text-xs font-medium">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 3. Main Interviewer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-purple-500" />
                <span>Người phỏng vấn chính (Interviewer)</span>
              </Label>
              <Select value={editInterviewerId} onValueChange={setEditInterviewerId}>
                <SelectTrigger className="h-10 rounded-2xl border-border/70 bg-background text-xs font-semibold hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="-- Chọn người phỏng vấn phụ trách --" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-lg max-h-56">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium py-2 rounded-xl cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground">{emp.fullName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsEditModalOpen(false); }}
              className="h-9 rounded-full px-5 text-xs font-bold border-border/80 hover:bg-secondary"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => { updateInterviewRoundMutation.mutate(); }}
              disabled={!editTitle.trim() || !editScheduledAt || updateInterviewRoundMutation.isPending}
              className="h-9 rounded-full px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              {updateInterviewRoundMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
