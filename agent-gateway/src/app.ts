import express from "express"

import { env } from "./config/env.js"
import { redisService } from "./services/redis.service.js"
import { mcpService } from "./services/mcp.service.js"
import { createBot } from "./bot/index.js"

const MCP_CONNECTION_MAX_ATTEMPTS = 20
const MCP_CONNECTION_RETRY_DELAY_MS = 1_000

const waitForMcpServer = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MCP_CONNECTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      const tools = await mcpService.getTools()
      console.log(`[App] ✅ MCP Server connected — ${tools.length} tools available`)
      return
    } catch (err) {
      if (attempt === MCP_CONNECTION_MAX_ATTEMPTS) {
        throw err
      }

      console.log(`[App] Waiting for MCP Server (${attempt}/${MCP_CONNECTION_MAX_ATTEMPTS})...`)
      await new Promise((resolve) => setTimeout(resolve, MCP_CONNECTION_RETRY_DELAY_MS))
    }
  }
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(`[App] Starting DevCore ERP Agent Gateway (${env.NODE_ENV})...`)

  // 1. Verify Redis connection
  try {
    await redisService.ping()
    console.log("[App] ✅ Redis connected")
  } catch (err) {
    console.error("[App] ❌ Redis connection failed:", err)
    process.exit(1)
  }

  // 2. Verify MCP Server connectivity by fetching tools
  try {
    await waitForMcpServer()
  } catch (err) {
    console.error("[App] ❌ MCP Server connection failed:", err)
    console.error("[App] Ensure MCP_SSE_URL is correct and mcp-server is running.")
    process.exit(1)
  }

  // 3. Start bot
  const bot = createBot()

  // 4. Small Express server for health checks
  const app = express()
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "devcore-agent-gateway", timestamp: new Date().toISOString() })
  })
  app.listen(env.PORT, () => {
    console.log(`[App] ✅ Health check server running on port ${env.PORT}`)
  })

  // 5. Launch bot
  void bot
    .launch(
      {
        allowedUpdates: ["message", "callback_query"],
      },
      () => console.log("[App] ✅ Telegram bot is running (long polling)"),
    )
    .catch((err: unknown) => {
      console.error("[App] ❌ Telegram bot failed:", err)
      process.exit(1)
    })

  // 6. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[App] Received ${signal}, shutting down gracefully...`)
    bot.stop(signal)
    await redisService.quit()
    process.exit(0)
  }

  process.once("SIGINT", () => shutdown("SIGINT"))
  process.once("SIGTERM", () => shutdown("SIGTERM"))
}

main().catch((err) => {
  console.error("[App] Fatal startup error:", err)
  process.exit(1)
})
