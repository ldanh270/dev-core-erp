import { PageCard, useConfirm } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { RecruitmentWorkspaceSkeleton } from "@/components/features/recruitment/recruitment-workspace-skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useArchiveJobPosting,
  useJobPosting,
  useSyncJobPosting,
} from "@/hooks/recruitment/use-recruitment-queries"
import { applicationApi, jobPostingApi } from "@/lib/api/recruitment.api"
import { extractErrorMessage } from "@/utils/error-helper"

import { type ReactNode, useEffect, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  ArrowLeft,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import KanbanPage from "./KanbanPage"

const TABS = [
  ["overview", "Tổng quan"],
  ["applicants", "Ứng viên"],
  ["kanban", "Bảng Kanban"],
  ["activity", "Hoạt động"],
] as const

export default function JobPostingDetailPage() {
  const { id = "", tab } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const activeTab = tab && TABS.some(([value]) => value === tab) ? tab : "overview"
  const { data: posting, isLoading, isError } = useJobPosting(id)
  const { data: overview } = useQuery({
    queryKey: ["recruitment", "job-posting-overview", id],
    queryFn: () => jobPostingApi.overview(id),
    enabled: Boolean(id),
  })
  const { data: stages = [] } = useQuery({
    queryKey: ["recruitment", "posting-stages", id],
    queryFn: () => jobPostingApi.stages(id),
    enabled: Boolean(id),
  })
  const { data: applications } = useQuery({
    queryKey: ["recruitment", "applications", "posting", id],
    queryFn: () => applicationApi.list({ postingId: id, pageSize: 100 }),
    enabled: Boolean(id),
  })
  const { data: activities = [] } = useQuery({
    queryKey: ["recruitment", "job-postings", id, "activities"],
    queryFn: () => jobPostingApi.activities(id),
    enabled: Boolean(id),
  })
  const { data: responses = [] } = useQuery({
    queryKey: ["recruitment", "job-postings", id, "responses"],
    queryFn: () => jobPostingApi.responses(id),
    enabled: Boolean(id),
  })
  const sync = useSyncJobPosting()
  const archive = useArchiveJobPosting()
  const confirm = useConfirm()
  const [query, setQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const candidates = applications?.data ?? []

  useEffect(() => {
    if (id && tab !== activeTab)
      navigate(`/recruitment/job-postings/${id}/${activeTab}`, { replace: true })
  }, [activeTab, id, navigate, tab])
  useEffect(() => {
    if (posting?.requisitionId)
      navigate(`/recruitment/requisitions/${posting.requisitionId}/postings?postingId=${id}`, {
        replace: true,
      })
  }, [id, navigate, posting?.requisitionId])
  if (isLoading) return <RecruitmentWorkspaceSkeleton />
  if (isError || !posting)
    return (
      <div className="container space-y-3 p-8">
        <p className="font-semibold text-destructive">Không tải được bài đăng tuyển dụng.</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/recruitment/requisitions">Quay lại yêu cầu tuyển dụng</Link>
        </Button>
      </div>
    )
  const canSync = posting.channel === "google_form" && posting.status === "open"
  const invalidResponses = responses.filter((response) => !response.applicationId)
  const filteredCandidates = candidates.filter((application) =>
    `${application.candidate.fullName} ${application.candidate.email} ${application.pipelineStage?.name ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  )

  return (
    <div className="container space-y-6 px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" className="h-8 rounded-full px-2 text-muted-foreground" asChild>
            <Link to="/recruitment/job-postings">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Bài đăng tuyển dụng
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {posting.requisition?.title ?? "Bài đăng tuyển dụng"}
            </h1>
            <StatusPill
              label={
                posting.status === "open"
                  ? "Đang mở"
                  : posting.status === "archived"
                    ? "Đã lưu trữ"
                    : "Nháp"
              }
              variant={posting.status === "open" ? "success" : "neutral"}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {posting.requisition?.code} · {posting.requisition?.department || "Chưa có phòng ban"} ·
            Google Form workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {posting.postingUrl && (
            <Button variant="outline" className="rounded-full" asChild>
              <a href={posting.postingUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Mở form
              </a>
            </Button>
          )}
          {canSync && (
            <Button
              className="rounded-full"
              onClick={() => sync.mutate(id)}
              disabled={sync.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
              Đồng bộ Form
            </Button>
          )}
        </div>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          navigate(`/recruitment/job-postings/${id}/${value}`)
        }}
        className="space-y-6"
      >
        <TabsList className="inline-flex rounded-full border border-border/40 bg-secondary p-1">
          {TABS.map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              icon={<Users />}
              label="Ứng viên"
              value={overview?.applicationTotal ?? candidates.length}
            />
            <Metric icon={<FileSpreadsheet />} label="Giai đoạn pipeline" value={stages.length} />
            <Metric
              icon={<RefreshCw />}
              label="Lần đồng bộ"
              value={
                posting.lastSyncedAt
                  ? new Date(posting.lastSyncedAt).toLocaleDateString("vi-VN")
                  : "Chưa có"
              }
            />
          </div>
          <PageCard className="mt-4">
            <h2 className="mb-4 font-semibold">Tiến độ tuyển dụng</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {stages.map((stage) => (
                <div key={stage.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="truncate text-xs font-semibold">{stage.name}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold">
                    {overview?.stageGroups.find((group) => group.pipelineStageId === stage.id)
                      ?._count._all ??
                      candidates.filter((application) => application.pipelineStage?.id === stage.id)
                        .length}
                  </p>
                </div>
              ))}
            </div>
          </PageCard>
        </TabsContent>
        <TabsContent value="applicants">
          <PageCard padding="sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                  }}
                  className="h-9 rounded-full pl-9 text-xs"
                  placeholder="Tìm theo ứng viên, email, giai đoạn..."
                />
              </div>
              <Button
                className="rounded-full text-xs font-bold"
                onClick={() => {
                  setIsCreateOpen(true)
                }}
              >
                <Plus className="mr-1.5 size-3.5" />
                Thêm ứng viên
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="p-3">Ứng viên</th>
                    <th className="p-3">Liên hệ</th>
                    <th className="p-3">Giai đoạn</th>
                    <th className="p-3">Người phụ trách</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((application) => (
                    <tr key={application.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        {application.candidate.fullName}
                        <p className="mt-0.5 font-mono text-[10px] font-normal text-muted-foreground">
                          #{application.id.substring(0, 6)}
                        </p>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {application.candidate.email}
                        <p className="mt-0.5 text-xs">{application.candidate.phone ?? ""}</p>
                      </td>
                      <td className="p-3">
                        <StatusPill
                          label={application.pipelineStage?.name ?? "Nộp đơn"}
                          variant="info"
                        />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {application.assignedTo?.fullName ?? "Chưa phân công"}
                      </td>
                    </tr>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-muted-foreground">
                        Chưa có ứng viên. Thêm thủ công hoặc đồng bộ từ Google Form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PageCard>
        </TabsContent>
        <TabsContent value="kanban">
          <KanbanPage postingId={id} embedded />
        </TabsContent>
        <TabsContent value="activity">
          <PageCard className="space-y-4">
            <div>
              <p className="font-semibold">Hoạt động bài đăng</p>
              <p className="text-xs text-muted-foreground">
                Lịch sử pipeline, ứng viên và đồng bộ Google Form.
              </p>
            </div>
            {activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3 text-sm last:border-0">
                <p className="font-medium">
                  {activity.actor?.fullName ?? "Hệ thống"} · {formatActivity(activity.type)}
                </p>
                {activity.metadata && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(
                      activity.metadata.message ??
                        activity.metadata.name ??
                        activity.metadata.code ??
                        "",
                    )}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
            {invalidResponses.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="font-semibold">Lỗi đồng bộ ({invalidResponses.length})</p>
                {invalidResponses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs"
                  >
                    <p className="font-medium">
                      {response.errorMessage ?? "Dữ liệu Form không hợp lệ"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {response.responseData?.email ??
                        response.responseData?.email_address ??
                        "Không có email"}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {activities.length === 0 && invalidResponses.length === 0 && (
              <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>
            )}
            <Button
              variant="ghost"
              className="rounded-full text-destructive"
              disabled={archive.isPending}
              onClick={async () => {
                if (
                  await confirm({
                    title: "Lưu trữ bài đăng",
                    description: "Ứng viên và lịch sử sẽ được giữ lại.",
                    variant: "destructive",
                  })
                )
                  archive.mutate(id)
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              Lưu trữ bài đăng
            </Button>
          </PageCard>
        </TabsContent>
      </Tabs>
      <CreateCandidateDialog postingId={id} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

function CreateCandidateDialog({
  postingId,
  open,
  onOpenChange,
}: {
  postingId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cvUrl, setCvUrl] = useState("")
  const [notes, setNotes] = useState("")
  const create = useMutation({
    mutationFn: () =>
      jobPostingApi.createCandidate(postingId, {
        fullName,
        email,
        phone: phone || undefined,
        cvUrl: cvUrl || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "posting-kanban", postingId] })
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "job-posting-overview", postingId],
      })
      toast.success("Đã thêm ứng viên vào giai đoạn mặc định")
      onOpenChange(false)
      setFullName("")
      setEmail("")
      setPhone("")
      setCvUrl("")
      setNotes("")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thêm ứng viên</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            create.mutate()
          }}
          className="space-y-3"
        >
          <div>
            <Label>
              Họ và tên{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              required
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>
              Email{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Link CV</Label>
            <Input
              type="url"
              value={cvUrl}
              onChange={(event) => {
                setCvUrl(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Input
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value)
              }}
              className="mt-1 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={create.isPending} className="rounded-full">
              Tạo ứng viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <PageCard className="flex items-center gap-3">
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </PageCard>
  )
}
function formatActivity(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
