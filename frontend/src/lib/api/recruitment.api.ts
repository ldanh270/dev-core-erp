import apiClient from "@/lib/api-client"
import type {
  ApplicantImportResult,
  ApplicantImportRow,
  ApplicationNote,
  ApplicationStats,
  BackgroundCheck,
  BackgroundCheckStats,
  Candidate,
  InterviewRound,
  JobPosting,
  JobRequisition,
  KanbanApplication,
  OfferStats,
  OfferVersion,
  RecruitmentApplication,
  RecruitmentFormField,
  RecruitmentOffer,
  RecruitmentPostingActivity,
  RequisitionStats,
  Scorecard,
} from "@/types/recruitment.types"

interface PaginatedPayload<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

function toPaginatedResult<T>(payload: PaginatedPayload<T>): PaginatedResult<T> {
  return {
    data: payload.items,
    meta: {
      total: payload.total,
      page: payload.page,
      pageSize: payload.pageSize,
    },
  }
}

// ── Requisition API ──────────────────────────────────────────────────────────

export interface CreateRequisitionDto {
  title: string
  department?: string
  positionId?: string
  positionLevel?: string
  employmentType: string
  salaryMin?: number
  salaryMax?: number
  headcount?: number
  priority?: string
  reason?: string
  targetHireDate?: string
  targetCloseDate?: string
  approverId: string
  candidateSchema?: RecruitmentFormField[]
}

export interface RequisitionApprover {
  id: string
  fullName: string
  position: string | null
}

export type UpdateRequisitionDto = Partial<CreateRequisitionDto>

