import { createOpenAI } from "@ai-sdk/openai"
import type { CoreMessage, CoreTool } from "ai"
import { streamText, tool } from "ai"
import { z } from "zod"

import { env } from "../config/env.js"
import type { McpToolDefinition } from "./mcp.service.js"

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Bạn là trợ lý AI nội bộ DevCore ERP thông minh và chủ động.

Quy tắc BẮTBUỘC:
1. Khi người dùng yêu cầu nghiệp vụ (xin nghỉ phép, xem lịch, tra phiếu lương...): kiểm tra Tools và gọi tool phù hợp.
2. Nếu tool cần tham số mà người dùng chưa cung cấp: HỎI LẠI từng tham số một, không tự đặt giá trị.
3. TUYỆT ĐỐI không bịa thông tin (ngày, tên, mã nhân viên...).
4. Khi tool trả về lỗi: giải thích ngắn gọn, hỏi người dùng thông tin khác.
5. Trả lời NGẮN GỌN, súc tích bằng tiếng Việt.
6. KHÔNG bao giờ hỏi người dùng về sessionId — bạn tự quản lý nó.
7. Khi dùng tool "login_start" hoặc "login_status": đây là quá trình đăng nhập, hướng dẫn người dùng bước tiếp theo.

Phong cách: Thân thiện, chuyên nghiệp, như một nhân viên HR giỏi.`

// ---------------------------------------------------------------------------
// 9Router provider (OpenAI-compatible API)
// ---------------------------------------------------------------------------
const nineRouter = createOpenAI({
  name: "9router",
  baseURL: env.NINE_ROUTER_BASE_URL,
  apiKey: env.NINE_ROUTER_API_KEY,
})

// ---------------------------------------------------------------------------
// MCP Tool → AI SDK Tool converter
// ---------------------------------------------------------------------------

/**
 * Converts MCP tool definitions to Vercel AI SDK CoreTool format.
 * Dynamically builds Zod schemas from MCP input schemas.
 */
export function convertMcpToolsToAiSdk(
  mcpTools: McpToolDefinition[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Record<string, CoreTool> {
  const aiTools: Record<string, CoreTool> = {}

  for (const mcpTool of mcpTools) {
    // Build a dynamic Zod schema from MCP inputSchema.properties
    const properties = mcpTool.inputSchema.properties ?? {}
    const required = mcpTool.inputSchema.required ?? []

    const schemaShape: Record<string, z.ZodTypeAny> = {}

    for (const [key, propDef] of Object.entries(properties)) {
      // Skip sessionId — the gateway injects it automatically
      if (key === "sessionId") continue

      const prop = propDef as Record<string, unknown>
      const description = (prop.description as string | undefined) ?? key
      let zodType = zodFromJsonSchema(prop, description)

      // Make optional if not in required list
      schemaShape[key] = required.includes(key) ? zodType : zodType.optional()
    }

    aiTools[mcpTool.name] = tool({
      description: mcpTool.description ?? mcpTool.name,
      parameters: z.object(schemaShape),
      execute: async (args) => {
        return onToolCall(mcpTool.name, args as Record<string, unknown>)
      },
    })
  }

  return aiTools
}

function zodFromJsonSchema(schema: Record<string, unknown>, fallbackDescription: string): z.ZodTypeAny {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const values = schema.enum.filter((value): value is string => typeof value === "string")
    if (values.length === schema.enum.length) return z.enum(values as [string, ...string[]]).describe(fallbackDescription)
  }

  if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
    const variants = (schema.oneOf ?? schema.anyOf) as Array<Record<string, unknown>>
    const parsed = variants.map((variant) => zodFromJsonSchema(variant, fallbackDescription))
    if (parsed.length > 1) return z.union(parsed as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
    if (parsed.length === 1) return parsed[0]
  }

  let result: z.ZodTypeAny
  switch (schema.type) {
    case "number":
    case "integer": {
      let number = z.number()
      if (typeof schema.minimum === "number") number = number.min(schema.minimum)
      if (typeof schema.maximum === "number") number = number.max(schema.maximum)
      result = number
      break
    }
    case "boolean":
      result = z.boolean()
      break
    case "array": {
      const itemSchema = (schema.items as Record<string, unknown> | undefined) ?? {}
      let array = z.array(zodFromJsonSchema(itemSchema, fallbackDescription))
      if (typeof schema.minItems === "number") array = array.min(schema.minItems)
      if (typeof schema.maxItems === "number") array = array.max(schema.maxItems)
      result = array
      break
    }
    case "object": {
      const childProperties = (schema.properties as Record<string, unknown> | undefined) ?? {}
      const childRequired = new Set(Array.isArray(schema.required) ? schema.required.filter((value): value is string => typeof value === "string") : [])
      const shape: Record<string, z.ZodTypeAny> = {}
      for (const [childKey, childSchema] of Object.entries(childProperties)) {
        const child = zodFromJsonSchema(childSchema as Record<string, unknown>, childKey)
        shape[childKey] = childRequired.has(childKey) ? child : child.optional()
      }
      result = z.object(shape)
      break
    }
    default:
      result = z.string()
  }

  if (typeof schema.minLength === "number" && result instanceof z.ZodString) result = result.min(schema.minLength)
  if (typeof schema.maxLength === "number" && result instanceof z.ZodString) result = result.max(schema.maxLength)
  return result.describe(fallbackDescription)
}

// ---------------------------------------------------------------------------
// Generate Agent Response
// ---------------------------------------------------------------------------
export interface GenerateOptions {
  history: CoreMessage[]
  tools: Record<string, CoreTool>
  abortSignal?: AbortSignal
}

export interface GenerateResult {
  text: string
  messages: CoreMessage[]
}

/**
 * Run the AI agent loop with tool calling support.
 * Uses maxSteps to allow multi-turn tool use (LLM → tool → LLM → tool → ...).
 */
export async function generateAgentResponse(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { history, tools, abortSignal } = options

  // The local OpenAI-compatible proxy always responds using SSE, including
  // tool-call responses. `streamText` uses the provider's streaming parser;
  // `generateText` expects a JSON body and fails on `data: ...` chunks.
  const result = streamText({
    model: nineRouter(env.NINE_ROUTER_MODEL),
    system: SYSTEM_PROMPT,
    messages: history,
    tools,
    maxSteps: 5,
    // Only spread abortSignal if defined — required by exactOptionalPropertyTypes
    ...(abortSignal !== undefined && { abortSignal }),
  })

  // AI SDK v4: result.response.messages contains all messages from the run
  // (tool calls, tool results, and assistant turns)
  // `streamText` is lazy. Consume the stream so tool calls and follow-up
  // generations complete before reading its aggregate result promises.
  await result.consumeStream()

  const [text, response] = await Promise.all([result.text, result.response])
  const responseMessages = response.messages as CoreMessage[]

  return {
    text,
    messages: responseMessages,
  }
}
