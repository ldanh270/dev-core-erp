import {
  applicantIntakeApi,
  applicationApi,
  backgroundCheckApi,
  candidateApi,
  interviewApi,
  jobPostingApi,
  oauthAccountApi,
  offerApi,
  requisitionApi,
  scorecardApi,
} from "@/lib/api/recruitment.api"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface RecruitmentApiError {
  response?: {
    data?: {
      error?: {
        message?: string
        meta?: Array<{ field?: string; message?: string }>
      }
    }
  }
}

function getRecruitmentErrorMessage(error: RecruitmentApiError, fallback: string): string {
  const apiError = error.response?.data?.error
  const issue = apiError?.meta?.[0]
  if (issue?.message) return issue.field ? `${issue.field}: ${issue.message}` : issue.message
  return apiError?.message ?? fallback
}

// ── Requisition Hooks ─────────────────────────────────────────────────────────

export function useJobPostings(requisitionId?: string) {
  return useQuery({
    queryKey: ["recruitment", "job-postings", requisitionId],
    queryFn: () => jobPostingApi.list(requisitionId),
  })
}

export function useJobPosting(id?: string) {
  return useQuery({
    queryKey: ["recruitment", "job-postings", id],
    queryFn: () => (id ? jobPostingApi.getOne(id) : Promise.reject(new Error("No ID"))),
    enabled: Boolean(id),
  })
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobPostingApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] })
      toast.success("Đã lưu cấu hình Google Form")
    },
    onError: (error: RecruitmentApiError) => {
      toast.error(getRecruitmentErrorMessage(error, "Không thể lưu cấu hình Google Form"))
    },
  })
}

export function usePublishJobPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobPostingApi.publish,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] })
      toast.success(
        variables.mode === "connector" ? "Đã tạo và public Google Form" : "Đã ghi nhận bài đăng",
      )
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(
        error.response?.data?.error?.message ??
          "Kênh chưa được cấu hình hoặc chưa có đường dẫn bài đăng",
      )
    },
  })
}

export function useArchiveJobPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobPostingApi.archive,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] })
      toast.success("Đã lưu trữ bài đăng, ứng viên và lịch sử vẫn được giữ lại")
    },
    onError: (error: RecruitmentApiError) =>
      toast.error(getRecruitmentErrorMessage(error, "Không thể lưu trữ bài đăng")),
  })
}

export function useImportApplicants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicantIntakeApi.import,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      toast.success(`Đã tạo ${result.applicationsCreated}/${result.total} lượt ứng tuyển`)
    },
  })
}

export function useSyncJobPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: jobPostingApi.sync,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "job-postings"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      toast.success(
        `Đã đồng bộ ${result.applicationsCreated}/${result.total} lượt ứng tuyển từ Google Form`,
      )
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Không thể đồng bộ kênh tuyển dụng")
    },
  })
}

export function useRequisitions(query?: {
  status?: string
  department?: string
  priority?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["recruitment", "requisitions", query],
    queryFn: () => requisitionApi.list(query),
  })
}

export function useRequisitionApprovers() {
  return useQuery({
    queryKey: ["recruitment", "requisition-approvers"],
    queryFn: requisitionApi.getApprovers,
  })
}

export function useRequisition(id: string) {
  return useQuery({
    queryKey: ["recruitment", "requisitions", id],
    queryFn: () => requisitionApi.getOne(id),
    enabled: !!id,
  })
}

export function useRequisitionStats() {
  return useQuery({
    queryKey: ["recruitment", "requisitions", "stats"],
    queryFn: () => requisitionApi.getStats(),
  })
}

export function useCreateRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requisitionApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions"] })
      toast.success("Đã tạo yêu cầu tuyển dụng")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo yêu cầu tuyển dụng")
    },
  })
}

export function useUpdateRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof requisitionApi.update>[1] }) =>
      requisitionApi.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions", id] })
      toast.success("Đã cập nhật yêu cầu tuyển dụng")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi cập nhật")
    },
  })
}

