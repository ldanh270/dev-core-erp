import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  INTERVIEW_RESULT,
  INTERVIEW_RESULT_LABELS,
  INTERVIEW_TYPE_LABELS,
} from "@/config/entities/recruitment.config"
import type { InterviewRound } from "@/types/recruitment.types"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Minus,
  Users,
  Video,
  XCircle,
} from "lucide-react"

const resultIconMap: Record<string, React.ReactNode> = {
  [INTERVIEW_RESULT.PASS]: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  [INTERVIEW_RESULT.FAIL]: <XCircle className="h-4 w-4 text-destructive" />,
  [INTERVIEW_RESULT.PENDING]: <Minus className="h-4 w-4 text-amber-500" />,
}

export interface InterviewCardProps {
  interview: InterviewRound
  onClick?: () => void
}

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEE, dd/MM", { locale: vi })
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string) {
  try {
    return format(parseISO(dateStr), "HH:mm")
  } catch {
    return ""
  }
}

/**
 * Pure UI presenter displaying an interview round card with schedule times,
 * round number badges, format tags, and result status indicators.
 */
export function InterviewCard({ interview, onClick }: InterviewCardProps) {
  const isOnline = interview.format === "video_call"

  return (
    <Card
      onClick={onClick}
      className="p-4 hover:shadow-md transition-shadow rounded-xl cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full text-[10px]">
            Vòng {interview.roundNumber}
          </Badge>
          <Badge variant="secondary" className="rounded-full text-[10px]">
            {interview.interviewType
              ? INTERVIEW_TYPE_LABELS[interview.interviewType] || interview.interviewType
              : interview.title || "Phỏng vấn"}
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
          {isOnline ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
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
