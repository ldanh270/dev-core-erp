import {
  BGC_GROUP,
  BGC_GROUPS,
  BGC_STATUS,
  RECRUITMENT_APPLICATION_STATUS,
  TERMINAL_APPLICATION_STATUSES,
} from "@/configs/entities/recruitment.config"

// ── Type Aliases ──────────────────────────────────────────────────────────────

type BgcGroup = (typeof BGC_GROUP)[keyof typeof BGC_GROUP]
type BgcStatus = (typeof BGC_STATUS)[keyof typeof BGC_STATUS]

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION STATUS TRANSITIONS
// Defines valid status transitions for the recruitment application lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

type ApplicationStatus =
  (typeof RECRUITMENT_APPLICATION_STATUS)[keyof typeof RECRUITMENT_APPLICATION_STATUS]

export const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [RECRUITMENT_APPLICATION_STATUS.NEW]: [
    RECRUITMENT_APPLICATION_STATUS.REVIEWING,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.REVIEWING]: [
    RECRUITMENT_APPLICATION_STATUS.SHORTLISTED,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.SHORTLISTED]: [
    RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.INTERVIEWING]: [
    RECRUITMENT_APPLICATION_STATUS.INTERVIEWING, // Next round
    RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW]: [
    RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.OFFER_SENT]: [
    RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
    RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
    RECRUITMENT_APPLICATION_STATUS.REJECTED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED]: [
    RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK,
  ],
  [RECRUITMENT_APPLICATION_STATUS.BACKGROUND_CHECK]: [
    RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING,
    RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  ],
  [RECRUITMENT_APPLICATION_STATUS.PENDING_ONBOARDING]: [
    RECRUITMENT_APPLICATION_STATUS.HIRED,
    RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW,
    RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED,
  ],
  // Terminal states - no transitions allowed
  [RECRUITMENT_APPLICATION_STATUS.HIRED]: [],
  [RECRUITMENT_APPLICATION_STATUS.REJECTED]: [],
  [RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED]: [],
  [RECRUITMENT_APPLICATION_STATUS.OFFER_RESCINDED]: [],
  [RECRUITMENT_APPLICATION_STATUS.CANDIDATE_WITHDREW]: [],
}

// Check if transition is valid
export function canTransitionApplicationStatus(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  // from is typed as ApplicationStatus (key of the map), so the lookup is safe.
  // eslint-disable-next-line security/detect-object-injection
  return new Map(Object.entries(APPLICATION_STATUS_TRANSITIONS)).get(from)?.includes(to) ?? false
}

// Get all possible next statuses
export function getNextApplicationStatuses(status: ApplicationStatus): ApplicationStatus[] {
  // status is typed as ApplicationStatus (key of the map), so the lookup is safe.
  // eslint-disable-next-line security/detect-object-injection
  return new Map(Object.entries(APPLICATION_STATUS_TRANSITIONS)).get(status) || []
}

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return (TERMINAL_APPLICATION_STATUSES as readonly ApplicationStatus[]).includes(status)
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND CHECK STRATEGY CONFIG
// Defines which checks are required for each BGC group (A, B, C, D)
// ═══════════════════════════════════════════════════════════════════════════════

export type BgcCheckField =
  | "idVerified"
  | "addressVerified"
  | "criminalRecordCheck"
  | "legalStatusCheck"
  | "certificationVerified"
  | "employmentHistoryVerified"
  | "financialCheckCompleted"
  | "creditScoreCheck"

export interface BgcCheckDefinition {
  name: string
  description: string
  field: BgcCheckField
  required: boolean
}

export const BGC_CHECKS: Record<BgcGroup, BgcCheckDefinition[]> = {
  [BGC_GROUP.A]: [
    {
      name: "ID Verification",
      description: "Verify national ID/CMND/CCCD",
      field: "idVerified",
      required: true,
    },
    {
      name: "Address Verification",
      description: "Verify current address",
      field: "addressVerified",
      required: true,
    },
  ],
  [BGC_GROUP.B]: [
    {
      name: "Criminal Record Check",
      description: "Check for criminal records",
      field: "criminalRecordCheck",
      required: true,
    },
    {
      name: "Legal Status Check",
      description: "Verify legal eligibility to work",
      field: "legalStatusCheck",
      required: true,
    },
  ],
  [BGC_GROUP.C]: [
    {
      name: "Certification Verification",
      description: "Verify professional certifications",
      field: "certificationVerified",
      required: true,
    },
    {
      name: "Employment History",
      description: "Verify previous employment",
      field: "employmentHistoryVerified",
      required: true,
    },
  ],
  [BGC_GROUP.D]: [
    {
      name: "Financial Check",
      description: "Financial background check",
      field: "financialCheckCompleted",
      required: true,
    },
    {
      name: "Credit Score Check",
      description: "Credit history verification",
      field: "creditScoreCheck",
      required: true,
    },
  ],
}

