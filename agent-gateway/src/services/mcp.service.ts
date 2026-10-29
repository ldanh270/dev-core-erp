import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"

import { env } from "../config/env.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw tool definition as returned by MCP SDK */
export interface McpToolDefinition {
  name: string
  description?: string
  inputSchema: {
    type: "object"
    properties?: Record<string, unknown>
    required?: string[]
  }
}

/** Result of a login_start tool call */
export interface LoginStartResult {
  loginId: string
  loginUrl: string
}

/** Result of a login_status tool call */
export interface LoginStatusResult {
  status: "pending" | "completed" | "failed"
  sessionId?: string
  error?: string
}

/** Generic tool call result */
export type ToolCallResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code: "UNAUTHORIZED" | "VALIDATION_ERROR" | "UNKNOWN" }

// ---------------------------------------------------------------------------
// IMcpService Interface
// ---------------------------------------------------------------------------
export interface IMcpService {
  /** List all available tools (cached) */
  getTools(): Promise<McpToolDefinition[]>

  /** Call a tool, auto-injecting sessionId into args when required */
  callTool(
    name: string,
    args: Record<string, unknown>,
    sessionId: string,
  ): Promise<ToolCallResult>

  /** Start a browser-based login flow */
  startLogin(): Promise<ToolCallResult<LoginStartResult>>

  /** Poll the status of a pending login */
  pollLoginStatus(loginId: string): Promise<ToolCallResult<LoginStatusResult>>
}

// ---------------------------------------------------------------------------
// Tools that do NOT require a sessionId (auth flow tools)
// ---------------------------------------------------------------------------
const SESSION_EXEMPT_TOOLS = new Set(["login_start", "login_status"])

// Tool cache TTL in milliseconds
const TOOLS_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ---------------------------------------------------------------------------
// MCP Client factory
// Creates a fresh SSE client, runs the operation, then closes.
// This avoids managing persistent SSE connections per user.
// ---------------------------------------------------------------------------
// Async arrow avoids security-node's null-handler crash on try/finally declarations.
const withMcpClient = async <T>(
  operation: (client: Client) => Promise<T>,
): Promise<T> => {
  const transport = new SSEClientTransport(new URL(env.MCP_SSE_URL))
  const client = new Client(
    { name: "devcore-agent-gateway", version: "1.0.0" },
    { capabilities: {} },
  )

  try {
    await client.connect(transport)
    return await operation(client)
  } finally {
    await client.close()
  }
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------
class McpService implements IMcpService {
  private cachedTools: McpToolDefinition[] | null = null
  private toolsCachedAt = 0

  // --- Tool listing ---

  async getTools(): Promise<McpToolDefinition[]> {
    const now = Date.now()
    if (this.cachedTools && now - this.toolsCachedAt < TOOLS_CACHE_TTL_MS) {
      return this.cachedTools
    }

    const result = await withMcpClient(async (client) => {
      const { tools } = await client.listTools()
      return tools
    })

    this.cachedTools = result as McpToolDefinition[]
    this.toolsCachedAt = Date.now()
    return this.cachedTools
  }

  // --- Tool calling ---

  async callTool(
    name: string,
    args: Record<string, unknown>,
    sessionId: string,
  ): Promise<ToolCallResult> {
    // Auto-inject sessionId for tools that require it
    const finalArgs =
      SESSION_EXEMPT_TOOLS.has(name) ? args : { ...args, sessionId }

    try {
      const result = await withMcpClient(async (client) => {
        return client.callTool({ name, arguments: finalArgs })
      })

      // MCP SDK returns { content: [...] }
      const content = (result as { content: Array<{ type: string; text?: string }> }).content
      const textContent = content.find((c) => c.type === "text")

      if (!textContent?.text) {
        return { success: true, data: result }
      }

      // Parse the JSON response from MCP tool
      const parsed = JSON.parse(textContent.text) as Record<string, unknown>
      return { success: true, data: parsed }
    } catch (err: unknown) {
      return this.classifyError(err)
    }
  }

  // --- Login flow helpers ---

  async startLogin(): Promise<ToolCallResult<LoginStartResult>> {
    const result = await this.callTool("login_start", {}, "")
    if (!result.success) return result

    const data = result.data as Record<string, unknown>
    const innerData = (data?.data ?? data) as Record<string, unknown>

    if (!innerData.loginId || !innerData.loginUrl) {
      return { success: false, error: "MCP did not return loginId/loginUrl", code: "UNKNOWN" }
    }

    return {
      success: true,
      data: {
        loginId: innerData.loginId as string,
        loginUrl: innerData.loginUrl as string,
      },
    }
  }

  async pollLoginStatus(loginId: string): Promise<ToolCallResult<LoginStatusResult>> {
    const result = await this.callTool("login_status", { loginId }, "")
    if (!result.success) return result

    const data = result.data as Record<string, unknown>
    const innerData = (data?.data ?? data) as Record<string, unknown>

    return {
      success: true,
      data: {
        status: (innerData.status ?? "pending") as LoginStatusResult["status"],
        ...(innerData.sessionId !== undefined && { sessionId: innerData.sessionId as string }),
        ...(innerData.error !== undefined && { error: innerData.error as string }),
      },
    }
  }

  // --- Error classifier ---

  private classifyError(err: unknown): ToolCallResult {
    const message = err instanceof Error ? err.message : String(err)
    const lower = message.toLowerCase()

    if (lower.includes("unauthorized") || lower.includes("invalid or expired session")) {
      return { success: false, error: message, code: "UNAUTHORIZED" }
    }

    if (lower.includes("validation") || lower.includes("bad request")) {
      return { success: false, error: message, code: "VALIDATION_ERROR" }
    }

    return { success: false, error: message, code: "UNKNOWN" }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------
export const mcpService: IMcpService = new McpService()
