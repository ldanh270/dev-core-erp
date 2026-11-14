// ═══════════════════════════════════════════════════════════════════════════════
// RECRUITMENT CONFIG — Source of truth for all enum values (frontend)
// Values MUST match Prisma schema enums exactly
// ═══════════════════════════════════════════════════════════════════════════════

// ── Requisition ──────────────────────────────────────────────────────────────

export const REQUISITION_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLOSED: "closed",
  FILLED: "filled",
} as const

export const REQUISITION_STATUSES = [
  REQUISITION_STATUS.DRAFT,
  REQUISITION_STATUS.PENDING_APPROVAL,
  REQUISITION_STATUS.APPROVED,
  REQUISITION_STATUS.REJECTED,
  REQUISITION_STATUS.CLOSED,
  REQUISITION_STATUS.FILLED,
] as const

export const REQUISITION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const REQUISITION_PRIORITIES = [
  REQUISITION_PRIORITY.LOW,
  REQUISITION_PRIORITY.MEDIUM,
  REQUISITION_PRIORITY.HIGH,
  REQUISITION_PRIORITY.URGENT,
] as const

// ── Posting ───────────────────────────────────────────────────────────────────

export const POSTING_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed",
  ARCHIVED: "archived",
} as const

export const POSTING_STATUSES = [
  POSTING_STATUS.DRAFT,
  POSTING_STATUS.OPEN,
  POSTING_STATUS.PAUSED,
  POSTING_STATUS.CLOSED,
  POSTING_STATUS.ARCHIVED,
] as const

export const POSTING_CHANNELS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "google_form", label: "Google Form" },
  { value: "company_website", label: "Website công ty" },
  { value: "agency", label: "Headhunter / Agency" },
  { value: "referral", label: "Referral nội bộ" },
  { value: "other", label: "Kênh khác" },
] as const

export const RECRUITMENT_FORM_FIELD_TYPES = [
  { value: "short_text", label: "Câu trả lời ngắn" },
  { value: "paragraph", label: "Đoạn văn" },
] as const

// ── Recruitment Application ────────────────────────────────────────────────────

export const RECRUITMENT_APPLICATION_STATUS = {
  NEW: "new",
  REVIEWING: "reviewing",
  SHORTLISTED: "shortlisted",
  INTERVIEWING: "interviewing",
  FINAL_REVIEW: "final_review",
  OFFER_SENT: "offer_sent",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_DECLINED: "offer_declined",
  OFFER_RESCINDED: "offer_rescinded",
  BACKGROUND_CHECK: "background_check",
  PENDING_ONBOARDING: "pending_onboarding",
  HIRED: "hired",
  REJECTED: "rejected",
  CANDIDATE_WITHDREW: "candidate_withdrew",
} as const

export const RECRUITMENT_APPLICATION_STATUSES = [
  RECRUITMENT_APPLICATION_STATUS.NEW,
  RECRUITMENT_APPLICATION_STATUS.REVIEWING,
  RECRUITMENT_APPLICATION_STATUS.SHORTLISTED,
  RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
  RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW,
  RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
  RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK,
  RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING,
  RECRUITMENT_APPLICATION_STATUS.HIRED,
  RECRUITMENT_APPLICATION_STATUS.REJECTED,
  RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW,
] as const

// Kanban columns (non-terminal statuses)
export const KANBAN_STATUSES = [
  RECRUITMENT_APPLICATION_STATUS.NEW,
  RECRUITMENT_APPLICATION_STATUS.REVIEWING,
  RECRUITMENT_APPLICATION_STATUS.SHORTLISTED,
  RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
  RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW,
  RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
  RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
] as const

// Terminal statuses (no further transitions)
export const TERMINAL_APPLICATION_STATUSES = [
  RECRUITMENT_APPLICATION_STATUS.HIRED,
  RECRUITMENT_APPLICATION_STATUS.REJECTED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
  RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW,
] as const

// ── Recruitment Source ─────────────────────────────────────────────────────────

