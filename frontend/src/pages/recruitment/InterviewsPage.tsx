import { useMemo, useState } from "react"
import { AppPagination, DataTableToolbar, PageCard, PageContainer, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { ViewInterviewDialog } from "@/components/features/recruitment/view-interview-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUpcomingInterviews } from "@/hooks/recruitment/use-recruitment-queries"
import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_RESULT,
} from "@/config/entities/recruitment.config"
import type { InterviewRound } from "@/types/recruitment.types"
import {
  Plus,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Minus,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"

const resultIconMap: Record<string, React.ReactNode> = {
  [INTERVIEW_RESULT.PASS]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [INTERVIEW_RESULT.FAIL]: <XCircle className="h-4 w-4 text-red-500" />,
  [INTERVIEW_RESULT.PENDING]: <Minus className="h-4 w-4 text-yellow-500" />,
}

const resultVariantMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  [INTERVIEW_RESULT.PASS]: "success",
  [INTERVIEW_RESULT.FAIL]: "danger",
  [INTERVIEW_RESULT.PENDING]: "warning",
  [INTERVIEW_RESULT.NO_SHOW]: "danger",
}

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: INTERVIEW_RESULT.PENDING, label: "Chờ kết quả" },
  { id: INTERVIEW_RESULT.PASS, label: "Đạt" },
  { id: INTERVIEW_RESULT.FAIL, label: "Không đạt" },
  { id: INTERVIEW_RESULT.NO_SHOW, label: "Vắng mặt" },
]

interface InterviewCardProps {
  interview: InterviewRound
}

