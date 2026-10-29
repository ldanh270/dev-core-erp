import { z } from "zod"

import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import { mcpServer } from "../mcp.js"
import { createAuthedClient } from "../utils/devcore-client.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

const approvalCategory = z.enum(["application", "password_reset", "recruitment_proposal"])

export const registerApprovalTools = () => {
  mcpServer.tool(
    "approval_list_pending",
    "List all approval requests the authenticated user is authorized to process.",
    { sessionId: z.string() },
    async ({ sessionId }) => {
      try {
        const session = requireSession(sessionId)
        const response = await createAuthedClient(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.APPROVAL.BASE)
        return buildSuccess(response.data)
      } catch (error: unknown) {
        return buildError("Failed to list pending approvals", error instanceof Error ? error.message : String(error))
      }
    },
  )

  mcpServer.tool(
    "approval_process",
    "Approve or reject a pending request. Only call after the user explicitly confirms the target and action.",
    {
      sessionId: z.string(),
      category: approvalCategory,
      requestId: z.string(),
      status: z.enum(["approved", "rejected"]),
      rejectReason: z.string().min(5).max(500).optional(),
    },
    async ({ sessionId, category, requestId, status, rejectReason }) => {
      try {
        if (status === "rejected" && !rejectReason) throw new Error("rejectReason is required when rejecting")
        const session = requireSession(sessionId)
        const response = await createAuthedClient(session).patch(
          DEVCORE_API_CONSTANTS.ENDPOINTS.APPROVAL.PROCESS(category, requestId),
          { status, ...(rejectReason && { rejectReason }) },
        )
        return buildSuccess(response.data)
      } catch (error: unknown) {
        return buildError("Failed to process approval", error instanceof Error ? error.message : String(error))
      }
    },
  )
}
