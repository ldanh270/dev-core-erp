import {
  BoardCard,
  BoardColumn,
  BoardColumnHeader,
  BoardView,
  PageContainer,
  StatusPill,
} from "@/components/common"
import { InterviewFeedbackPanel } from "@/components/features/recruitment/interview-feedback-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_RESULT_LABELS,
} from "@/config/entities/recruitment.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { interviewApi } from "@/lib/api/recruitment.api"
import { routerNavigate } from "@/lib/router-navigator"
import { cn } from "@/lib/utils"
import type { InterviewRound } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subDays,
} from "date-fns"
import {
  ArrowUpRight,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  Layers,
  List,
  MapPin,
  Search,
  Star,
  Video,
} from "lucide-react"

const WEEKDAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]

export default function MyInterviewsPage() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInterview, setSelectedInterview] = useState<InterviewRound | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["recruitment", "upcoming-interviews"],
    queryFn: () => interviewApi.getUpcoming(),
  })

  // Calculates 7-day range for current week
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentWeekStart])

  // Filtered interviews list
  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const candidateName = interview.application?.candidate?.fullName || ""
      const title = interview.title || ""
      const matchesSearch =
        candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        title.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (activeTab === "upcoming") return interview.status === "scheduled"
      if (activeTab === "completed") return interview.status === "completed"
      return true
    })
  }, [interviews, searchQuery, activeTab])

  // Statistics
  const todayCount = useMemo(() => {
    const today = new Date()
    return interviews.filter((i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), today))
      .length
  }, [interviews])

  const pendingCount = useMemo(
    () => interviews.filter((i) => i.status === "scheduled").length,
    [interviews],
  )

  const completedCount = useMemo(
    () => interviews.filter((i) => i.status === "completed").length,
    [interviews],
  )

  return (
    <PageContainer variant="table" className="gap-4">
      {/* ── Page Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.PAGE_TITLE}>Lịch phỏng vấn của tôi</h1>
              <p className={TYPOGRAPHY.PAGE_SUBTITLE}>
                Theo dõi thời khóa biểu và gửi đánh giá ứng viên các vòng phỏng vấn
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card p-1 shadow-2xs">
          <Button
            size="sm"
            variant={viewMode === "calendar" ? "default" : "ghost"}
            onClick={() => {
              setViewMode("calendar")
            }}
            className="h-8 rounded-full px-4 text-xs font-bold transition-all"
          >
            <Grid className="mr-1.5 size-3.5" />
            Lịch tuần
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            onClick={() => {
              setViewMode("list")
            }}
            className="h-8 rounded-full px-4 text-xs font-bold transition-all"
          >
            <List className="mr-1.5 size-3.5" />
            Danh sách
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className={TYPOGRAPHY.TABLE_HEADER}>Tổng số buổi PV</span>
            <Layers className="size-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{interviews.length}</span>
            <span className="text-xs font-medium text-muted-foreground">Tất cả các vòng</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-warning/40 hover:shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className={TYPOGRAPHY.TABLE_HEADER}>Hôm nay</span>
            <Clock className="size-4 text-warning" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-warning">{todayCount}</span>
            <span className="text-xs font-medium text-muted-foreground">Buổi phỏng vấn</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-info/40 hover:shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className={TYPOGRAPHY.TABLE_HEADER}>Sắp diễn ra</span>
            <CalendarIcon className="size-4 text-info" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-info">{pendingCount}</span>
            <span className="text-xs font-medium text-muted-foreground">Chờ đánh giá</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-success/40 hover:shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className={TYPOGRAPHY.TABLE_HEADER}>Đã hoàn thành</span>
            <CheckCircle2 className="size-4 text-success" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-success">{completedCount}</span>
            <span className="text-xs font-medium text-muted-foreground">Đã ghi nhận</span>
          </div>
        </div>
      </div>

      {/* ── Main View Content ────────────────────────────────────────────────────── */}
      {viewMode === "calendar" ? (
        /* ── CALENDAR BOARD VIEW WITH BUILT-IN HORIZONTAL & VERTICAL SCROLLBARS ───── */
        <BoardView
          layout="stretch"
          scrollType="always"
          toolbarLeft={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentWeekStart((prev) => subDays(prev, 7))
                }}
                className="size-8 rounded-full p-0 transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                }}
                className="h-8 rounded-full px-3 text-xs font-bold border-border/80 hover:bg-secondary"
              >
                Hôm nay
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentWeekStart((prev) => addDays(prev, 7))
                }}
                className="size-8 rounded-full p-0 transition-colors hover:bg-secondary"
              >
                <ChevronRight className="size-4" />
              </Button>

              <span className="text-sm font-bold text-foreground">
                Tuần: {format(weekDays[0], "dd/MM/yyyy")} — {format(weekDays[6], "dd/MM/yyyy")}
              </span>
            </>
          }
          toolbarRight={
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Lọc ứng viên..."
                className="h-8 rounded-full pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
              />
            </div>
          }
          legend={
            <>
              <span className="font-bold text-foreground">Ghi chú:</span>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-info" />
                <span>Sắp diễn ra</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" />
                <span>Đã hoàn thành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive" />
                <span>Đã hủy</span>
              </div>
            </>
          }
          footerText="Bấm vào bất kỳ thẻ phỏng vấn nào để mở phiếu đánh giá ứng viên"
        >
          {weekDays.map((day, idx) => {
            const dayIsToday = isToday(day)
            const dayInterviews = filteredInterviews.filter(
              (i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), day),
            )

            return (
              <BoardColumn
                key={day.toISOString()}
                isHighlighted={dayIsToday}
                scrollType="always"
                className="flex-1 min-w-44 h-full"
                header={
                  <BoardColumnHeader
                    title={WEEKDAY_NAMES[idx % WEEKDAY_NAMES.length]}
                    actions={
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                          dayIsToday
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    }
                  />
                }
                isEmpty={!isLoading && dayInterviews.length === 0}
                emptyState={<span>Không có lịch</span>}
              >
                {isLoading ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">Tải...</div>
                ) : (
                  dayInterviews.map((interview) => (
                    <BoardCard
                      key={interview.id}
                      onClick={() => {
                        setSelectedInterview(interview)
                      }}
                      className="p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            TYPOGRAPHY.BOARD_CARD_SUB,
                            "font-semibold text-primary truncate max-w-[120px]",
                          )}
                        >
                          {interview.title}
                        </span>
                        <div
                          className={cn(
                            TYPOGRAPHY.BOARD_CARD_TIME,
                            "flex items-center gap-1 text-muted-foreground shrink-0",
                          )}
                        >
                          <Clock className="size-3 text-warning shrink-0" />
                          <span>
                            {interview.scheduledAt
                              ? format(new Date(interview.scheduledAt), "HH:mm")
                              : "--:--"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                          {interview.application?.candidate?.fullName?.charAt(0) ?? "U"}
                        </div>
                        <span className={cn(TYPOGRAPHY.BOARD_CARD_TITLE, "truncate")}>
                          {interview.application?.candidate?.fullName}
                        </span>
                      </div>

                      <div
                        className={cn(
                          TYPOGRAPHY.BOARD_CARD_SUB,
                          "flex items-center justify-between pt-1.5 border-t border-border/30",
                        )}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {interview.format === "video_call" ? (
                            <Video className="size-3 text-info shrink-0" />
                          ) : (
                            <MapPin className="size-3 text-success shrink-0" />
                          )}
                          <span className="truncate">
                            {INTERVIEW_FORMAT_LABELS[interview.format] ?? interview.format}
                          </span>
                        </div>
                        <StatusPill
                          label={
                            interview.status === "completed"
                              ? "Đã xong"
                              : interview.status === "cancelled"
                                ? "Hủy"
                                : "Chờ"
                          }
                          variant={
                            interview.status === "completed"
                              ? "success"
                              : interview.status === "cancelled"
                                ? "danger"
                                : "info"
                          }
                        />
                      </div>
                    </BoardCard>
                  ))
                )}
              </BoardColumn>
            )
          })}
        </BoardView>
      ) : (
        /* ── LIST VIEW ────────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border/60 p-4 rounded-xl">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ứng viên, vị trí phỏng vấn..."
                className="h-10 rounded-full pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 rounded-full sm:w-[320px]">
                <TabsTrigger value="all" className="rounded-full text-xs font-semibold">
                  Tất cả ({interviews.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="rounded-full text-xs font-semibold">
                  Sắp tới ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-full text-xs font-semibold">
                  Đã xong ({completedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Cards List */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Đang tải lịch phỏng vấn...
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-16 text-center space-y-3 bg-card/40">
              <CalendarXIcon className="mx-auto size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Không tìm thấy lịch phỏng vấn nào.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onFeedback={() => {
                    setSelectedInterview(interview)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Interview Feedback & Rating Panel (Sheet) ─────────────────────────── */}
      <InterviewFeedbackPanel
        interview={selectedInterview}
        open={Boolean(selectedInterview)}
        onOpenChange={(open) => {
          if (!open) setSelectedInterview(null)
        }}
      />
    </PageContainer>
  )
}

function CalendarXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function InterviewCard({
  interview,
  onFeedback,
}: {
  interview: InterviewRound
  onFeedback: () => void
}) {
  const candidate = interview.application?.candidate

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full border border-border/50 bg-primary/10 text-lg font-bold text-primary overflow-hidden shrink-0 shadow-2xs">
          {candidate?.avatarUrl ? (
            <img
              src={candidate.avatarUrl}
              alt={candidate.fullName ?? "Ứng viên"}
              className="size-full object-cover"
            />
          ) : (
            (candidate?.fullName?.charAt(0).toUpperCase() ?? "U")
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(TYPOGRAPHY.BOARD_CARD_TITLE, "text-base")}>
              {candidate?.fullName || "Ứng viên chưa cập nhật"}
            </h4>
            <Badge
              variant="outline"
              className="rounded-full bg-primary/10 text-primary border-primary/20 font-bold text-xs"
            >
              Vòng {interview.roundNumber}: {interview.title}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Yêu cầu tuyển dụng:{" "}
            <span className="text-foreground">
              {interview.application?.requisition?.title || "N/A"}
            </span>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-foreground font-semibold">
              <CalendarIcon className="size-3.5 text-primary" />
              <span className="font-mono">
                {interview.scheduledAt
                  ? format(new Date(interview.scheduledAt), "HH:mm, dd/MM/yyyy")
                  : "Chưa xếp lịch"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-foreground font-semibold">
              {interview.format === "video_call" ? (
                <Video className="size-3.5 text-info" />
              ) : (
                <MapPin className="size-3.5 text-success" />
              )}
              <span>{INTERVIEW_FORMAT_LABELS[interview.format] ?? interview.format}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <StatusPill
          label={
            interview.status === "completed"
              ? (INTERVIEW_RESULT_LABELS[interview.result as string] ?? "Đã xong")
              : interview.status === "scheduled"
                ? "Sắp diễn ra"
                : interview.status === "cancelled"
                  ? "Đã hủy"
                  : "Chưa phỏng vấn"
          }
          variant={
            interview.result === "pass"
              ? "success"
              : interview.result === "fail" ||
                  interview.status === "cancelled" ||
                  interview.status === "no_show"
                ? "danger"
                : interview.status === "scheduled"
                  ? "info"
                  : "neutral"
          }
        />

        <div className="flex items-center gap-2">
          {interview.application?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (interview.application?.id)
                  routerNavigate(`/recruitment/applications/${interview.application.id}`)
              }}
              className="h-8 rounded-full text-xs font-semibold border-border/80 hover:bg-secondary"
            >
              Hồ sơ
              <ArrowUpRight className="ml-1 size-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onFeedback}
            className="h-8 rounded-full px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <Star className="mr-1.5 size-3.5 fill-current" />
            {interview.status === "completed" ? "Xem đánh giá" : "Đánh giá ngay"}
          </Button>
        </div>
      </div>
    </div>
  )
}
