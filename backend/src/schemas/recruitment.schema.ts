import {
  BGC_GROUPS,
  BGC_STATUSES,
  INTERVIEW_FORMATS,
  INTERVIEW_RESULTS,
  INTERVIEW_ROUND_STATUSES,
  POSTING_STATUSES,
  RECRUITMENT_APPLICATION_STATUSES,
  RECRUITMENT_CHANNELS,
  RECRUITMENT_OFFER_STATUSES,
  RECRUITMENT_SOURCES,
  REQUISITION_PRIORITIES,
  REQUISITION_STATUSES,
} from "@/configs/entities/recruitment.config"
import { GOOGLE_FORM_FIELD_TYPES } from "@/configs/rules/google-form.config"
import { EXTERNAL_URL_PROTOCOLS } from "@/configs/system/url.config"

import { z } from "zod"

const secureExternalUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value)
      return EXTERNAL_URL_PROTOCOLS.includes(
        url.protocol as (typeof EXTERNAL_URL_PROTOCOLS)[number],
      )
    } catch {
      return false
    }
  }, "Only HTTPS URLs are allowed")

// ── Requisition Schemas ────────────────────────────────────────────────────────

export const googleFormFieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,49}$/),
  label: z.string().trim().min(1).max(200),
  type: z.enum(GOOGLE_FORM_FIELD_TYPES),
  required: z.boolean(),
})

const candidateSchemaFields = z.array(googleFormFieldSchema).min(2).max(30)
const validateCandidateSchema = (
  fields: z.infer<typeof candidateSchemaFields> | undefined,
  context: z.RefinementCtx,
  path: string,
) => {
  if (!fields) return
  const keys = fields.map((field) => field.key)
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: "custom", path: [path], message: "Field keys must be unique" })
  }
  for (const requiredKey of ["full_name", "email"] as const) {
    if (fields.filter((field) => field.key === requiredKey && field.required).length !== 1) {
      context.addIssue({
        code: "custom",
        path: [path],
        message: `${requiredKey} must exist exactly once and be required`,
      })
    }
  }
}

const jobRequisitionFieldsSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  department: z.string().max(100).optional(),
  positionLevel: z.string().max(50).optional(),
  employmentType: z.enum(["full_time", "part_time", "contractor", "intern"]),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().length(3).default("VND"),
  headcount: z.number().int().positive().default(1),
  priority: z.enum(REQUISITION_PRIORITIES).default("medium"),
  reason: z.string().max(1000).optional(),
  targetHireDate: z.string().datetime().optional(),
  targetCloseDate: z.string().datetime().optional(),
  positionId: z.string().min(1).optional(),
  approverId: z.string().min(1, "Người duyệt không hợp lệ"),
  candidateSchema: candidateSchemaFields.optional(),
})

export const createJobRequisitionSchema = jobRequisitionFieldsSchema.superRefine(
  ({ candidateSchema }, context) => {
    validateCandidateSchema(candidateSchema, context, "candidateSchema")
  },
)

export const updateJobRequisitionSchema = jobRequisitionFieldsSchema
  .partial()
  .strict()
  .superRefine(({ candidateSchema }, context) => {
    validateCandidateSchema(candidateSchema, context, "candidateSchema")
  })

export const approveRequisitionSchema = z
  .object({
    approved: z.boolean(),
    comment: z.string().max(500).optional(),
  })
  .superRefine(({ approved, comment }, context) => {
    if (!approved && !comment?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "Rejection reason is required",
      })
    }
  })

// ── Job Description Schemas ────────────────────────────────────────────────────

export const createJobDescriptionSchema = z.object({
  requisitionId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(255),
  summary: z.string().max(2000).optional(),
  responsibilities: z.string().max(5000).optional(),
  requirements: z.string().max(5000).optional(),
  benefits: z.string().max(3000).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
})

export const updateJobDescriptionSchema = createJobDescriptionSchema
  .omit({ requisitionId: true })
  .partial()

