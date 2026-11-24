import { interviewApi } from "@/lib/api/recruitment.api"
import type { InterviewRound } from "@/types/recruitment.types"
import { useQuery } from "@tanstack/react-query"
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  isSameDay,
  startOfWeek,
  subDays,
} from "date-fns"
import { useCallback, useMemo, useState } from "react"

/**
 * Manages calendar intervals, upcoming rounds, search filters,
 * and view mode toggling for interviewer personal scheduling.
 */
export function useMyInterviews() {
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

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentWeekStart])

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

  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart((prev) => subDays(prev, 7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart((prev) => addDays(prev, 7))
  }, [])

  const handleCurrentWeek = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }, [])

  const handleSelectInterview = useCallback((interview: InterviewRound | null) => {
    setSelectedInterview(interview)
  }, [])

  return {
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedInterview,
    handleSelectInterview,
    weekDays,
    filteredInterviews,
    interviewsCount: interviews.length,
    todayCount,
    pendingCount,
    completedCount,
    isLoading,
    handlePrevWeek,
    handleNextWeek,
    handleCurrentWeek,
  }
}
