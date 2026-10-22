import { z } from "zod"

import { loginStore } from "../auth/login-store.js"
import { mcpServer } from "../mcp.js"
import { authService } from "../services/auth.service.js"
import { sessionManager } from "../session/session.manager.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerAuthTools = () => {
  // Tool: login_start
  mcpServer.tool(
    "login_start",
    "Start the browser-based login process. AI should present the returned URL to the user to click and log in.",
    {},
    async () => {
      try {
        const loginId = loginStore.create()
        // Build the URL the user must open in their browser.
        // PUBLIC_BASE_URL is REQUIRED (must include scheme, e.g. https://...).
        // No localhost fallback — this ensures the link works whether MCP runs
        // locally, behind nginx, on a cloud VM, or via ngrok.
        const publicBase = process.env.PUBLIC_BASE_URL?.trim().replace(/\/+$/, "")
        if (!publicBase) {
          return buildError(
            "PUBLIC_BASE_URL is not configured",
            "Set PUBLIC_BASE_URL in .env (must include scheme, e.g. https://your-domain or http://localhost:3001 for dev).",
          )
        }
        const mcpBase = publicBase.endsWith("/mcp") ? publicBase : `${publicBase}/mcp`
        const loginUrl = `${mcpBase}/auth/login?id=${loginId}`

        return buildSuccess({
          message:
            "Login process started. Please ask the user to open the following URL in their browser to log in. Do NOT ask for their password.",
          loginUrl,
          loginId,
          instruction: `CRITICAL: Present the loginUrl to the user. Then, periodically call the 'login_status' tool with loginId='${loginId}' to check if they have completed the login.`,
        })
      } catch (error: any) {
        return buildError("Failed to start login process", error.message)
      }
    },
  )

  // Tool: login_status
  mcpServer.tool(
    "login_status",
    "Check the status of a pending browser-based login request.",
    {
      loginId: z.string().describe("The loginId returned by login_start"),
    },
    async ({ loginId }) => {
      try {
        const req = loginStore.get(loginId)

        if (!req) {
          return buildError("Login request not found or expired. Please call login_start again.")
        }

        if (req.status === "pending") {
          return buildSuccess({
            status: "pending",
            message:
              "User has not completed login yet. Please wait and check again in a few seconds.",
          })
        }

        if (req.status === "failed") {
          return buildError("User failed to login", req.error)
        }

        return buildSuccess({
          status: "completed",
          message: "Login successful!",
          sessionId: req.sessionId,
          instruction:
            "CRITICAL: Keep this sessionId and pass it as an argument to all other tools.",
        })
      } catch (error: any) {
        return buildError("Failed to check login status", error.message)
      }
    },
  )

  // Tool: logout
  mcpServer.tool(
    "logout",
    "Logout from DevCore ERP system and invalidate the sessionId.",
    {
      sessionId: z.string().describe("The active session ID"),
    },
    async ({ sessionId }) => {
      try {
        const session = requireSession(sessionId)
        await authService.logout(session)

        sessionManager.delete(sessionId)

        return buildSuccess({
          message: "Logout successful. Session invalidated.",
        })
      } catch (error: any) {
        return buildError("Logout failed", error.message)
      }
    },
  )
}
