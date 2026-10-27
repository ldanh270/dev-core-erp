import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BarChart3, ExternalLink, FileSpreadsheet, Plus, RefreshCw, Search, TrendingUp } from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageCard } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { CreateJobPostingDialog } from "@/components/features/recruitment/create-job-posting-dialog"
import { RecruitmentWorkspaceSkeleton } from "@/components/features/recruitment/recruitment-workspace-skeleton"
import { ViewJobPostingDialog } from "@/components/features/recruitment/view-job-posting-dialog"
import {
  RequisitionBackgroundChecksTab,
  RequisitionInterviewsTab,
  RequisitionOffersTab,
} from "@/components/features/recruitment/requisition-workspace-tabs"
import { requisitionApi, jobPostingApi } from "@/lib/api/recruitment.api"
import { usePermission } from "@/hooks/use-permission"
import { extractErrorMessage } from "@/utils/error-helper"
import { toast } from "sonner"
import { ApplicationDetailPanel } from "@/components/features/recruitment/application-detail-panel"
import KanbanPage from "./KanbanPage"
import type { JobPosting } from "@/types/recruitment.types"

const TABS = [["overview", "Tổng quan"], ["postings", "Bài đăng tuyển dụng"], ["candidate", "Ứng viên"], ["kanban", "Bảng Kanban"], ["interviews", "Phỏng vấn"], ["offers", "Offer"], ["background-checks", "Background Check"], ["activity", "Hoạt động"]] as const