export const requisitionApi = {
  getApprovers: async (): Promise<RequisitionApprover[]> => {
    const response = await apiClient.get<{ data: RequisitionApprover[] }>(
      "/recruitment/requisitions/approvers",
    )
    return response.data.data
  },

  list: async (query?: {
    status?: string
    department?: string
    priority?: string
    page?: number
    pageSize?: number
  }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<JobRequisition> }>(
      "/recruitment/requisitions",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  getOne: async (id: string): Promise<JobRequisition> => {
    const response = await apiClient.get<{ data: JobRequisition }>(
      `/recruitment/requisitions/${id}`,
    )
    return response.data.data
  },

  workspace: async (
    id: string,
  ): Promise<{
    requisition: JobRequisition
    stages: import("@/types/recruitment.types").RecruitmentPipelineStage[]
    applications: {
      data: KanbanApplication[]
      meta: { total: number; page: number; pageSize: number }
    }
  }> => {
    const response = await apiClient.get<{
      data: {
        requisition: JobRequisition
        stages: import("@/types/recruitment.types").RecruitmentPipelineStage[]
        applications: { items: KanbanApplication[]; total: number; page: number; pageSize: number }
      }
    }>(`/recruitment/requisitions/${id}/workspace`)
    return {
      requisition: response.data.data.requisition,
      stages: response.data.data.stages,
      applications: toPaginatedResult(response.data.data.applications),
    }
  },
  activities: async (id: string): Promise<RecruitmentPostingActivity[]> =>
    (
      await apiClient.get<{ data: PaginatedPayload<RecruitmentPostingActivity> }>(
        `/recruitment/requisitions/${id}/activities`,
      )
    ).data.data.items,

  stages: async (id: string) =>
    (
      await apiClient.get<{
        data: import("@/types/recruitment.types").RecruitmentPipelineStage[]
      }>(`/recruitment/requisitions/${id}/stages`)
    ).data.data,
  createStage: async (
    id: string,
    data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
  ) => (await apiClient.post(`/recruitment/requisitions/${id}/stages`, data)).data.data,
  updateStage: async (id: string, stageId: string, data: Record<string, unknown>) =>
    (await apiClient.patch(`/recruitment/requisitions/${id}/stages/${stageId}`, data)).data.data,
  deleteStage: async (id: string, stageId: string, fallbackStageId: string) =>
    apiClient.delete(`/recruitment/requisitions/${id}/stages/${stageId}`, {
      params: { fallbackStageId },
    }),
  reorderStages: async (id: string, stageIds: string[]) =>
    (await apiClient.put(`/recruitment/requisitions/${id}/stages/reorder`, { stageIds })).data.data,
  moveApplicationStage: async (id: string, applicationId: string, pipelineStageId: string) =>
    (
      await apiClient.post(`/recruitment/requisitions/${id}/stages/move`, {
        applicationId,
        pipelineStageId,
      })
    ).data.data,

  create: async (data: CreateRequisitionDto): Promise<JobRequisition> => {
    const response = await apiClient.post<{ data: JobRequisition }>(
      "/recruitment/requisitions",
      data,
    )
    return response.data.data
  },

  update: async (id: string, data: UpdateRequisitionDto): Promise<JobRequisition> => {
    const response = await apiClient.patch<{ data: JobRequisition }>(
      `/recruitment/requisitions/${id}`,
      data,
    )
    return response.data.data
  },

  submitForApproval: async (id: string): Promise<JobRequisition> => {
    const response = await apiClient.post<{ data: JobRequisition }>(
      `/recruitment/requisitions/${id}/submit`,
    )
    return response.data.data
  },

  approve: async (
    id: string,
    data: { approved: boolean; comment?: string },
  ): Promise<JobRequisition> => {
    const response = await apiClient.post<{ data: JobRequisition }>(
      `/recruitment/requisitions/${id}/approve`,
      data,
    )
    return response.data.data
  },

  close: async (id: string): Promise<JobRequisition> => {
    const response = await apiClient.post<{ data: JobRequisition }>(
      `/recruitment/requisitions/${id}/close`,
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruitment/requisitions/${id}`)
  },

  getStats: async (): Promise<RequisitionStats> => {
    const response = await apiClient.get<{ data: RequisitionStats }>(
      "/recruitment/requisitions/stats",
    )
    return response.data.data
  },
}

// ── JD, posting & applicant intake ──────────────────────────────────────────

export interface CreateJobDescriptionDto {
  requisitionId: string
  title: string
  summary?: string
  responsibilities?: string
  requirements?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
}

export interface CreateJobPostingDto {
  requisitionId: string
  channel?: string
  oauthAccountId?: string | null
  fields?: RecruitmentFormField[]
}

export type PublishJobPostingDto = { id: string; mode: "connector" }

export const jobPostingApi = {
  overview: async (
    id: string,
  ): Promise<{
    posting: JobPosting
    applicationTotal: number
    stageGroups: Array<{ pipelineStageId: string | null; _count: { _all: number } }>
  }> => (await apiClient.get(`/recruitment/job-postings/${id}/overview`)).data.data,
  getOne: async (id: string): Promise<JobPosting> => {
    const response = await apiClient.get<{ data: JobPosting }>(`/recruitment/job-postings/${id}`)
    return response.data.data
  },
  list: async (requisitionId?: string): Promise<JobPosting[]> => {
    const response = await apiClient.get<{ data: JobPosting[] | PaginatedPayload<JobPosting> }>(
      "/recruitment/job-postings",
      { params: { requisitionId } },
    )
    const payload = response.data.data
    return Array.isArray(payload) ? payload : payload.items
  },
  create: async (data: CreateJobPostingDto): Promise<JobPosting> => {
    const response = await apiClient.post<{ data: JobPosting }>("/recruitment/job-postings", data)
    return response.data.data
  },
  update: async (
    id: string,
    data: { status?: JobPosting["status"]; postingUrl?: string },
  ): Promise<JobPosting> => {
    const response = await apiClient.patch<{ data: JobPosting }>(
      `/recruitment/job-postings/${id}`,
      data,
    )
    return response.data.data
  },
  publish: async ({ id, ...data }: PublishJobPostingDto): Promise<JobPosting> => {
    const response = await apiClient.post<{ data: JobPosting }>(
      `/recruitment/job-postings/${id}/publish`,
      data,
    )
    return response.data.data
  },
  sync: async (
    id: string,
  ): Promise<ApplicantImportResult & { postingId: string; syncedAt: string }> => {
    const response = await apiClient.post<{
      data: ApplicantImportResult & { postingId: string; syncedAt: string }
    }>(`/recruitment/job-postings/${id}/sync`)
    return response.data.data
  },
  archive: async (id: string): Promise<JobPosting> => {
    const response = await apiClient.delete<{ data: JobPosting }>(`/recruitment/job-postings/${id}`)
    return response.data.data
  },
  activities: async (id: string): Promise<RecruitmentPostingActivity[]> => {
    const response = await apiClient.get<{ data: PaginatedPayload<RecruitmentPostingActivity> }>(
      `/recruitment/job-postings/${id}/activities`,
    )
    return response.data.data.items
  },
  responses: async (
    id: string,
  ): Promise<
    Array<{
      id: string
      applicationId: string | null
      errorMessage: string | null
      responseData: Record<string, string> | null
    }>
  > => {
    const response = await apiClient.get<{
      data: Array<{
        id: string
        applicationId: string | null
        errorMessage: string | null
        responseData: Record<string, string> | null
      }>
    }>(`/recruitment/job-postings/${id}/responses`)
    return response.data.data
  },
  stages: async (
    id: string,
  ): Promise<import("@/types/recruitment.types").RecruitmentPipelineStage[]> =>
    (await apiClient.get(`/recruitment/job-postings/${id}/stages`)).data.data,
  createStage: async (
    id: string,
    data: { name: string; color?: string; isDefault?: boolean; isCompleted?: boolean },
  ) => (await apiClient.post(`/recruitment/job-postings/${id}/stages`, data)).data.data,
  updateStage: async (postingId: string, stageId: string, data: Record<string, unknown>) =>
    (await apiClient.patch(`/recruitment/job-postings/${postingId}/stages/${stageId}`, data)).data
      .data,
  deleteStage: async (postingId: string, stageId: string, fallbackStageId: string) =>
    apiClient.delete(`/recruitment/job-postings/${postingId}/stages/${stageId}`, {
      params: { fallbackStageId },
    }),
  reorderStages: async (
    postingId: string,
    stageIds: string[],
  ): Promise<import("@/types/recruitment.types").RecruitmentPipelineStage[]> =>
    (await apiClient.put(`/recruitment/job-postings/${postingId}/stages/reorder`, { stageIds }))
      .data.data,
  moveApplicationStage: async (postingId: string, applicationId: string, pipelineStageId: string) =>
    (
      await apiClient.post(`/recruitment/job-postings/${postingId}/stages/move`, {
        applicationId,
        pipelineStageId,
      })
    ).data.data,
  createCandidate: async (postingId: string, data: Omit<CreateCandidateDto, "source">) =>
    (await apiClient.post(`/recruitment/job-postings/${postingId}/candidates`, data)).data.data,
}

export const applicantIntakeApi = {
  import: async (data: {
    requisitionId: string
    postingId: string
    source: string
    rows: ApplicantImportRow[]
  }): Promise<ApplicantImportResult> => {
    const response = await apiClient.post<{ data: ApplicantImportResult }>(
      "/recruitment/intake/import",
      data,
    )
    return response.data.data
  },
}

// ── OAuth Account API ─────────────────────────────────────────────────────────

export interface OAuthAccount {
  id: string
  userId: string
  channel: string
  name: string
  clientId: string
  hasRefreshToken: boolean
  createdAt: string
  updatedAt: string
}

export const oauthAccountApi = {
  list: async (): Promise<OAuthAccount[]> => {
    const response = await apiClient.get<{ data: OAuthAccount[] }>("/recruitment/oauth-accounts")
    return response.data.data
  },
  upsert: async (data: {
    channel: string
    name: string
    clientId: string
    clientSecret: string
    refreshToken: string
  }): Promise<OAuthAccount> => {
    const response = await apiClient.post<{ data: OAuthAccount }>(
      "/recruitment/oauth-accounts",
      data,
    )
    return response.data.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruitment/oauth-accounts/${id}`)
  },
}

// ── Candidate API ─────────────────────────────────────────────────────────────

export interface CreateCandidateDto {
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  cvUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  source: string
  skills?: string[]
  yearsOfExperience?: number
  currentCompany?: string
  currentPosition?: string
  expectedSalary?: number
  expectedSalaryCurrency?: string
  noticePeriod?: string
  notes?: string
}

export type UpdateCandidateDto = Partial<CreateCandidateDto>

export const candidateApi = {
  list: async (query?: {
    status?: string
    source?: string
    keyword?: string
    page?: number
    pageSize?: number
  }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<Candidate> }>(
      "/recruitment/candidates",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  getOne: async (id: string): Promise<Candidate> => {
    const response = await apiClient.get<{ data: Candidate }>(`/recruitment/candidates/${id}`)
    return response.data.data
  },

  create: async (data: CreateCandidateDto): Promise<Candidate> => {
    const response = await apiClient.post<{ data: Candidate }>("/recruitment/candidates", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateCandidateDto): Promise<Candidate> => {
    const response = await apiClient.patch<{ data: Candidate }>(
      `/recruitment/candidates/${id}`,
      data,
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruitment/candidates/${id}`)
  },
}

// ── Application API ───────────────────────────────────────────────────────────

export interface CreateApplicationDto {
  requisitionId: string
  postingId: string
  candidateId: string
  source: string
}

export interface UpdateApplicationStatusDto {
  status: string
  rejectReason?: string
  withdrawReason?: string
}

export interface MoveKanbanDto {
  applicationId: string
  pipelineStageId: string
}

export const applicationApi = {
  list: async (query?: {
    requisitionId?: string
    postingId?: string
    status?: string
    assignedToId?: string
    page?: number
    pageSize?: number
  }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<RecruitmentApplication> }>(
      "/recruitment/applications",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  getOne: async (id: string): Promise<RecruitmentApplication> => {
    const response = await apiClient.get<{ data: RecruitmentApplication }>(
      `/recruitment/applications/${id}`,
    )
    return response.data.data
  },

  create: async (data: CreateApplicationDto): Promise<RecruitmentApplication> => {
    const response = await apiClient.post<{ data: RecruitmentApplication }>(
      "/recruitment/applications",
      data,
    )
    return response.data.data
  },

  updateStatus: async (
    id: string,
    data: UpdateApplicationStatusDto,
  ): Promise<RecruitmentApplication> => {
    const response = await apiClient.patch<{ data: RecruitmentApplication }>(
      `/recruitment/applications/${id}/status`,
      data,
    )
    return response.data.data
  },

  listKanban: async (query?: {
    requisitionId?: string
    postingId?: string
    assignedToId?: string
    page?: number
    pageSize?: number
  }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<KanbanApplication> }>(
      "/recruitment/applications/kanban",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  moveKanban: async (data: MoveKanbanDto): Promise<RecruitmentApplication> => {
    const response = await apiClient.post<{ data: RecruitmentApplication }>(
      "/recruitment/applications/kanban/move",
      data,
    )
    return response.data.data
  },

  assignRecruiter: async (id: string, assignedToId: string): Promise<RecruitmentApplication> => {
    const response = await apiClient.patch<{ data: RecruitmentApplication }>(
      `/recruitment/applications/${id}/assign`,
      { assignedToId },
    )
    return response.data.data
  },

  addNote: async (id: string, note: string): Promise<ApplicationNote> => {
    const response = await apiClient.post<{ data: ApplicationNote }>(
      `/recruitment/applications/${id}/notes`,
      { note },
    )
    return response.data.data
  },

  getNotes: async (id: string): Promise<ApplicationNote[]> => {
    const response = await apiClient.get<{ data: ApplicationNote[] }>(
      `/recruitment/applications/${id}/notes`,
    )
    return response.data.data
  },

  getStats: async (): Promise<ApplicationStats> => {
    const response = await apiClient.get<{ data: ApplicationStats }>(
      "/recruitment/applications/stats",
    )
    return response.data.data
  },
}

// ── Interview API ─────────────────────────────────────────────────────────────

export interface CreateInterviewDto {
  applicationId: string
  roundNumber: number
  title: string
  format: string
  scheduledAt?: string
  durationMinutes?: number
  location?: string
  meetingLink?: string
  interviewerIds: string[]
}

export interface UpdateInterviewDto extends Partial<
  Omit<CreateInterviewDto, "applicationId" | "interviewerIds">
> {
  interviewerIds?: string[]
}

export const interviewApi = {
  listByApplication: async (applicationId: string): Promise<InterviewRound[]> => {
    const response = await apiClient.get<{ data: InterviewRound[] }>(
      `/recruitment/applications/${applicationId}/interviews`,
    )
    return response.data.data
  },

  getOne: async (id: string): Promise<InterviewRound> => {
    const response = await apiClient.get<{ data: InterviewRound }>(`/recruitment/interviews/${id}`)
    return response.data.data
  },

  create: async (data: CreateInterviewDto): Promise<InterviewRound> => {
    const response = await apiClient.post<{ data: InterviewRound }>("/recruitment/interviews", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateInterviewDto): Promise<InterviewRound> => {
    const response = await apiClient.patch<{ data: InterviewRound }>(
      `/recruitment/interviews/${id}`,
      data,
    )
    return response.data.data
  },

  complete: async (
    id: string,
    data: { result?: string; feedback?: string },
  ): Promise<InterviewRound> => {
    const response = await apiClient.post<{ data: InterviewRound }>(
      `/recruitment/interviews/${id}/complete`,
      data,
    )
    return response.data.data
  },

  cancel: async (id: string): Promise<InterviewRound> => {
    const response = await apiClient.post<{ data: InterviewRound }>(
      `/recruitment/interviews/${id}/cancel`,
    )
    return response.data.data
  },

  markNoShow: async (id: string): Promise<InterviewRound> => {
    const response = await apiClient.post<{ data: InterviewRound }>(
      `/recruitment/interviews/${id}/no-show`,
    )
    return response.data.data
  },

  getUpcoming: async (days = 7): Promise<InterviewRound[]> => {
    const response = await apiClient.get<{ data: InterviewRound[] }>(
      "/recruitment/interviews/upcoming",
      { params: { days } },
    )
    return response.data.data
  },
}

// ── Scorecard API ─────────────────────────────────────────────────────────────

export interface CreateScorecardDto {
  interviewId: string
  overallRating: number
  strengths?: string
  weaknesses?: string
  recommendation?: string
  scores?: Record<string, number>
  answers?: Record<string, string>
}

export const scorecardApi = {
  listByInterview: async (interviewId: string): Promise<Scorecard[]> => {
    const response = await apiClient.get<{ data: Scorecard[] }>(
      `/recruitment/interviews/${interviewId}/scorecards`,
    )
    return response.data.data
  },

  getOne: async (id: string): Promise<Scorecard> => {
    const response = await apiClient.get<{ data: Scorecard }>(`/recruitment/scorecards/${id}`)
    return response.data.data
  },

  create: async (data: CreateScorecardDto): Promise<Scorecard> => {
    const response = await apiClient.post<{ data: Scorecard }>("/recruitment/scorecards", data)
    return response.data.data
  },

  update: async (id: string, data: Partial<CreateScorecardDto>): Promise<Scorecard> => {
    const response = await apiClient.patch<{ data: Scorecard }>(
      `/recruitment/scorecards/${id}`,
      data,
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruitment/scorecards/${id}`)
  },
}

// ── Offer API ─────────────────────────────────────────────────────────────────

export interface CreateOfferDto {
  applicationId: string
  offeredSalary: number
  currency?: string
  startDate: string
  endDate?: string
  trialEndDate?: string
  jobTitle: string
  department: string
  employmentType: string
  benefits?: Record<string, unknown>
  notes?: string
}

export type UpdateOfferDto = Partial<CreateOfferDto>

export interface RespondToOfferDto {
  offerId: string
  response: "accept" | "decline" | "negotiate"
  responseNote?: string
  negotiateSalary?: number
  negotiateStartDate?: string
}

export const offerApi = {
  list: async (query?: { page?: number; pageSize?: number }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<RecruitmentOffer> }>(
      "/recruitment/offers",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  getOne: async (id: string): Promise<RecruitmentOffer> => {
    const response = await apiClient.get<{ data: RecruitmentOffer }>(`/recruitment/offers/${id}`)
    return response.data.data
  },

  create: async (data: CreateOfferDto): Promise<RecruitmentOffer> => {
    const response = await apiClient.post<{ data: RecruitmentOffer }>("/recruitment/offers", data)
    return response.data.data
  },

  update: async (id: string, data: UpdateOfferDto): Promise<RecruitmentOffer> => {
    const response = await apiClient.patch<{ data: RecruitmentOffer }>(
      `/recruitment/offers/${id}`,
      data,
    )
    return response.data.data
  },

  send: async (id: string): Promise<RecruitmentOffer> => {
    const response = await apiClient.post<{ data: RecruitmentOffer }>(
      `/recruitment/offers/${id}/send`,
    )
    return response.data.data
  },

  respond: async (data: RespondToOfferDto): Promise<RecruitmentOffer> => {
    const response = await apiClient.post<{ data: RecruitmentOffer }>(
      "/recruitment/offers/respond",
      data,
    )
    return response.data.data
  },

  rescind: async (id: string, reason?: string): Promise<RecruitmentOffer> => {
    const response = await apiClient.post<{ data: RecruitmentOffer }>(
      `/recruitment/offers/${id}/rescind`,
      { reason },
    )
    return response.data.data
  },

  expire: async (id: string): Promise<RecruitmentOffer> => {
    const response = await apiClient.post<{ data: RecruitmentOffer }>(
      `/recruitment/offers/${id}/expire`,
    )
    return response.data.data
  },

  getVersions: async (id: string): Promise<OfferVersion[]> => {
    const response = await apiClient.get<{ data: OfferVersion[] }>(
      `/recruitment/offers/${id}/versions`,
    )
    return response.data.data
  },

  getStats: async (): Promise<OfferStats> => {
    const response = await apiClient.get<{ data: OfferStats }>("/recruitment/offers/stats")
    return response.data.data
  },
}

// ── Background Check API ───────────────────────────────────────────────────────

export interface CreateBackgroundCheckDto {
  offerId: string
  candidateId: string
  group: string
}

export interface UpdateBackgroundCheckDto {
  status?: string
  idVerified?: boolean
  addressVerified?: boolean
  criminalRecordCheck?: boolean
  legalStatusCheck?: boolean
  certificationVerified?: boolean
  employmentHistoryVerified?: boolean
  financialCheckCompleted?: boolean
  creditScoreCheck?: boolean
  failReason?: string
  documents?: Record<string, unknown>
}

export const backgroundCheckApi = {
  list: async (query?: { status?: string; page?: number; pageSize?: number }) => {
    const response = await apiClient.get<{ data: PaginatedPayload<BackgroundCheck> }>(
      "/recruitment/background-checks",
      { params: query },
    )
    return toPaginatedResult(response.data.data)
  },

  getOne: async (id: string): Promise<BackgroundCheck> => {
    const response = await apiClient.get<{ data: BackgroundCheck }>(
      `/recruitment/background-checks/${id}`,
    )
    return response.data.data
  },

  getByOffer: async (offerId: string): Promise<BackgroundCheck> => {
    const response = await apiClient.get<{ data: BackgroundCheck }>(
      `/recruitment/offers/${offerId}/background-check`,
    )
    return response.data.data
  },

  create: async (data: CreateBackgroundCheckDto): Promise<BackgroundCheck> => {
    const response = await apiClient.post<{ data: BackgroundCheck }>(
      "/recruitment/background-checks",
      data,
    )
    return response.data.data
  },

  update: async (id: string, data: UpdateBackgroundCheckDto): Promise<BackgroundCheck> => {
    const response = await apiClient.patch<{ data: BackgroundCheck }>(
      `/recruitment/background-checks/${id}`,
      data,
    )
    return response.data.data
  },

  start: async (id: string): Promise<BackgroundCheck> => {
    const response = await apiClient.post<{ data: BackgroundCheck }>(
      `/recruitment/background-checks/${id}/start`,
    )
    return response.data.data
  },

  complete: async (
    id: string,
    data: { passed: boolean; failReason?: string },
  ): Promise<BackgroundCheck> => {
    const response = await apiClient.post<{ data: BackgroundCheck }>(
      `/recruitment/background-checks/${id}/complete`,
      data,
    )
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruitment/background-checks/${id}`)
  },

  getStats: async (): Promise<BackgroundCheckStats> => {
    const response = await apiClient.get<{ data: BackgroundCheckStats }>(
      "/recruitment/background-checks/stats",
    )
    return response.data.data
  },
}