export const RECRUITMENT_SOURCE = {
  WEBSITE: "website",
  LINKEDIN: "linkedin",
  REFERRAL: "referral",
  FACEBOOK: "facebook",
  RECRUITMENT_AGENCY: "recruitment_agency",
  GOOGLE_FORM: "google_form",
  COMPANY_WEBSITE: "company_website",
  AGENCY: "agency",
  OTHER: "other",
} as const

export const RECRUITMENT_SOURCES = [
  RECRUITMENT_SOURCE.WEBSITE,
  RECRUITMENT_SOURCE.LINKEDIN,
  RECRUITMENT_SOURCE.REFERRAL,
  RECRUITMENT_SOURCE.FACEBOOK,
  RECRUITMENT_SOURCE.RECRUITMENT_AGENCY,
  RECRUITMENT_SOURCE.GOOGLE_FORM,
  RECRUITMENT_SOURCE.COMPANY_WEBSITE,
  RECRUITMENT_SOURCE.AGENCY,
  RECRUITMENT_SOURCE.OTHER,
] as const

// ── Interview ──────────────────────────────────────────────────────────────────

export const INTERVIEW_FORMAT = {
  IN_PERSON: "in_person",
  VIDEO_CALL: "video_call",
  PHONE: "phone",
} as const

export const INTERVIEW_FORMATS = [
  INTERVIEW_FORMAT.IN_PERSON,
  INTERVIEW_FORMAT.VIDEO_CALL,
  INTERVIEW_FORMAT.PHONE,
] as const

export const INTERVIEW_ROUND_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const

export const INTERVIEW_ROUND_STATUSES = [
  INTERVIEW_ROUND_STATUS.SCHEDULED,
  INTERVIEW_ROUND_STATUS.COMPLETED,
  INTERVIEW_ROUND_STATUS.CANCELLED,
  INTERVIEW_ROUND_STATUS.NO_SHOW,
] as const

export const INTERVIEW_RESULT = {
  PASS: "pass",
  FAIL: "fail",
  PENDING: "pending",
  NO_SHOW: "no_show",
} as const

export const INTERVIEW_RESULTS = [
  INTERVIEW_RESULT.PASS,
  INTERVIEW_RESULT.FAIL,
  INTERVIEW_RESULT.PENDING,
  INTERVIEW_RESULT.NO_SHOW,
] as const

// ── Background Check ──────────────────────────────────────────────────────────

export const BGC_GROUP = {
  A: "a",
  B: "b",
  C: "c",
  D: "d",
} as const

export const BGC_GROUPS = [BGC_GROUP.A, BGC_GROUP.B, BGC_GROUP.C, BGC_GROUP.D] as const

export const BGC_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PASSED: "passed",
  FAILED: "failed",
} as const

export const BGC_STATUSES = [
  BGC_STATUS.PENDING,
  BGC_STATUS.IN_PROGRESS,
  BGC_STATUS.COMPLETED,
  BGC_STATUS.PASSED,
  BGC_STATUS.FAILED,
] as const

// ── Offer ─────────────────────────────────────────────────────────────────────

export const RECRUITMENT_OFFER_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  RESCINDED: "rescinded",
  EXPIRED: "expired",
} as const

export const RECRUITMENT_OFFER_STATUSES = [
  RECRUITMENT_OFFER_STATUS.DRAFT,
  RECRUITMENT_OFFER_STATUS.SENT,
  RECRUITMENT_OFFER_STATUS.ACCEPTED,
  RECRUITMENT_OFFER_STATUS.DECLINED,
  RECRUITMENT_OFFER_STATUS.RESCINDED,
  RECRUITMENT_OFFER_STATUS.EXPIRED,
] as const

// ── Offer Response ──────────────────────────────────────────────────────────────

export const OFFER_RESPONSE = {
  ACCEPT: "accept",
  DECLINE: "decline",
  NEGOTIATE: "negotiate",
} as const

export const OFFER_RESPONSES = [
  OFFER_RESPONSE.ACCEPT,
  OFFER_RESPONSE.DECLINE,
  OFFER_RESPONSE.NEGOTIATE,
] as const