export default function RequisitionDetailPage() {
  const { id = "", tab } = useParams<{ id: string; tab?: string }>(); const navigate = useNavigate(); const [searchParams, setSearchParams] = useSearchParams(); const { hasPermission } = usePermission(); const queryClient = useQueryClient(); const [search, setSearch] = useState(""); const [isPostingOpen, setIsPostingOpen] = useState(searchParams.get("createPosting") === "1"); const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null); const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const activeTab = TABS.some(([value]) => value === tab) ? (tab ?? "overview") : "overview"
  useEffect(() => {
    if (id && tab !== activeTab) navigate(`/recruitment/requisitions/${id}/${activeTab}`, { replace: true })
  }, [activeTab, id, navigate, tab])
  const { data: workspace, isLoading, error } = useQuery({ queryKey: ["recruitment", "requisition-workspace", id], queryFn: () => requisitionApi.workspace(id), enabled: Boolean(id) })
  const { data: activities = [] } = useQuery({ queryKey: ["recruitment", "requisition-activities", id], queryFn: () => requisitionApi.activities(id), enabled: Boolean(id) })
  const postings = workspace?.requisition.postings ?? []
  const applications = useMemo(() => workspace?.applications.data ?? [], [workspace?.applications.data])
  const stages = useMemo(() => workspace?.stages ?? [], [workspace?.stages])
  const publish = useMutation({
    mutationFn: (postingId: string) => jobPostingApi.publish({ id: postingId, mode: "connector" }),
    onSuccess: () => {
      toast.success("Đã tạo và public Google Form")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisition-workspace", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })
  const sync = useMutation({ mutationFn: (postingId: string) => jobPostingApi.sync(postingId), onSuccess: (result) => { toast.success(`Đã đồng bộ ${result.applicationsCreated} lượt ứng tuyển`); void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisition-workspace", id] }) }, onError: (err) => toast.error(extractErrorMessage(err)) })
  const filtered = useMemo(() => applications.filter((application) => `${application.candidate.fullName} ${application.candidate.email} ${application.pipelineStage?.name ?? ""} ${application.postingId}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [applications, search])
  const counts = useMemo(() => stages.map((stage) => ({ ...stage, count: applications.filter((application) => application.pipelineStage?.id === stage.id).length })), [applications, stages])
  if (isLoading) return <RecruitmentWorkspaceSkeleton />
  if (error || !workspace) return <div className="container space-y-3 p-8"><p className="font-semibold text-destructive">Không tải được yêu cầu tuyển dụng.</p><p className="text-sm text-muted-foreground">{error ? extractErrorMessage(error) : "Dữ liệu workspace trống."}</p></div>

  return <div className="container space-y-6 px-3 py-4 sm:px-6 sm:py-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><Button variant="ghost" className="h-8 rounded-full px-2 text-muted-foreground" asChild><Link to="/recruitment/requisitions"><ArrowLeft className="mr-1.5 size-4" />Yêu cầu tuyển dụng</Link></Button><div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight">{workspace.requisition.title}</h1><StatusPill label={workspace.requisition.status === "approved" ? "Đã duyệt" : workspace.requisition.status} variant={workspace.requisition.status === "approved" ? "success" : "neutral"} /></div><p className="text-sm text-muted-foreground">{workspace.requisition.code} · {workspace.requisition.department || "Chưa có phòng ban"} · {workspace.requisition.position?.name ?? workspace.requisition.positionLevel}</p></div><Button className="rounded-full" onClick={() => { setIsPostingOpen(true); }} disabled={!hasPermission("recruitment.posting.manage")}><Plus className="mr-2 size-4" />Tạo bài đăng</Button></div>
    <Tabs value={activeTab} onValueChange={(value) => { navigate(`/recruitment/requisitions/${id}/${value}`); }} className="space-y-6"><TabsList className="inline-flex max-w-full overflow-x-auto rounded-full border border-border/40 bg-secondary p-1">{TABS.map(([value, label]) => <TabsTrigger key={value} value={value} className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">{label}</TabsTrigger>)}</TabsList>
      <TabsContent value="overview" className="space-y-6">
        {/* KPI Row matching Project Overview Tab */}
        <div className="grid grid-cols-12 gap-6">
          {/* Card 1: Donut Circular Progress */}
          {(() => {
            const headcount = workspace.requisition.headcount || 1
            const hiredCount = applications.filter((app) => app.status === "hired" || app.pipelineStage?.isCompleted).length
            const completionRate = Math.min(100, Math.round((hiredCount / headcount) * 100))
            const totalAppsCount = applications.length || 1

            const circumference = 2 * Math.PI * 50

            return (
              <>
                <PageCard className="col-span-12 lg:col-span-4 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border/60 transition-all hover:shadow-md">
                  <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <TrendingUp className="size-3.5 text-emerald-500" />
                    Tiến độ Tuyển dụng (Progress)
                  </div>
                  <div className="relative flex items-center justify-center my-6">
                    <svg className="size-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="50" className="stroke-muted/30" strokeWidth="10" fill="transparent" />
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        className="stroke-emerald-500 transition-all duration-500"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - completionRate / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{completionRate}%</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Chỉ tiêu</span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    Đã tuyển <span className="text-emerald-500 font-bold">{hiredCount}</span> / Chỉ tiêu <span className="text-foreground font-bold">{headcount}</span> nhân sự
                  </div>
                </PageCard>

                {/* Card 2: Donut Chart & Pipeline Legend Grid */}
                <PageCard className="col-span-12 lg:col-span-8 p-6 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-gradient-to-br from-card to-card/50 border border-border/60 transition-all hover:shadow-md">
                  <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <BarChart3 className="size-3.5 text-blue-500" />
                    Phân bổ Pipeline (Pipeline Stages)
                  </div>

                  {/* SVG Donut */}
                  <div className="relative flex items-center justify-center size-36 mt-4 md:mt-0 shrink-0">
                    <svg className="size-32 transform -rotate-90">
                      {(() => {
                        let currentAccumulated = 0;
                        return counts.map((stage, idx) => {
                          const segmentPercent = (stage.count / totalAppsCount) * 100
                          const accumulatedOffset = -(currentAccumulated / 100) * circumference
                          currentAccumulated += segmentPercent
                          return (
                            <circle
                              key={idx}
                              cx="64"
                              cy="64"
                              r="50"
                              style={{ stroke: stage.color || "hsl(var(--primary))" }}
                              className="transition-all duration-300 hover:opacity-80"
                              strokeWidth="14"
                              fill="transparent"
                              strokeDasharray={`${(segmentPercent / 100) * circumference} ${circumference}`}
                              strokeDashoffset={accumulatedOffset}
                            />
                          )
                        })
                      })()}
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-foreground">{applications.length}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Ứng viên</span>
                    </div>
                  </div>

                  {/* Legend Grid */}
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 md:mt-0">
                    {counts.map((stage) => {
                      const percent = totalAppsCount > 0 ? Math.round((stage.count / totalAppsCount) * 100) : 0
                      return (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                            <span className="text-xs font-semibold text-muted-foreground truncate">{stage.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-xs font-bold text-foreground">{stage.count}</span>
                            <span className="text-[9px] text-muted-foreground font-medium">({percent}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </PageCard>
              </>
            )
          })()}
        </div>

        {/* Lower Grid: Stage Breakdown Table & Requisition Meta */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-7 space-y-6">
            <PageCard className="p-6 border border-border/60">
              <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
                Chi tiết các giai đoạn Tuyển dụng
              </h3>
              <div className="relative overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-10">
                      <TableHead className="font-semibold text-xs text-muted-foreground uppercase">Tên giai đoạn</TableHead>
                      <TableHead className="font-semibold text-xs text-center text-muted-foreground uppercase w-28">Ứng viên</TableHead>
                      <TableHead className="font-semibold text-xs text-center text-muted-foreground uppercase w-28">Tỷ lệ (%)</TableHead>
                      <TableHead className="font-semibold text-xs text-right text-muted-foreground uppercase w-32">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counts.map((stage) => {
                      const totalApps = applications.length || 1
                      const percent = Math.round((stage.count / totalApps) * 100)
                      return (
                        <TableRow key={stage.id} className="h-12 hover:bg-muted/30">
                          <TableCell className="font-bold text-xs text-foreground flex items-center gap-2 py-3">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                            {stage.name}
                          </TableCell>
                          <TableCell className="text-center font-bold text-xs text-foreground">{stage.count}</TableCell>
                          <TableCell className="text-center font-semibold text-xs text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <span className="w-8 font-mono">{percent}%</span>
                              <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: stage.color }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <StatusPill label={stage.isCompleted ? "Hoàn thành" : "Đang xử lý"} variant={stage.isCompleted ? "success" : "info"} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </PageCard>
          </div>

          <div className="col-span-12 xl:col-span-5 space-y-6">
            <PageCard className="p-6 border border-border/60">
              <h3 className="font-bold text-base text-foreground mb-4 border-b border-border pb-2">
                Thông tin Yêu cầu tuyển dụng
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Mã yêu cầu:</span>
                  <span className="font-mono font-bold text-foreground">{workspace.requisition.code}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Phòng ban:</span>
                  <span className="font-semibold text-foreground">{workspace.requisition.department || "Chưa có"}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Hình thức làm việc:</span>
                  <span className="font-semibold text-foreground">{workspace.requisition.employmentType}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Độ ưu tiên:</span>
                  <Badge variant="outline" className="rounded-full uppercase font-bold text-[10px]">
                    {workspace.requisition.priority}
                  </Badge>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-medium">Mức lương dự kiến:</span>
                  <span className="font-semibold text-foreground">
                    {workspace.requisition.salaryMin ? `${workspace.requisition.salaryMin.toLocaleString()} - ${workspace.requisition.salaryMax?.toLocaleString() ?? "Thỏa thuận"}` : "Thỏa thuận"}
                  </span>
                </div>
              </div>
            </PageCard>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="postings"><PostingsTab postings={postings} onPublish={(postingId) => { publish.mutate(postingId); }} publishing={publish.isPending} canPublish={hasPermission("recruitment.posting.manage")} onSync={(postingId) => { sync.mutate(postingId); }} syncing={sync.isPending} canSync={hasPermission("recruitment.intake.manage")} onOpen={(postingId) => { setSelectedPosting(postings.find((posting) => posting.id === postingId) ?? null); }} /></TabsContent>
      <TabsContent value="candidate"><PageCard padding="sm"><div className="mb-4 flex items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); }} className="h-9 rounded-full pl-9 text-xs" placeholder="Tìm ứng viên, email, stage..." /></div><span className="text-xs text-muted-foreground">{filtered.length} ứng viên</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="p-3">Ứng viên</th><th className="p-3">Liên hệ</th><th className="p-3">Bài đăng</th><th className="p-3">Giai đoạn</th></tr></thead><tbody>{filtered.map((application) => <tr key={application.id} onClick={() => { navigate(`/recruitment/applications/${application.id}`); }} className="group cursor-pointer border-b transition-colors hover:bg-muted/30 last:border-0"><td className="p-3 font-medium"><span className="font-semibold text-foreground group-hover:text-primary group-hover:underline text-left transition-colors">{application.candidate.fullName}</span><p className="font-mono text-[10px] font-normal text-muted-foreground">#{application.id.slice(0, 6)}</p></td><td className="p-3 text-muted-foreground">{application.candidate.email}<p className="text-xs">{application.candidate.phone ?? ""}</p></td><td className="p-3 text-xs text-muted-foreground">{postings.find((posting) => posting.id === application.postingId)?.source ?? "Nguồn tuyển dụng"}</td><td className="p-3"><StatusPill label={application.pipelineStage?.name ?? "Nộp CV"} variant="info" /></td></tr>)}{filtered.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">Chưa có ứng viên trong yêu cầu này.</td></tr>}</tbody></table></div></PageCard></TabsContent>
      <TabsContent value="kanban"><KanbanPage requisitionId={id} embedded /></TabsContent>
      <TabsContent value="interviews"><RequisitionInterviewsTab applications={applications} canSchedule={hasPermission("recruitment.create")} onCreated={() => { void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisition-workspace", id] }) }} /></TabsContent>
      <TabsContent value="offers"><RequisitionOffersTab applications={applications} canCreate={hasPermission("recruitment.create")} onCreated={() => { void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisition-workspace", id] }) }} /></TabsContent>
      <TabsContent value="background-checks"><RequisitionBackgroundChecksTab applications={applications} /></TabsContent>
      <TabsContent value="activity"><ActivityTab activities={activities} /></TabsContent>
    </Tabs>
    <CreateJobPostingDialog open={isPostingOpen} onOpenChange={(open) => { setIsPostingOpen(open); if (!open) { setSearchParams({}, { replace: true }); void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisition-workspace", id] }) } }} jobRequisitions={[workspace.requisition]} initialRequisitionId={id} />
    <ViewJobPostingDialog open={Boolean(selectedPosting)} onOpenChange={(open) => { if (!open) setSelectedPosting(null) }} posting={selectedPosting} />
    <ApplicationDetailPanel open={Boolean(selectedAppId)} onOpenChange={(open) => { if (!open) setSelectedAppId(null) }} applicationId={selectedAppId} />
  </div>
}

function PostingsTab({ postings, onPublish, publishing, canPublish, onSync, syncing, canSync, onOpen }: { postings: JobPosting[]; onPublish: (id: string) => void; publishing: boolean; canPublish: boolean; onSync: (id: string) => void; syncing: boolean; canSync: boolean; onOpen: (id: string) => void }) { return <PageCard padding="sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Các bài đăng thuộc yêu cầu</h2><p className="text-xs text-muted-foreground">Mỗi bài đăng là một nguồn tiếp nhận ứng viên.</p></div><span className="text-xs text-muted-foreground">{postings.length} bài đăng</span></div><div className="space-y-3">{postings.map((posting) => <div key={posting.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-4"><div><p className="font-semibold">{posting.source === "google_form" ? "Google Form" : posting.source}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{posting.sourceCode}</p><StatusPill label={posting.status === "open" ? "Đang mở" : posting.status === "archived" ? "Đã lưu trữ" : "Nháp"} variant={posting.status === "open" ? "success" : "neutral"} /></div><div className="flex items-center gap-2"><Button variant="outline" className="rounded-full" onClick={() => { onOpen(posting.id); }}><ExternalLink className="mr-2 size-4" />Chi tiết</Button>{posting.status === "draft" && posting.channel === "google_form" && canPublish && <Button variant="outline" className="rounded-full" onClick={() => { onPublish(posting.id); }} disabled={publishing}><FileSpreadsheet className="mr-2 size-4" />{publishing ? "Đang xuất bản" : "Xuất bản Form"}</Button>}{posting.postingUrl && <Button variant="outline" className="rounded-full" asChild><a href={posting.postingUrl} target="_blank" rel="noreferrer">Mở form</a></Button>}{posting.status === "open" && posting.connectorStatus === "ready" && canSync && <Button className="rounded-full" onClick={() => { onSync(posting.id); }} disabled={syncing}><RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />Đồng bộ</Button>}</div></div>)}{postings.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Chưa có bài đăng. Tạo bài đăng để bắt đầu nhận ứng viên.</p>}</div></PageCard> }

function ActivityTab({ activities }: { activities: Array<{ id: string; type: string; metadata: Record<string, unknown> | null; createdAt: string; actor: { fullName: string } | null }> }) { return <PageCard><h2 className="font-semibold">Hoạt động yêu cầu tuyển dụng</h2><p className="mt-1 text-xs text-muted-foreground">Lịch sử pipeline, ứng viên và đồng bộ từ tất cả bài đăng.</p><div className="mt-5 space-y-3">{activities.map((activity) => <div key={activity.id} className="border-b pb-3 text-sm last:border-0"><p className="font-medium">{activity.actor?.fullName ?? "Hệ thống"} · {activity.type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">{String(activity.metadata?.message ?? activity.metadata?.name ?? "")}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString("vi-VN")}</p></div>)}{activities.length === 0 && <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>}</div></PageCard> }
