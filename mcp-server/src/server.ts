import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import "dotenv/config"
import express from "express"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"

import { loginStore } from "./auth/login-store.js"
import { mcpServer, registerTools } from "./mcp.js"
import { authService } from "./services/auth.service.js"
import { sessionManager } from "./session/session.manager.js"
import { logger } from "./utils/logger.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Register all tools before starting the server
registerTools()

const mountAuthRoutes = (app: any) => {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
  })

  // 1. Serve the login page
  app.get("/auth/login", authLimiter, (req: express.Request, res: express.Response) => {
    const loginId = req.query.id as string
    if (!loginId || !loginStore.get(loginId)) {
      res.status(400).send("Invalid or expired login ID. Please try again from the AI assistant.")
      return
    }
    res.sendFile(path.join(__dirname, "auth", "login-page.html"))
  })

  // 2. Handle form submission
  app.post(
    "/auth/submit",
    authLimiter,
    express.json(),
    async (req: express.Request, res: express.Response) => {
      const { loginId, username, password } = req.body

      if (!loginId || !username || !password) {
        res.status(400).json({ error: "Missing required fields" })
        return
      }

      const loginReq = loginStore.get(loginId)
      if (!loginReq) {
        res.status(400).json({ error: "Login request expired or invalid. Please try again." })
        return
      }

      try {
        // Call DevCore backend to authenticate
        const { data, cookies } = await authService.login({ username, password })
        logger.debug("DevCore API Login Result:", data)

        // Extract token properly based on actual backend response structure.
        // Sometimes backends return `accessToken` instead of `token`.
        const token =
          data.data?.token ||
          (data.data as any)?.accessToken ||
          (data as any).token ||
          (data as any).accessToken

        if (!token && (!cookies || cookies.length === 0)) {
          logger.error("Token and cookies are missing in the DevCore API response!", data)
        }

        // Save session
        const sessionId = sessionManager.create({
          jwt: token || "", // Fallback to empty if not provided in body
          role: data.data?.employee?.role || "unknown",
          employeeId: data.data?.employee?.id || "unknown",
          cookies: cookies,
        })

        // Update login store
        loginStore.setCompleted(loginId, sessionId)

        res.json({ success: true })
      } catch (error: any) {
        logger.error(`Login failed for ${username}:`, error.message)
        loginStore.setFailed(loginId, error.message)
        res.status(401).json({ error: "Invalid credentials or server error" })
      }
    },
  )
}

const startSSEServer = () => {
  const app = express()
  const PORT = process.env.PORT || 3001

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "devcore-mcp" })
  })

  // Build a sub-router that exposes all HTTP routes under the /mcp prefix.
  // This is required for deployments behind reverse proxies / ngrok where
  // PUBLIC_BASE_URL includes a path prefix (e.g. https://x.ngrok-free.dev/mcp).
  // Endpoints exposed:
  //   GET  /mcp/sse
  //   POST /mcp/message
  //   GET  /mcp/auth/login
  //   POST /mcp/auth/submit
  const apiRouter = express.Router()

  let transport: SSEServerTransport | null = null

  apiRouter.get("/sse", async (req, res) => {
    const clientIp = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown"
    logger.info(`SSE connection request from ${clientIp}`)

    // Close the existing transport/connection before creating a new one.
    // The MCP Server is a singleton and does not allow re-connecting without
    // closing first.
    if (transport) {
      logger.warn("Previous SSE transport still active - closing before reconnecting")
      const oldTransport = transport
      transport = null
      await oldTransport.close()
    }

    try {
      // SSEServerTransport uses the second arg as the path clients POST messages to.
      // Pass the absolute path so it works correctly when mounted under a sub-path.
      transport = new SSEServerTransport("/mcp/message", res)
      await mcpServer.server.connect(transport)
      logger.success("SSE transport connected successfully")
    } catch (err) {
      logger.error("Failed to connect SSE transport:", err)
      return
    }

    // Clean up when client disconnects. Guard against clobbering a newer
    // transport that already replaced this one.
    const myTransport = transport!
    req.on("close", () => {
      if (transport === myTransport) {
        logger.info("SSE client disconnected - cleaning up transport")
        transport = null
        void myTransport.close()
      }
    })
  })

  apiRouter.post("/message", async (req, res) => {
    if (!transport) {
      logger.warn("POST /message received but no active SSE transport")
      res.status(400).json({ error: "SSE connection not established" })
      return
    }
    logger.debug(`POST /message received`)
    await transport.handlePostMessage(req, res)
  })

  mountAuthRoutes(apiRouter)

  app.use("/mcp", apiRouter)

  app.listen(PORT, () => {
    logger.info(`DevCore ERP MCP Server running on port ${PORT}`)
    logger.info(`SSE endpoint : http://localhost:${PORT}/mcp/sse`)
    logger.info(`Message endpoint: http://localhost:${PORT}/mcp/message`)
    logger.info(`STDIO mode   : pass --stdio flag`)
    logger.info(`Verbose debug: set DEBUG=true in .env`)
  })
}

const startStdioServer = async () => {
  const app = express()
  const PORT = process.env.PORT || 3001

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "devcore-mcp" })
  })

  const apiRouter = express.Router()
  mountAuthRoutes(apiRouter)
  app.use("/mcp", apiRouter)

  app.listen(PORT, () => {
    logger.info(`Browser Auth routes running on port ${PORT} (STDIO Mode)`)
    logger.info(`Auth endpoints: http://localhost:${PORT}/mcp/auth/login`)
  })

  const transport = new StdioServerTransport()
  await mcpServer.server.connect(transport)
  // In STDIO mode, ALL LOGS must use console.error to avoid breaking the JSON-RPC stream in stdout
  // logger automatically handles this when --stdio is present
  logger.info("DevCore ERP MCP Server running in STDIO mode")
}

// Check if running in STDIO mode
if (process.argv.includes("--stdio")) {
  startStdioServer().catch((err) => logger.error("STDIO server crashed:", err))
} else {
  startSSEServer()
}