export const listJobDescriptionsQuerySchema = z.object({
  requisitionId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const createJobPostingSchema = z
  .object({
    requisitionId: z.string().cuid(),
    channel: z.enum(RECRUITMENT_CHANNELS).default("google_form"),
    oauthAccountId: z.string().cuid().optional().nullable(),
    fields: candidateSchemaFields.optional(),
  })
  .superRefine(({ fields }, context) => {
    validateCandidateSchema(fields, context, "fields")
  })

export const updateJobPostingSchema = z.object({
  status: z.enum(POSTING_STATUSES).optional(),
  postingUrl: secureExternalUrlSchema.optional(),
})

export const listJobPostingsQuerySchema = z.object({
  requisitionId: z.string().cuid().optional(),
  channel: z.enum(RECRUITMENT_CHANNELS).optional(),
  status: z.enum(POSTING_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const publishJobPostingSchema = z.object({ mode: z.literal("connector") })

export const intakeRowSchema = z.object({
  fullName: z.string().min(1).max(255),
  email: z.string().trim(),
  phone: z.string().optional(),
  cvUrl: z.string().optional(),
  notes: z.string().optional(),
  sourceRef: z.string().optional(),
})

export const importRecruitmentIntakeSchema = z.object({
  requisitionId: z.string().cuid(),
  postingId: z.string().cuid(),
  source: z.enum(RECRUITMENT_SOURCES),
  rows: z.array(intakeRowSchema).min(1).max(1000),
})

// ── Candidate Schemas ─────────────────────────────────────────────────────────

export const createCandidateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(500).optional(),
  nationalId: z.string().max(20).optional(),
  source: z.enum(RECRUITMENT_SOURCES),
  linkedinUrl: secureExternalUrlSchema.optional(),
  portfolioUrl: secureExternalUrlSchema.optional(),
  cvUrl: secureExternalUrlSchema.optional(),
  avatarUrl: secureExternalUrlSchema.optional(),
  notes: z.string().max(2000).optional(),
})

export const updateCandidateSchema = createCandidateSchema.partial().extend({
  id: z.string().cuid(),
})

export const createPostingCandidateSchema = createCandidateSchema.omit({ source: true })

// ── Application Schemas ────────────────────────────────────────────────────────

export const createApplicationSchema = z.object({
  requisitionId: z.string().cuid(),
  postingId: z.string().cuid(),
  candidateId: z.string().cuid(),
  source: z.enum(RECRUITMENT_SOURCES),
  sourceRef: z.string().max(255).optional(),
})

export const moveKanbanSchema = z.object({
  applicationId: z.string().cuid(),
  pipelineStageId: z.string().cuid(),
  version: z.number().int().positive().optional(),
})

// ── Interview Schemas ─────────────────────────────────────────────────────────

export const createInterviewRoundSchema = z.object({
  applicationId: z.string().cuid(),
  roundNumber: z.number().int().positive(),
  title: z.string().min(1, "Title is required").max(255),
  format: z.enum(INTERVIEW_FORMATS).default("video_call"),
  scheduledAt: z.string().datetime("Invalid datetime format"),
  durationMinutes: z.number().int().positive().default(60),
  location: z.string().max(255).optional(),
  meetingLink: secureExternalUrlSchema.optional(),
  interviewerIds: z.array(z.string().cuid()).min(1, "At least one interviewer is required"),
})

export const updateInterviewRoundSchema = createInterviewRoundSchema
  .omit({ applicationId: true, roundNumber: true })
  .partial()
  .extend({ feedback: z.string().max(2000).optional() })
  .strict()

// ── Scorecard Schemas ─────────────────────────────────────────────────────────

export const createScorecardSchema = z.object({
  interviewId: z.string().cuid(),
  overallRating: z.number().int().min(1).max(5),
  strengths: z.string().max(1000).optional(),
  weaknesses: z.string().max(1000).optional(),
  recommendation: z.enum(["strong_hire", "hire", "no_hire", "strong_no_hire"]).optional(),
  scores: z.record(z.string(), z.number()).optional(),
  answers: z.record(z.string(), z.string()).optional(),
})

export const updateScorecardSchema = createScorecardSchema.omit({ interviewId: true }).partial()

// ── Offer Schemas ─────────────────────────────────────────────────────────────

export const createOfferSchema = z.object({
  applicationId: z.string().cuid(),
  offeredSalary: z.number().positive("Salary must be positive"),
  currency: z.string().length(3).default("VND"),
  startDate: z.string().datetime("Invalid date format"),
  endDate: z.string().datetime().optional(),
  trialEndDate: z.string().datetime().optional(),
  jobTitle: z.string().max(255).optional(),
  department: z.string().max(100).optional(),
  employmentType: z.enum(["full_time", "part_time", "contractor", "intern"]),
  benefits: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
})

export const createOfferVersionSchema = z.object({
  offerId: z.string().cuid(),
  salary: z.number().positive(),
  currency: z.string().length(3).default("VND"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  changeReason: z.string().min(1, "Change reason is required").max(500),
  notes: z.string().max(1000).optional(),
})

export const respondToOfferSchema = z.object({
  offerId: z.string().cuid(),
  response: z.enum(["accept", "decline", "negotiate"]),
  responseNote: z.string().max(1000).optional(),
  negotiateSalary: z.number().positive().optional(),
  negotiateStartDate: z.string().datetime().optional(),
})

// ── Background Check Schemas ───────────────────────────────────────────────────

export const createBackgroundCheckSchema = z.object({
  offerId: z.string().cuid(),
  group: z.enum(BGC_GROUPS),
})

export const completeBackgroundCheckSchema = z
  .object({
    passed: z.boolean(),
    failReason: z.string().trim().min(1).max(1000).optional(),
  })
  .superRefine(({ passed, failReason }, context) => {
    if (!passed && !failReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failReason"],
        message: "Lý do không đạt là bắt buộc",
      })
    }
  })

export const offerActionReasonSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
})