export const CURRENCY = {
  VND: "VND",
  USD: "USD",
  EUR: "EUR",
} as const

// ── Labels ─────────────────────────────────────────────────────────────────────

export const REQUISITION_STATUS_LABELS: Record<string, string> = {
  [REQUISITION_STATUS.DRAFT]: "Nháp",
  [REQUISITION_STATUS.PENDING_APPROVAL]: "Chờ phê duyệt",
  [REQUISITION_STATUS.APPROVED]: "Đã phê duyệt",
  [REQUISITION_STATUS.REJECTED]: "Từ chối",
  [REQUISITION_STATUS.CLOSED]: "Đã đóng",
  [REQUISITION_STATUS.FILLED]: "Đã tuyển đủ",
}

export const REQUISITION_PRIORITY_LABELS: Record<string, string> = {
  [REQUISITION_PRIORITY.LOW]: "Thấp",
  [REQUISITION_PRIORITY.MEDIUM]: "Trung bình",
  [REQUISITION_PRIORITY.HIGH]: "Cao",
  [REQUISITION_PRIORITY.URGENT]: "Khẩn cấp",
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  [RECRUITMENT_APPLICATION_STATUS.NEW]: "Mới",
  [RECRUITMENT_APPLICATION_STATUS.REVIEWING]: "Đang xem xét",
  [RECRUITMENT_APPLICATION_STATUS.SHORTLISTED]: "Danh sách ngắn",
  [RECRUITMENT_APPLICATION_STATUS.INTERVIEWING]: "Đang phỏng vấn",
  [RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW]: "Xem xét cuối cùng",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_SENT]: "Đã gửi offer",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED]: "Offer đã chấp nhận",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED]: "Offer bị từ chối",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED]: "Offer bị thu hồi",
  [RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK]: "Kiểm tra background",
  [RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING]: "Chờ onboarding",
  [RECRUITMENT_APPLICATION_STATUS.HIRED]: "Đã tuyển",
  [RECRUITMENT_APPLICATION_STATUS.REJECTED]: "Từ chối",
  [RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW]: "Ứng viên rút lui",
}

export const APPLICATION_STATUS_VARIANTS: Record<
  string,
  "default" | "primary" | "success" | "warning" | "danger" | "info"
> = {
  [RECRUITMENT_APPLICATION_STATUS.NEW]: "info",
  [RECRUITMENT_APPLICATION_STATUS.REVIEWING]: "primary",
  [RECRUITMENT_APPLICATION_STATUS.SHORTLISTED]: "primary",
  [RECRUITMENT_APPLICATION_STATUS.INTERVIEWING]: "warning",
  [RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW]: "warning",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_SENT]: "primary",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED]: "success",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED]: "danger",
  [RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED]: "danger",
  [RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK]: "warning",
  [RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING]: "success",
  [RECRUITMENT_APPLICATION_STATUS.HIRED]: "success",
  [RECRUITMENT_APPLICATION_STATUS.REJECTED]: "danger",
  [RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW]: "default",
}

export const RECRUITMENT_SOURCE_LABELS: Record<string, string> = {
  [RECRUITMENT_SOURCE.WEBSITE]: "Website",
  [RECRUITMENT_SOURCE.LINKEDIN]: "LinkedIn",
  [RECRUITMENT_SOURCE.REFERRAL]: "Giới thiệu",
  [RECRUITMENT_SOURCE.FACEBOOK]: "Facebook",
  [RECRUITMENT_SOURCE.RECRUITMENT_AGENCY]: "Đại lý tuyển dụng",
  [RECRUITMENT_SOURCE.GOOGLE_FORM]: "Google Form",
  [RECRUITMENT_SOURCE.COMPANY_WEBSITE]: "Website công ty",
  [RECRUITMENT_SOURCE.AGENCY]: "Headhunter / Agency",
  [RECRUITMENT_SOURCE.OTHER]: "Khác",
}

