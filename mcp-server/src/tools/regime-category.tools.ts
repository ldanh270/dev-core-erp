import { z } from "zod"

import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import { mcpServer } from "../mcp.js"
import { createAuthedClient } from "../utils/devcore-client.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerRegimeCategoryTools = () => {
  mcpServer.tool(
    "regime_category_list",
    "List regime categories available for regime application forms.",
    { sessionId: z.string() },
    async ({ sessionId }) => {
      try {
        const session = requireSession(sessionId)
        const response = await createAuthedClient(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.REGIME_CATEGORY.BASE)
        return buildSuccess(response.data)
      } catch (error: unknown) {
        return buildError("Failed to list regime categories", error instanceof Error ? error.message : String(error))
      }
    },
  )
}
