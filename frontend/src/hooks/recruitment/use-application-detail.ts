import { INTERVIEW_FORMAT } from "@/config/entities/recruitment.config"
import { RECRUITMENT_MESSAGES } from "@/config/messages/recruitment.message"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { usePermission } from "@/hooks/use-permission"
import { applicationApi, interviewApi, requisitionApi } from "@/lib/api/recruitment.api"
import type { InterviewRound } from "@/types/recruitment.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useCallback, useMemo, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

const { ERRORS: RECRUIT_ERRORS, SUCCESS: RECRUIT_SUCCESS } = RECRUITMENT_MESSAGES

export function useApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const applicationId = id ?? ""
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

  // Edit Interview Round state
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editFormat, setEditFormat] = useState<string>(INTERVIEW_FORMAT.VIDEO_CALL)
  const [editDuration, setEditDuration] = useState("60")
  const [editScheduledAt, setEditScheduledAt] = useState("")
  const [editInterviewerId, setEditInterviewerId] = useState("")

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

  // Fetch employees list
  const { data: employeeData } = useEmployees({ limit: 200 }, { enabled: Boolean(id) })
  const employees = useMemo(() => employeeData?.data ?? [], [employeeData?.data])

  // Fetch requisition workspace for dynamic pipeline stages
  const requisitionId = application?.requisitionId
  const { data: requisitionWorkspace } = useQuery({
    queryKey: ["recruitment", "requisition-workspace", requisitionId],
    queryFn: () =>
      requisitionId
        ? requisitionApi.workspace(requisitionId)
        : Promise.reject(new Error("No requisition ID")),
    enabled: Boolean(requisitionId),
  })
  const dynamicStages = useMemo(
    () => requisitionWorkspace?.stages ?? [],
    [requisitionWorkspace?.stages],
  )

  // Add Note mutation
  const addNoteMutation = useMutation({
    mutationFn: (text: string) => applicationApi.addNote(applicationId, text),
    onSuccess: () => {
      toast.success(RECRUIT_SUCCESS.NOTE_ADDED)
      setNoteText("")
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application-notes", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Update Application Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => applicationApi.updateStatus(applicationId, { status }),
    onSuccess: () => {
      toast.success(RECRUIT_SUCCESS.STATUS_UPDATED)
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "application", id] })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  // Assign Recruiter mutation
  const assignRecruiterMutation = useMutation({
    mutationFn: (assignedToId: string) =>
      applicationApi.assignRecruiter(applicationId, assignedToId),
    onSuccess: () => {
      toast.success(RECRUIT_SUCCESS.ASSIGNEE_UPDATED)
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
        scheduledAt:
          roundScheduledAt && !isNaN(new Date(roundScheduledAt).getTime())
            ? new Date(roundScheduledAt).toISOString()
            : new Date().toISOString(),
        durationMinutes: Number(roundDuration) || 60,
        interviewerIds: roundInterviewerId
          ? [roundInterviewerId]
          : employees[0]?.id
            ? [employees[0].id]
            : [],
      })
    },
    onSuccess: () => {
      toast.success(RECRUIT_SUCCESS.INTERVIEW_CREATED)
      setIsScheduleModalOpen(false)
      setRoundTitle("")
      setRoundScheduledAt("")
      setRoundInterviewerId("")
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "application-interviews", id],
      })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const updateInterviewRoundMutation = useMutation({
    mutationFn: () => {
      if (!editingRound) return Promise.reject(new Error(RECRUIT_ERRORS.NO_ROUND_SELECTED))
      return interviewApi.update(editingRound.id, {
        title: editTitle.trim(),
        format: editFormat,
        durationMinutes: Number(editDuration) || 60,
        scheduledAt:
          editScheduledAt && !isNaN(new Date(editScheduledAt).getTime())
            ? new Date(editScheduledAt).toISOString()
            : new Date().toISOString(),
        interviewerIds: editInterviewerId ? [editInterviewerId] : [],
      })
    },
    onSuccess: () => {
      toast.success(RECRUIT_SUCCESS.INTERVIEW_UPDATED)
      setIsEditModalOpen(false)
      setEditingRound(null)
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "application-interviews", id],
      })
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const handleOpenEditRound = useCallback((round: InterviewRound) => {
    setEditingRound(round)
    setEditTitle(round.title)
    setEditFormat(round.format)
    setEditDuration(String(round.durationMinutes || 60))
    setEditScheduledAt(
      round.scheduledAt ? format(new Date(round.scheduledAt), "yyyy-MM-dd'T'HH:mm") : "",
    )
    setEditInterviewerId(round.interviewerIds?.[0] ?? "")
    setIsEditModalOpen(true)
  }, [])

  const handleOfferCreated = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["recruitment", "application", applicationId],
    })
  }, [queryClient, applicationId])

  return {
    applicationId,
    application,
    isLoading,
    interviews,
    isLoadingInterviews,
    notes,
    isLoadingNotes,
    employees,
    dynamicStages,
    canManage,
    activeTab,
    setActiveTab,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isOfferDialogOpen,
    setIsOfferDialogOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRound,
    noteText,
    setNoteText,
    // Schedule form state
    roundTitle,
    setRoundTitle,
    roundFormat,
    setRoundFormat,
    roundScheduledAt,
    setRoundScheduledAt,
    roundDuration,
    setRoundDuration,
    roundInterviewerId,
    setRoundInterviewerId,
    // Edit round form state
    editTitle,
    setEditTitle,
    editFormat,
    setEditFormat,
    editDuration,
    setEditDuration,
    editScheduledAt,
    setEditScheduledAt,
    editInterviewerId,
    setEditInterviewerId,
    // Handlers & mutations
    handleOpenEditRound,
    handleOfferCreated,
    addNoteMutation,
    updateStatusMutation,
    assignRecruiterMutation,
    createInterviewMutation,
    updateInterviewRoundMutation,
  }
}
