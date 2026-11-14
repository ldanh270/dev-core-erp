import { PERMISSION_CODE } from "@/configs/entities/permission.config"
import { RecruitmentController } from "@/controllers/recruitment.controller"
import { type AuthRequest, authenticate } from "@/middlewares/auth.middleware"
import { requirePermission } from "@/middlewares/permission.middleware"

import { Router } from "express"

const router = Router()

// Instantiate controller
const controller = new RecruitmentController()

// ── Public Routes (No authentication required) ────────────────────────────────
router.get("/oauth/google/callback", (req, res, next) =>
  controller.handleGoogleOAuthCallback(req as AuthRequest, res, next),
)

// Apply auth middleware to all remaining routes
router.use(authenticate)

// ── Job Requisitions ────────────────────────────────────────────────────────

router.post(
  "/requisitions",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createRequisition(req as AuthRequest, res, next),
)
router.get("/requisitions", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.listRequisitions(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/approvers",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listRequisitionApprovers(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/stats",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getRequisitionStats(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/:id/workspace",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getRequisitionWorkspace(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/:id/activities",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getRequisitionActivities(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/:id/stages",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listRequisitionStages(req as AuthRequest, res, next),
)
router.post(
  "/requisitions/:id/stages",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.createRequisitionStage(req as AuthRequest, res, next),
)
router.put(
  "/requisitions/:id/stages/reorder",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.reorderRequisitionStages(req as AuthRequest, res, next),
)
router.patch(
  "/requisitions/:id/stages/:stageId",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.updateRequisitionStage(req as AuthRequest, res, next),
)
router.delete(
  "/requisitions/:id/stages/:stageId",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.deleteRequisitionStage(req as AuthRequest, res, next),
)
router.post(
  "/requisitions/:id/stages/move",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.moveRequisitionApplication(req as AuthRequest, res, next),
)
router.get(
  "/requisitions/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getRequisition(req as AuthRequest, res, next),
)
router.patch(
  "/requisitions/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateRequisition(req as AuthRequest, res, next),
)
router.post(
  "/requisitions/:id/submit",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.submitRequisitionForApproval(req as AuthRequest, res, next),
)
router.post(
  "/requisitions/:id/approve",
  requirePermission(PERMISSION_CODE.RECRUITMENT_REQUISITION_APPROVE),
  (req, res, next) => controller.approveRequisition(req as AuthRequest, res, next),
)
router.post(
  "/requisitions/:id/close",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.closeRequisition(req as AuthRequest, res, next),
)
router.delete(
  "/requisitions/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_DELETE),
  (req, res, next) => controller.deleteRequisition(req as AuthRequest, res, next),
)

// ── Job Postings & Intake ─────────────────────────────

router.post(
  "/job-postings",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.createJobPosting(req as AuthRequest, res, next),
)
router.get(
  "/job-postings",
  requirePermission(PERMISSION_CODE.RECRUITMENT_JD_READ),
  (req, res, next) => controller.listJobPostings(req as AuthRequest, res, next),
)
router.get(
  "/job-postings/:id/overview",
  requirePermission(PERMISSION_CODE.RECRUITMENT_JD_READ),
  (req, res, next) => controller.getJobPostingOverview(req as AuthRequest, res, next),
)
router.get(
  "/job-postings/:id/activities",
  requirePermission(PERMISSION_CODE.RECRUITMENT_JD_READ),
  (req, res, next) => controller.getJobPostingActivities(req as AuthRequest, res, next),
)
router.get(
  "/job-postings/:id/responses",
  requirePermission(PERMISSION_CODE.RECRUITMENT_JD_READ),
  (req, res, next) => controller.getJobPostingResponses(req as AuthRequest, res, next),
)
router.get(
  "/job-postings/:id/stages",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listPostingStages(req as AuthRequest, res, next),
)
router.post(
  "/job-postings/:id/stages",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.createPostingStage(req as AuthRequest, res, next),
)
router.put(
  "/job-postings/:id/stages/reorder",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.reorderPostingStages(req as AuthRequest, res, next),
)
router.patch(
  "/job-postings/:id/stages/:stageId",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.updatePostingStage(req as AuthRequest, res, next),
)
router.delete(
  "/job-postings/:id/stages/:stageId",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.deletePostingStage(req as AuthRequest, res, next),
)
router.post(
  "/job-postings/:id/stages/move",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.movePostingApplication(req as AuthRequest, res, next),
)
router.post(
  "/job-postings/:id/candidates",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createPostingCandidate(req as AuthRequest, res, next),
)
router.get(
  "/job-postings/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_JD_READ),
  (req, res, next) => controller.getJobPosting(req as AuthRequest, res, next),
)
router.patch(
  "/job-postings/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.updateJobPosting(req as AuthRequest, res, next),
)
router.post(
  "/job-postings/:id/publish",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.publishJobPosting(req as AuthRequest, res, next),
)
router.post(
  "/job-postings/:id/sync",
  requirePermission(PERMISSION_CODE.RECRUITMENT_INTAKE_MANAGE),
  (req, res, next) => controller.syncJobPosting(req as AuthRequest, res, next),
)
router.delete(
  "/job-postings/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.archiveJobPosting(req as AuthRequest, res, next),
)
router.post(
  "/intake/import",
  requirePermission(PERMISSION_CODE.RECRUITMENT_INTAKE_MANAGE),
  (req, res, next) => controller.importRecruitmentIntake(req as AuthRequest, res, next),
)

// ── Candidates ─────────────────────────────────────────────────────────────

router.post(
  "/candidates",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createCandidate(req as AuthRequest, res, next),
)
router.get("/candidates", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.listCandidates(req as AuthRequest, res, next),
)
router.get(
  "/candidates/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getCandidate(req as AuthRequest, res, next),
)
router.patch(
  "/candidates/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateCandidate(req as AuthRequest, res, next),
)
router.delete(
  "/candidates/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_DELETE),
  (req, res, next) => controller.deleteCandidate(req as AuthRequest, res, next),
)

// ── Applications ────────────────────────────────────────────────────────────

router.post(
  "/applications",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createApplication(req as AuthRequest, res, next),
)
router.get("/applications", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.listApplications(req as AuthRequest, res, next),
)
router.get(
  "/applications/kanban",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listKanban(req as AuthRequest, res, next),
)
router.get(
  "/applications/stats",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getApplicationStats(req as AuthRequest, res, next),
)
router.get(
  "/applications/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getApplication(req as AuthRequest, res, next),
)
router.post(
  "/applications/kanban/move",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.moveKanban(req as AuthRequest, res, next),
)
router.patch(
  "/applications/:id/assign",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.assignRecruiter(req as AuthRequest, res, next),
)
router.post(
  "/applications/:id/notes",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.addApplicationNote(req as AuthRequest, res, next),
)
router.get(
  "/applications/:id/notes",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getApplicationNotes(req as AuthRequest, res, next),
)

// ── Interview Rounds ─────────────────────────────────────────────────────

router.post(
  "/interviews",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createInterviewRound(req as AuthRequest, res, next),
)
router.get(
  "/interviews/upcoming",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getUpcomingInterviews(req as AuthRequest, res, next),
)
router.get(
  "/interviews/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getInterviewRound(req as AuthRequest, res, next),
)
router.get(
  "/applications/:applicationId/interviews",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listInterviewsByApplication(req as AuthRequest, res, next),
)
router.patch(
  "/interviews/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateInterviewRound(req as AuthRequest, res, next),
)
router.post(
  "/interviews/:id/complete",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.completeInterview(req as AuthRequest, res, next),
)
router.post(
  "/interviews/:id/cancel",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.cancelInterview(req as AuthRequest, res, next),
)
router.post(
  "/interviews/:id/no-show",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.markNoShow(req as AuthRequest, res, next),
)

// ── Scorecards ─────────────────────────────────────────────────────────────

router.post(
  "/scorecards",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createScorecard(req as AuthRequest, res, next),
)
router.get(
  "/scorecards/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getScorecard(req as AuthRequest, res, next),
)
router.get(
  "/interviews/:interviewId/scorecards",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listScorecardsByInterview(req as AuthRequest, res, next),
)
router.patch(
  "/scorecards/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateScorecard(req as AuthRequest, res, next),
)
router.delete(
  "/scorecards/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_DELETE),
  (req, res, next) => controller.deleteScorecard(req as AuthRequest, res, next),
)

// ── Offers ─────────────────────────────────────────────────────────────────

router.post("/offers", requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE), (req, res, next) =>
  controller.createOffer(req as AuthRequest, res, next),
)
router.get("/offers", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.listOffers(req as AuthRequest, res, next),
)
router.get("/offers/stats", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.getOfferStats(req as AuthRequest, res, next),
)
router.get("/offers/:id", requirePermission(PERMISSION_CODE.RECRUITMENT_READ), (req, res, next) =>
  controller.getOffer(req as AuthRequest, res, next),
)
router.patch(
  "/offers/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateOffer(req as AuthRequest, res, next),
)
router.post(
  "/offers/:id/send",
  requirePermission(PERMISSION_CODE.RECRUITMENT_APPROVE),
  (req, res, next) => controller.sendOffer(req as AuthRequest, res, next),
)
router.post(
  "/offers/respond",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.respondToOffer(req as AuthRequest, res, next),
)
router.post(
  "/offers/:id/rescind",
  requirePermission(PERMISSION_CODE.RECRUITMENT_APPROVE),
  (req, res, next) => controller.rescindOffer(req as AuthRequest, res, next),
)
router.post(
  "/offers/:id/expire",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.expireOffer(req as AuthRequest, res, next),
)
router.get(
  "/offers/:id/versions",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getOfferVersions(req as AuthRequest, res, next),
)

// ── Background Checks ───────────────────────────────────────────────────────

router.post(
  "/background-checks",
  requirePermission(PERMISSION_CODE.RECRUITMENT_CREATE),
  (req, res, next) => controller.createBackgroundCheck(req as AuthRequest, res, next),
)
router.get(
  "/background-checks",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.listBackgroundChecks(req as AuthRequest, res, next),
)
router.get(
  "/background-checks/stats",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getBackgroundCheckStats(req as AuthRequest, res, next),
)
router.get(
  "/background-checks/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getBackgroundCheck(req as AuthRequest, res, next),
)
router.get(
  "/offers/:offerId/background-check",
  requirePermission(PERMISSION_CODE.RECRUITMENT_READ),
  (req, res, next) => controller.getBackgroundCheckByOffer(req as AuthRequest, res, next),
)
router.patch(
  "/background-checks/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.updateBackgroundCheck(req as AuthRequest, res, next),
)
router.post(
  "/background-checks/:id/start",
  requirePermission(PERMISSION_CODE.RECRUITMENT_UPDATE),
  (req, res, next) => controller.startBackgroundCheck(req as AuthRequest, res, next),
)
router.post(
  "/background-checks/:id/complete",
  requirePermission(PERMISSION_CODE.RECRUITMENT_APPROVE),
  (req, res, next) => controller.completeBackgroundCheck(req as AuthRequest, res, next),
)
router.delete(
  "/background-checks/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_DELETE),
  (req, res, next) => controller.deleteBackgroundCheck(req as AuthRequest, res, next),
)

// ── OAuth Accounts ────────────────────────────────────────────────────────

router.get(
  "/oauth-accounts",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.listOAuthAccounts(req as AuthRequest, res, next),
)
router.post(
  "/oauth-accounts",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.upsertOAuthAccount(req as AuthRequest, res, next),
)
router.delete(
  "/oauth-accounts/:id",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.deleteOAuthAccount(req as AuthRequest, res, next),
)

// ── Google OAuth Flow ─────────────────────────────────────────────────────

router.get(
  "/oauth/google/connect",
  requirePermission(PERMISSION_CODE.RECRUITMENT_POSTING_MANAGE),
  (req, res, next) => controller.initiateGoogleOAuth(req as AuthRequest, res, next),
)

export default router