export const BGC_GROUP_LABELS: Record<string, string> = {
  [BGC_GROUP.A]: "Nhóm A - Nhân sự cấp cao",
  [BGC_GROUP.B]: "Nhóm B - Quản lý",
  [BGC_GROUP.C]: "Nhóm C - Nhân viên",
  [BGC_GROUP.D]: "Nhóm D - Thực tập sinh",
}

export const INTERVIEW_FORMAT_LABELS: Record<string, string> = {
  [INTERVIEW_FORMAT.IN_PERSON]: "Trực tiếp",
  [INTERVIEW_FORMAT.VIDEO_CALL]: "Video call",
  [INTERVIEW_FORMAT.PHONE]: "Điện thoại",
}

export const INTERVIEW_TYPE = {
  SCREENING: "screening",
  TECHNICAL: "technical",
  HR: "hr",
  CULTURAL_FIT: "cultural_fit",
  FINAL: "final",
  OTHER: "other",
} as const

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  [INTERVIEW_TYPE.SCREENING]: "Sàng lọc",
  [INTERVIEW_TYPE.TECHNICAL]: "Kỹ thuật",
  [INTERVIEW_TYPE.HR]: "HR",
  [INTERVIEW_TYPE.CULTURAL_FIT]: "Văn hóa",
  [INTERVIEW_TYPE.FINAL]: "Cuối cùng",
  [INTERVIEW_TYPE.OTHER]: "Khác",
}

export const INTERVIEW_RESULT_LABELS: Record<string, string> = {
  [INTERVIEW_RESULT.PASS]: "Đạt",
  [INTERVIEW_RESULT.FAIL]: "Không đạt",
  [INTERVIEW_RESULT.PENDING]: "Chờ kết quả",
  [INTERVIEW_RESULT.NO_SHOW]: "Vắng mặt",
}

export const BGC_STATUS_LABELS: Record<string, string> = {
  [BGC_STATUS.PENDING]: "Chờ xử lý",
  [BGC_STATUS.IN_PROGRESS]: "Đang kiểm tra",
  [BGC_STATUS.COMPLETED]: "Hoàn thành",
  [BGC_STATUS.PASSED]: "Đạt",
  [BGC_STATUS.FAILED]: "Không đạt",
}

export const OFFER_STATUS_LABELS: Record<string, string> = {
  [RECRUITMENT_OFFER_STATUS.DRAFT]: "Nháp",
  [RECRUITMENT_OFFER_STATUS.SENT]: "Đã gửi",
  [RECRUITMENT_OFFER_STATUS.ACCEPTED]: "Đã chấp nhận",
  [RECRUITMENT_OFFER_STATUS.DECLINED]: "Từ chối",
  [RECRUITMENT_OFFER_STATUS.RESCINDED]: "Bị thu hồi",
  [RECRUITMENT_OFFER_STATUS.EXPIRED]: "Hết hạn",
}

export const OFFER_RESPONSE_LABELS: Record<string, string> = {
  [OFFER_RESPONSE.ACCEPT]: "Chấp nhận",
  [OFFER_RESPONSE.DECLINE]: "Từ chối",
  [OFFER_RESPONSE.NEGOTIATE]: "Đàm phán",
}

export const APPLICANT_IMPORT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL = "5 MB"
export const APPLICANT_IMPORT_ALLOWED_FILE_PATTERN = /\.(csv|xlsx|xls)$/i

// ── Kanban Columns ─────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: string
  title: string
  color: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "new", title: "Mới", color: "blue" },
  { id: "reviewing", title: "Đang xem xét", color: "indigo" },
  { id: "shortlisted", title: "Danh sách ngắn", color: "purple" },
  { id: "interviewing", title: "Phỏng vấn", color: "amber" },
  { id: "final_review", title: "Xem xét cuối", color: "orange" },
  { id: "offer_sent", title: "Đã gửi Offer", color: "teal" },
  { id: "offer_accepted", title: "Chấp nhận Offer", color: "green" },
]