export const updateBackgroundCheckSchema = z
  .object({
    idVerified: z.boolean().optional(),
    addressVerified: z.boolean().optional(),
    criminalRecordCheck: z.boolean().optional(),
    legalStatusCheck: z.boolean().optional(),
    certificationVerified: z.boolean().optional(),
    employmentHistoryVerified: z.boolean().optional(),
    financialCheckCompleted: z.boolean().optional(),
    creditScoreCheck: z.boolean().optional(),
    failReason: z.string().max(1000).optional(),
    documents: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

// ── Query Schemas ─────────────────────────────────────────────────────────────

export const listRequisitionsQuerySchema = z.object({
  status: z.enum(REQUISITION_STATUSES).optional(),
  department: z.string().optional(),
  priority: z.enum(REQUISITION_PRIORITIES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const listCandidatesQuerySchema = z.object({
  source: z.enum(RECRUITMENT_SOURCES).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const listApplicationsQuerySchema = z.object({
  requisitionId: z.string().cuid().optional(),
  postingId: z.string().cuid().optional(),
  status: z.enum(RECRUITMENT_APPLICATION_STATUSES).optional(),
  assignedToId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

// ── Type Exports ─────────────────────────────────────────────────────────────

export type CreateJobRequisitionInput = z.infer<typeof createJobRequisitionSchema>
export type UpdateJobRequisitionInput = z.infer<typeof updateJobRequisitionSchema>
export type ApproveRequisitionInput = z.infer<typeof approveRequisitionSchema>

export type CreateJobDescriptionInput = z.infer<typeof createJobDescriptionSchema>
export type UpdateJobDescriptionInput = z.infer<typeof updateJobDescriptionSchema>
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>
export type ImportRecruitmentIntakeInput = z.infer<typeof importRecruitmentIntakeSchema>

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
export type CreatePostingCandidateInput = z.infer<typeof createPostingCandidateSchema>

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type MoveKanbanInput = z.infer<typeof moveKanbanSchema>

export type CreateInterviewRoundInput = z.infer<typeof createInterviewRoundSchema>
export type UpdateInterviewRoundInput = z.infer<typeof updateInterviewRoundSchema>

export type CreateScorecardInput = z.infer<typeof createScorecardSchema>
export type UpdateScorecardInput = z.infer<typeof updateScorecardSchema>

export type CreateOfferInput = z.infer<typeof createOfferSchema>
export type CreateOfferVersionInput = z.infer<typeof createOfferVersionSchema>
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>

export type CreateBackgroundCheckInput = z.infer<typeof createBackgroundCheckSchema>
export type UpdateBackgroundCheckInput = z.infer<typeof updateBackgroundCheckSchema>