// Get BGC group for position level
export function getBgcGroupForLevel(positionLevel: string): (typeof BGC_GROUPS)[number] {
  const level = positionLevel.toLowerCase()

  if (["intern", "junior", "entry"].includes(level)) {
    return BGC_GROUP.A
  }
  if (["mid", "senior", "specialist"].includes(level)) {
    return BGC_GROUP.B
  }
  if (["lead", "manager", "principal"].includes(level)) {
    return BGC_GROUP.C
  }
  if (["director", "vp", "executive", "c-level", "cfo", "cto", "ceo"].includes(level)) {
    return BGC_GROUP.D
  }

  // Default to Group A for unknown levels
  return BGC_GROUP.A
}

// BGC status progression
export const BGC_STATUS_TRANSITIONS: Record<BgcStatus, BgcStatus[]> = {
  [BGC_STATUS.PENDING]: [BGC_STATUS.IN_PROGRESS],
  [BGC_STATUS.IN_PROGRESS]: [BGC_STATUS.COMPLETED],
  [BGC_STATUS.COMPLETED]: [BGC_STATUS.PASSED, BGC_STATUS.FAILED],
  [BGC_STATUS.PASSED]: [],
  [BGC_STATUS.FAILED]: [],
}

// ═══════════════════════════════════════════════════════════════════════════════
// KANBAN COLUMN MAPPING
// Maps application status to Kanban columns for UI
// ═══════════════════════════════════════════════════════════════════════════════

export interface KanbanColumn {
  id: string
  title: string
  statuses: ApplicationStatus[]
  color: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "new",
    title: "New Applications",
    statuses: [RECRUITMENT_APPLICATION_STATUS.NEW],
    color: "blue",
  },
  {
    id: "reviewing",
    title: "Reviewing",
    statuses: [RECRUITMENT_APPLICATION_STATUS.REVIEWING],
    color: "yellow",
  },
  {
    id: "shortlisted",
    title: "Shortlisted",
    statuses: [RECRUITMENT_APPLICATION_STATUS.SHORTLISTED],
    color: "purple",
  },
  {
    id: "interviewing",
    title: "Interviewing",
    statuses: [
      RECRUITMENT_APPLICATION_STATUS.INTERVIEWING,
      RECRUITMENT_APPLICATION_STATUS.FINAL_REVIEW,
    ],
    color: "orange",
  },
  {
    id: "offer",
    title: "Offer",
    statuses: [
      RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
      RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
    ],
    color: "green",
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATE MAPPING
// Maps status changes to email templates
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmailTemplateMapping {
  status: ApplicationStatus
  templateKey: string
  sendEmail: boolean
  requiresConfirmation: boolean
}

export const STATUS_EMAIL_MAPPINGS: EmailTemplateMapping[] = [
  {
    status: RECRUITMENT_APPLICATION_STATUS.REVIEWING,
    templateKey: "application_under_review",
    sendEmail: true,
    requiresConfirmation: false,
  },
  {
    status: RECRUITMENT_APPLICATION_STATUS.SHORTLISTED,
    templateKey: "application_shortlisted",
    sendEmail: true,
    requiresConfirmation: true,
  },
  {
    status: RECRUITMENT_APPLICATION_STATUS.REJECTED,
    templateKey: "application_rejected",
    sendEmail: true,
    requiresConfirmation: true,
  },
  {
    status: RECRUITMENT_APPLICATION_STATUS.OFFER_SENT,
    templateKey: "offer_sent",
    sendEmail: true,
    requiresConfirmation: false,
  },
  {
    status: RECRUITMENT_APPLICATION_STATUS.OFFER_ACCEPTED,
    templateKey: "offer_accepted",
    sendEmail: true,
    requiresConfirmation: false,
  },
  {
    status: RECRUITMENT_APPLICATION_STATUS.OFFER_DECLINED,
    templateKey: "offer_declined",
    sendEmail: false,
    requiresConfirmation: false,
  },
]