export function useSubmitRequisitionForApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requisitionApi.submitForApproval,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions"] })
      toast.success("Đã gửi yêu cầu phê duyệt")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi gửi phê duyệt")
    },
  })
}

export function useApproveRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { approved: boolean; comment?: string } }) =>
      requisitionApi.approve(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions"] })
      toast.success("Đã phê duyệt yêu cầu tuyển dụng")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi phê duyệt")
    },
  })
}

export function useCloseRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requisitionApi.close,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "requisitions"] })
      toast.success("Đã đóng yêu cầu tuyển dụng")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi đóng yêu cầu")
    },
  })
}

// ── Candidate Hooks ────────────────────────────────────────────────────────────

export function useCandidates(query?: {
  status?: string
  source?: string
  keyword?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["recruitment", "candidates", query],
    queryFn: () => candidateApi.list(query),
  })
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["recruitment", "candidates", id],
    queryFn: () => candidateApi.getOne(id),
    enabled: !!id,
  })
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: candidateApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] })
      toast.success("Đã thêm ứng viên")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi thêm ứng viên")
    },
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof candidateApi.update>[1] }) =>
      candidateApi.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "candidates", id] })
      toast.success("Đã cập nhật ứng viên")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi cập nhật")
    },
  })
}

// ── Application Hooks ─────────────────────────────────────────────────────────

export function useApplications(query?: {
  requisitionId?: string
  postingId?: string
  status?: string
  assignedToId?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["recruitment", "applications", query],
    queryFn: () => applicationApi.list(query),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["recruitment", "applications", id],
    queryFn: () => applicationApi.getOne(id),
    enabled: !!id,
  })
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ["recruitment", "applications", "stats"],
    queryFn: () => applicationApi.getStats(),
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicationApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      toast.success("Đã tạo đơn ứng tuyển")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo đơn")
    },
  })
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof applicationApi.updateStatus>[1]
    }) => applicationApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications", id] })
      toast.success("Đã cập nhật trạng thái")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi cập nhật trạng thái")
    },
  })
}

// ── Kanban Hooks ──────────────────────────────────────────────────────────────

export function useKanban(query?: {
  requisitionId?: string
  postingId?: string
  assignedToId?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["recruitment", "kanban", query],
    queryFn: () => applicationApi.listKanban(query),
  })
}

export function useMoveKanban() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applicationApi.moveKanban,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "kanban"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "applications"] })
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi di chuyển")
    },
  })
}

// ── Interview Hooks ────────────────────────────────────────────────────────────

export function useInterviews(applicationId: string) {
  return useQuery({
    queryKey: ["recruitment", "interviews", applicationId],
    queryFn: () => interviewApi.listByApplication(applicationId),
    enabled: !!applicationId,
  })
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ["recruitment", "interviews", "detail", id],
    queryFn: () => interviewApi.getOne(id),
    enabled: !!id,
  })
}

export function useUpcomingInterviews(days = 7) {
  return useQuery({
    queryKey: ["recruitment", "interviews", "upcoming", days],
    queryFn: () => interviewApi.getUpcoming(days),
  })
}

export function useCreateInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: interviewApi.create,
    onSuccess: (_, data) => {
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "interviews", data.applicationId],
      })
      toast.success("Đã tạo lịch phỏng vấn")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo lịch phỏng vấn")
    },
  })
}

export function useUpdateInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof interviewApi.update>[1] }) =>
      interviewApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] })
      toast.success("Đã cập nhật lịch phỏng vấn")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi cập nhật")
    },
  })
}

export function useCompleteInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { result?: string; feedback?: string } }) =>
      interviewApi.complete(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "interviews"] })
      toast.success("Đã hoàn thành phỏng vấn")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi hoàn thành phỏng vấn")
    },
  })
}

// ── Scorecard Hooks ────────────────────────────────────────────────────────────