function InterviewCard({ interview }: InterviewCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, dd/MM", { locale: vi })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "HH:mm")
    } catch {
      return ""
    }
  }

  const isOnline = interview.format === "video_call"

  return (
    <Card className="p-4 hover:shadow-md transition-shadow rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10px]">
            Vòng {interview.roundNumber}
          </Badge>
          <Badge variant="secondary" className="rounded-full text-[10px]">
            {interview.interviewType ? INTERVIEW_TYPE_LABELS[interview.interviewType] || interview.interviewType : interview.title || "Phỏng vấn"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {interview.result && resultIconMap[interview.result]}
          {interview.result && (
            <span className="text-xs text-muted-foreground font-medium">
              {INTERVIEW_RESULT_LABELS[interview.result]}
            </span>
          )}
        </div>
      </div>

      <p className="font-medium text-sm text-foreground mb-1">{interview.candidateName}</p>
      <p className="text-xs text-muted-foreground mb-3">{interview.positionTitle}</p>

      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
        {interview.scheduledAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(interview.scheduledAt)}</span>
            <Clock className="h-3.5 w-3.5 ml-2" />
            <span>{formatTime(interview.scheduledAt)}</span>
            {interview.durationMinutes && (
              <span className="ml-1">({interview.durationMinutes} phút)</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <MapPin className="h-3.5 w-3.5" />
          )}
          <span>
            {isOnline
              ? interview.meetingLink
                ? "Online"
                : "Chưa có link"
              : interview.location || "Chưa có địa điểm"}
          </span>
        </div>
        {interview.interviewers && interview.interviewers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>{interview.interviewers.length} người phỏng vấn</span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function InterviewsPage() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedInterview, setSelectedInterview] = useState<InterviewRound | null>(null)
  const [viewInterviewOpen, setViewInterviewOpen] = useState(false)

  const handleViewDetails = (interview: InterviewRound) => {
    setSelectedInterview(interview)
    setViewInterviewOpen(true)
  }

  const { data: upcomingData, isLoading } = useUpcomingInterviews(14)
  const interviews = useMemo(() => upcomingData ?? [], [upcomingData])

  const tabCounts = useMemo(() => {
    const counts = new Map<string, number>()
    counts.set("all", interviews.length)
    for (const item of interviews) {
      const key = item.result || INTERVIEW_RESULT.PENDING
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return Object.fromEntries(counts)
  }, [interviews])

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const itemResult = item.result || INTERVIEW_RESULT.PENDING
      if (activeTab !== "all" && itemResult !== activeTab) return false

      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      return (
        item.candidateName?.toLowerCase().includes(searchStr) ||
        item.positionTitle?.toLowerCase().includes(searchStr) ||
        (item.interviewType && INTERVIEW_TYPE_LABELS[item.interviewType]?.toLowerCase().includes(searchStr))
      )
    })
  }, [interviews, activeTab, keyword])

  const paginatedInterviews = useMemo(() => {
    return filteredInterviews.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredInterviews, page, pageSize])

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Lịch phỏng vấn"
        description="Quản lý lịch phỏng vấn và đánh giá ứng viên"
        actions={
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch phỏng vấn
          </Button>
        }
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <nav
          aria-label="Lọc theo kết quả phỏng vấn"
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id] || 0
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Toolbar */}
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(val) => {
            setKeyword(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm theo tên ứng viên, vị trí tuyển dụng..."
          actions={
            <div className="flex items-center gap-1 border border-border rounded-full p-0.5 bg-muted/20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setViewMode("table"); }}
                    className="h-7 px-3 rounded-full text-xs gap-1.5"
                  >
                    <List className="h-3.5 w-3.5" />
                    Bảng
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xem dạng bảng</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setViewMode("cards"); }}
                    className="h-7 px-3 rounded-full text-xs gap-1.5"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Thẻ
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xem dạng thẻ</TooltipContent>
              </Tooltip>
            </div>
          }
        />

        {viewMode === "cards" ? (
          <div className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-xl" />
                ))}
              </div>
            ) : paginatedInterviews.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                {keyword || activeTab !== "all"
                  ? "Không tìm thấy lịch phỏng vấn phù hợp với bộ lọc"
                  : "Chưa có lịch phỏng vấn nào"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-56 px-4 py-2">Ứng viên</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell min-w-44 px-4 py-2">Vị trí</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28 px-4 py-2">Vòng</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-36 px-4 py-2">Loại</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-44 px-4 py-2">Thời gian</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-36 px-4 py-2">Hình thức</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-36 px-4 py-2">Kết quả</TableHead>
                  <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28 px-4 py-2 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8} className="p-3">
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedInterviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      {keyword || activeTab !== "all"
                        ? "Không tìm thấy lịch phỏng vấn phù hợp với bộ lọc"
                        : "Chưa có lịch phỏng vấn nào"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInterviews.map((interview: InterviewRound) => (
                    <TableRow
                      key={interview.id}
                      onClick={() => { handleViewDetails(interview); }}
                      className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
                    >
                      <TableCell className="h-[60px] px-4 py-3 font-medium text-foreground">
                        {interview.candidateName}
                      </TableCell>
                      <TableCell className="h-[60px] hidden md:table-cell px-4 py-3 text-muted-foreground text-sm">
                        {interview.positionTitle}
                      </TableCell>
                      <TableCell className="h-[60px] px-4 py-3">
                        <Badge variant="outline" className="rounded-full text-[11px]">Vòng {interview.roundNumber}</Badge>
                      </TableCell>
                      <TableCell className="h-[60px] hidden lg:table-cell px-4 py-3 text-sm">
                        {interview.interviewType ? INTERVIEW_TYPE_LABELS[interview.interviewType] || interview.interviewType : interview.title || "Phỏng vấn"}
                      </TableCell>
                      <TableCell className="h-[60px] px-4 py-3">
                        {interview.scheduledAt ? (
                          (() => {
                            try {
                              return (
                                <div className="text-sm">
                                  <p className="font-medium text-foreground">{format(parseISO(interview.scheduledAt), "dd/MM/yyyy", { locale: vi })}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {format(parseISO(interview.scheduledAt), "HH:mm", { locale: vi })}
                                    {interview.durationMinutes && ` (${interview.durationMinutes} phút)`}
                                  </p>
                                </div>
                              )
                            } catch {
                              return <span className="text-sm">{interview.scheduledAt}</span>
                            }
                          })()
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          {interview.format === "video_call" ? (
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span>{(interview.format && INTERVIEW_FORMAT_LABELS[interview.format]) || interview.format}</span>
                        </div>
                      </TableCell>
                      <TableCell className="h-[60px] px-4 py-3">
                        {interview.result ? (
                          <StatusPill
                            label={INTERVIEW_RESULT_LABELS[interview.result]}
                            variant={resultVariantMap[interview.result]}
                          />
                        ) : (
                          <StatusPill label="Chờ" variant="warning" />
                        )}
                      </TableCell>
                      <TableCell className="h-[60px] px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-muted"
                              onClick={() => { handleViewDetails(interview); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết phỏng vấn</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <AppPagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filteredInterviews.length / pageSize))}
          onPageChange={setPage}
          totalItems={filteredInterviews.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>

      <ViewInterviewDialog
        open={viewInterviewOpen}
        onOpenChange={setViewInterviewOpen}
        interview={selectedInterview}
      />
    </PageContainer>
  )
}

