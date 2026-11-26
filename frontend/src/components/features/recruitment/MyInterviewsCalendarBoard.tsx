import { BoardCard, BoardColumn, BoardColumnHeader, BoardView, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { INTERVIEW_FORMAT_LABELS } from "@/config/entities/recruitment.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { InterviewRound } from "@/types/recruitment.types"
import { format, isSameDay, isToday } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, MapPin, Search, Video } from "lucide-react"

const WEEKDAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]

function getStatusPillInfo(status: string) {
  if (status === "completed") {
    return { label: "Đã xong", variant: "success" as const }
  }
  if (status === "cancelled") {
    return { label: "Hủy", variant: "danger" as const }
  }
  return { label: "Chờ", variant: "info" as const }
}

function MyInterviewCalendarCard({
  interview,
  onSelect,
}: {
  interview: InterviewRound
  onSelect: (interview: InterviewRound) => void
}) {
  const pill = getStatusPillInfo(interview.status)

  return (
    <BoardCard
      onClick={() => {
        onSelect(interview)
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
            {interview.scheduledAt ? format(new Date(interview.scheduledAt), "HH:mm") : "--:--"}
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
            {new Map(Object.entries(INTERVIEW_FORMAT_LABELS)).get(interview.format) ??
              interview.format}
          </span>
        </div>
        <StatusPill label={pill.label} variant={pill.variant} />
      </div>
    </BoardCard>
  )
}

function MyInterviewCalendarColumn({
  day,
  dayIndex,
  interviews,
  isLoading,
  onSelectInterview,
}: {
  day: Date
  dayIndex: number
  interviews: InterviewRound[]
  isLoading: boolean
  onSelectInterview: (interview: InterviewRound) => void
}) {
  const dayIsToday = isToday(day)
  const dayInterviews = interviews.filter(
    (i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), day),
  )

  const dayLabel = WEEKDAY_NAMES.at(dayIndex % WEEKDAY_NAMES.length) ?? ""

  return (
    <BoardColumn
      isHighlighted={dayIsToday}
      scrollType="always"
      className="flex-1 min-w-44 h-full"
      header={
        <BoardColumnHeader
          title={dayLabel}
          actions={
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                dayIsToday ? "bg-primary text-primary-foreground shadow-xs" : "text-foreground",
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
          <MyInterviewCalendarCard
            key={interview.id}
            interview={interview}
            onSelect={onSelectInterview}
          />
        ))
      )}
    </BoardColumn>
  )
}

export interface MyInterviewsCalendarBoardProps {
  weekDays: Date[]
  interviews: InterviewRound[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
  onSelectInterview: (interview: InterviewRound) => void
}

/**
 * Pure UI presentational component rendering weekly calendar columns
 * of scheduled interviews with search filtering and week navigation.
 */
export function MyInterviewsCalendarBoard({
  weekDays,
  interviews,
  isLoading,
  searchQuery,
  onSearchChange,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onSelectInterview,
}: MyInterviewsCalendarBoardProps) {
  const startDay = weekDays.at(0)
  const endDay = weekDays.at(6)

  return (
    <BoardView
      layout="stretch"
      scrollType="always"
      toolbarLeft={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevWeek}
            className="size-8 rounded-full p-0 transition-colors hover:bg-secondary"
            aria-label="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCurrentWeek}
            className="h-8 rounded-full px-3 text-xs font-bold border-border/80 hover:bg-secondary"
          >
            Hôm nay
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="size-8 rounded-full p-0 transition-colors hover:bg-secondary"
            aria-label="Tuần sau"
          >
            <ChevronRight className="size-4" />
          </Button>

          {startDay && endDay && (
            <span className="text-sm font-bold text-foreground">
              Tuần: {format(startDay, "dd/MM/yyyy")} — {format(endDay, "dd/MM/yyyy")}
            </span>
          )}
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
              onSearchChange(e.target.value)
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
      {weekDays.map((day, idx) => (
        <MyInterviewCalendarColumn
          key={day.toISOString()}
          day={day}
          dayIndex={idx}
          interviews={interviews}
          isLoading={isLoading}
          onSelectInterview={onSelectInterview}
        />
      ))}
    </BoardView>
  )
}