export function useScorecards(interviewId: string) {
  return useQuery({
    queryKey: ["recruitment", "scorecards", interviewId],
    queryFn: () => scorecardApi.listByInterview(interviewId),
    enabled: !!interviewId,
  })
}

export function useCreateScorecard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: scorecardApi.create,
    onSuccess: (_, data) => {
      void queryClient.invalidateQueries({
        queryKey: ["recruitment", "scorecards", data.interviewId],
      })
      toast.success("Đã tạo đánh giá")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo đánh giá")
    },
  })
}

export function useUpdateScorecard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof scorecardApi.update>[1] }) =>
      scorecardApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "scorecards"] })
      toast.success("Đã cập nhật đánh giá")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi cập nhật đánh giá")
    },
  })
}

// ── Offer Hooks ────────────────────────────────────────────────────────────────

export function useOffers(query?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["recruitment", "offers", query],
    queryFn: () => offerApi.list(query),
  })
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["recruitment", "offers", id],
    queryFn: () => offerApi.getOne(id),
    enabled: !!id,
  })
}

export function useOfferStats() {
  return useQuery({
    queryKey: ["recruitment", "offers", "stats"],
    queryFn: () => offerApi.getStats(),
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: offerApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "offers"] })
      toast.success("Đã tạo offer")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo offer")
    },
  })
}

export function useSendOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: offerApi.send,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "offers"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "offers", id] })
      toast.success("Đã gửi offer")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi gửi offer")
    },
  })
}

export function useRespondToOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: offerApi.respond,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "offers"] })
      toast.success("Đã phản hồi offer")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi phản hồi offer")
    },
  })
}

// ── Background Check Hooks ─────────────────────────────────────────────────────

export function useBackgroundChecks(query?: { status?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["recruitment", "background-checks", query],
    queryFn: () => backgroundCheckApi.list(query),
  })
}

export function useBackgroundCheck(id: string) {
  return useQuery({
    queryKey: ["recruitment", "background-checks", id],
    queryFn: () => backgroundCheckApi.getOne(id),
    enabled: !!id,
  })
}

export function useBackgroundCheckByOffer(offerId: string) {
  return useQuery({
    queryKey: ["recruitment", "background-checks", "offer", offerId],
    queryFn: () => backgroundCheckApi.getByOffer(offerId),
    enabled: !!offerId,
  })
}

export function useBackgroundCheckStats() {
  return useQuery({
    queryKey: ["recruitment", "background-checks", "stats"],
    queryFn: () => backgroundCheckApi.getStats(),
  })
}

export function useCreateBackgroundCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backgroundCheckApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "background-checks"] })
      toast.success("Đã tạo kiểm tra background")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi tạo kiểm tra")
    },
  })
}

export function useStartBackgroundCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: backgroundCheckApi.start,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "background-checks"] })
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "background-checks", id] })
      toast.success("Đã bắt đầu kiểm tra background")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi bắt đầu kiểm tra")
    },
  })
}

export function useCompleteBackgroundCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { passed: boolean; failReason?: string } }) =>
      backgroundCheckApi.complete(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "background-checks"] })
      toast.success("Đã hoàn thành kiểm tra background")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi hoàn thành kiểm tra")
    },
  })
}

// ── OAuth Account Hooks ──────────────────────────────────────────────────────

export function useOAuthAccounts() {
  return useQuery({
    queryKey: ["recruitment", "oauth-accounts"],
    queryFn: oauthAccountApi.list,
  })
}

export function useUpsertOAuthAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: oauthAccountApi.upsert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "oauth-accounts"] })
      toast.success("Đã lưu cấu hình OAuth")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi lưu cấu hình OAuth")
    },
  })
}

export function useDeleteOAuthAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: oauthAccountApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment", "oauth-accounts"] })
      toast.success("Đã xóa cấu hình OAuth")
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(error.response?.data?.error?.message ?? "Lỗi khi xóa cấu hình OAuth")
    },
  })
}
