# Agent Gateway — Telegram AI Agent tích hợp MCP (SSE)

## Tổng quan

Xây dựng service `agent-gateway/` là một Telegram Bot thông minh đóng vai trò AI Agent trung gian giữa người dùng Telegram và hệ thống DevCore ERP nội bộ (qua MCP Server). Agent dùng Vercel AI SDK để orchestrate LLM + MCP tool calling, Redis để persist session/chat history, và Docker Compose để deploy cùng với MCP Server.

---

## Phân tích Auth Strategy cho MCP Server

> [!IMPORTANT]
> MCP Server hiện tại **KHÔNG dùng Bearer Token header** mà dùng **sessionId as tool parameter**. Mỗi tool đều nhận `sessionId` làm argument và call `requireSession(sessionId)` để validate.

### So sánh 3 phương án

| | **Option A: sessionId via tool param** | **Option B: Thêm Bearer Token header** | **Option C: Login flow chuẩn** |
|---|---|---|---|
| **Cơ chế** | Gateway lưu `sessionId` trong Redis, truyền vào mỗi MCP tool call | Sửa MCP Server để validate `Authorization` header trên SSEServerTransport | Dùng `login_start` → `login_status` flow, Gateway poll đến khi user login xong |
| **Ưu điểm** | Không sửa MCP Server. Align với thiết kế hiện tại. Session isolation tự nhiên (mỗi user dùng sessionId riêng). Triển khai nhanh | Cleaner architecture về lý thuyết. Token tự validate ở transport layer | Dùng đúng `login_start`/`login_status` built-in tools. Zero-code MCP change |
| **Nhược điểm** | Gateway cần biết format `sessionId` của MCP. Mỗi tool call phải inject sessionId vào arguments | Phải sửa MCP Server SSE transport layer (breaking change). Phức tạp hơn | Gateway phải tổ chức polling loop ngay trong Telegram flow. UX phức tạp (user mở browser, poll đến khi xong) |
| **Sửa MCP?** | Không | Cần sửa | Không |
| **Đánh giá** | Phù hợp nhất với kiến trúc hiện tại | Tốt nhưng vượt quá phạm vi cần thiết | Sử dụng được nhưng trải nghiệm người dùng phức tạp |

### Quyết định kiến trúc: Kết hợp Option A + Option C (Hybrid)

**Lý do:** MCP đã có sẵn `login_start` / `login_status` tools → tận dụng hoàn toàn, không sửa MCP Server. Gateway dùng Telegram như UI cho browser-based login:

1. User nhắn tin lần đầu → Gateway check Redis → không có `sessionId`
2. Gateway gọi MCP tool `login_start` → nhận `loginUrl` 
3. Gateway gửi `loginUrl` cho user qua Telegram
4. Gateway background-poll MCP tool `login_status` (max 5 phút, 5s/lần)
5. Khi login thành công → lưu `sessionId` vào Redis với TTL 8h
6. Từ đây mọi tool call tự động inject `sessionId` vào arguments

---

## Open Questions (Đã giải quyết)

- **Auth**: Hybrid Option A+C (sessionId via tool param + browser login flow)
- **LLM**: Cả hai — 9Router routing động, config linh hoạt (primary: OpenAI-compatible API)
- **Deploy**: Docker Compose cùng MCP Server
- **Redis**: Setup mới trong Docker Compose (thêm Redis container)

---

## Proposed Changes

### Component 1: `agent-gateway/` — New Package

---

#### [NEW] `agent-gateway/package.json`
Package config với workspace integration. Dependencies:
- `telegraf` — Telegram bot framework
- `ai` (Vercel AI SDK) — LLM orchestration + tool calling
- `@ai-sdk/openai` — OpenAI provider (compatible với 9Router baseURL override)
- `@modelcontextprotocol/sdk` — MCP SSE client
- `ioredis` — Redis client
- `zod` — Validation
- `dotenv`, `tsx`, `typescript` — Dev tooling

---

#### [NEW] `agent-gateway/src/config/env.ts`
Typed env wrapper với fail-fast validation (dùng Zod):
```typescript
interface Env {
  TELEGRAM_BOT_TOKEN: string        // Bot token từ BotFather
  NINE_ROUTER_BASE_URL: string      // 9Router API endpoint
  NINE_ROUTER_API_KEY: string       // 9Router API key
  NINE_ROUTER_MODEL: string         // Default: "openai/gpt-4o-mini"
  MCP_SSE_URL: string               // MCP Server SSE URL (http://mcp:3001/mcp/sse)
  MCP_MESSAGE_URL: string           // MCP Message URL (http://mcp:3001/mcp/message)
  REDIS_URL: string                 // Redis URL (redis://redis:6379)
  WEBHOOK_PORT?: number             // Port for webhook mode (optional)
  NODE_ENV: "development" | "production"
}
```

---

#### [NEW] `agent-gateway/src/services/redis.service.ts`
Redis service với typed methods:
```typescript
// Key schemas:
// session:{telegramUserId}      → { sessionId: string, expiresAt: number } (TTL: 8h)
// history:{telegramUserId}      → ChatMessage[] (TTL: 24h)
// login_poll:{telegramUserId}   → loginId string (TTL: 5m, dùng khi đang chờ login)
// rate_limit:{telegramUserId}   → counter (TTL: 1s)

interface IRedisService {
  getSession(userId: string): Promise<SessionData | null>
  setSession(userId: string, sessionId: string, ttlSeconds: number): Promise<void>
  deleteSession(userId: string): Promise<void>
  getHistory(userId: string): Promise<CoreMessage[]>
  appendHistory(userId: string, messages: CoreMessage[]): Promise<void>
  clearHistory(userId: string): Promise<void>
  getPendingLogin(userId: string): Promise<string | null>
  setPendingLogin(userId: string, loginId: string): Promise<void>
  deletePendingLogin(userId: string): Promise<void>
  checkRateLimit(userId: string): Promise<boolean>    // true = allowed
}
```

---

#### [NEW] `agent-gateway/src/services/mcp.service.ts`
MCP Client factory + tool injection layer:

**Core design:** Khởi tạo 1 SSE connection dùng chung (singleton per user session sẽ quá tốn kém). Thay vào đó dùng **HTTP transport** với `SSEClientTransport` cho mỗi request, nhưng implement connection pooling đơn giản.

```typescript
interface IMcpService {
  // Lấy danh sách tools cho LLM (cached 5 phút)
  getTools(): Promise<Tool[]>
  
  // Call một tool MCP, auto-inject sessionId vào args
  callTool(name: string, args: Record<string, unknown>, sessionId: string): Promise<unknown>
  
  // Login flow helpers
  startLogin(): Promise<{ loginId: string; loginUrl: string }>
  pollLoginStatus(loginId: string): Promise<{ status: 'pending' | 'completed' | 'failed'; sessionId?: string }>
}
```

**Về sessionId injection:** Gateway wrap tất cả tool calls để auto-inject `sessionId` vào arguments, trừ `login_start` và `login_status` (không cần session). Dùng tools schema từ `client.listTools()` để biết tool nào yêu cầu `sessionId`.

---

#### [NEW] `agent-gateway/src/services/llm.service.ts`
Vercel AI SDK setup trỏ về 9Router:

```typescript
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, CoreMessage, tool } from "ai"

// 9Router dùng OpenAI-compatible API
const nineRouter = createOpenAI({
  baseURL: env.NINE_ROUTER_BASE_URL,
  apiKey: env.NINE_ROUTER_API_KEY,
})

const SYSTEM_PROMPT = `Bạn là trợ lý nhân sự và vận hành nội bộ DevCore ERP thông minh và chủ động.
Khi người dùng yêu cầu nghiệp vụ (xin nghỉ phép, xem lịch, tra phiếu lương, v.v.):
1. Kiểm tra danh sách Tools có sẵn
2. BẮT BUỘC hỏi lại người dùng để thu thập ĐỦ các tham số tool yêu cầu
3. Tuyệt đối KHÔNG tự bịa thông tin
4. Trả lời NGẮN GỌN bằng tiếng Việt
5. Khi tool trả lỗi, giải thích ngắn gọn và hỏi user thông tin khác

Bạn CÓ sessionId của user — đừng bao giờ hỏi user về sessionId.`
```

---

#### [NEW] `agent-gateway/src/middlewares/auth.middleware.ts`
Telegraf middleware kiểm tra session:

```typescript
// Luồng:
// 1. Nhận text message → lấy userId
// 2. Check Redis session → có? → ctx.state.sessionId = sessionId, next()
// 3. Không có? → Check pending login trong Redis
//    - Có pending → "Đang chờ bạn đăng nhập... [loginUrl]" 
//    - Không có? → Gọi MCP login_start → lưu loginId vào Redis → gửi loginUrl
// 4. Background poll login_status → khi done → lưu sessionId Redis → thông báo user
```

---

#### [NEW] `agent-gateway/src/bot/handler.ts`
Agent Loop — bộ não chính:

```typescript
// Luồng xử lý 1 tin nhắn (đã auth):
// 1. Load 10 messages từ Redis history
// 2. Append user message
// 3. Lấy MCP tools list (cached)
// 4. generateText với:
//    - model: nineRouter(env.NINE_ROUTER_MODEL)
//    - system: SYSTEM_PROMPT
//    - messages: history
//    - tools: mcpTools (converted sang AI SDK format)
//    - maxSteps: 5 (auto agent loop)
//    - onStepFinish: callback để xử lý tool calls
// 5. Trong tool execution callback:
//    - callTool(name, args, sessionId) → forward đến MCP
//    - Nếu UnauthorizedError → clear Redis session → thông báo user login lại
// 6. Gửi final text response qua ctx.reply()
// 7. Append full message history vào Redis
```

---

#### [NEW] `agent-gateway/src/bot/index.ts`
Telegraf bot setup:

```typescript
// - Khởi tạo Telegraf bot
// - Register middlewares: rateLimiter, authMiddleware
// - bot.on("text") → authMiddleware → agentHandler
// - bot.on("photo", "document", ...) → reply "Chỉ hỗ trợ văn bản"
// - bot.command("start") → welcome message + login
// - bot.command("logout") → xóa Redis session + history
// - bot.command("clear") → xóa chat history
// - Polling (dev) hoặc Webhook (prod)
```

---

#### [NEW] `agent-gateway/src/app.ts`
Entry point:
```typescript
// 1. Load env (fail-fast Zod validation)
// 2. Init Redis connection
// 3. Init MCP service (verify SSE connectivity)
// 4. Start Telegram bot
// 5. Express server nhỏ cho health check: GET /health
```

---

#### [NEW] `agent-gateway/.env.example`
```env
TELEGRAM_BOT_TOKEN=123456:ABC...
NINE_ROUTER_BASE_URL=https://router.9router.com/v1
NINE_ROUTER_API_KEY=sk-...
NINE_ROUTER_MODEL=openai/gpt-4o-mini
MCP_SSE_URL=http://mcp:3001/mcp/sse
MCP_MESSAGE_URL=http://mcp:3001/mcp/message
REDIS_URL=redis://redis:6379
NODE_ENV=development
```

---

### Component 2: Docker Compose Integration

---

#### [NEW] `agent-gateway/Dockerfile`
Multi-stage build:
```dockerfile
FROM node:20-alpine AS builder
# Install pnpm, copy source, build TypeScript

FROM node:20-alpine AS runner  
# Copy dist, node_modules production
# CMD ["node", "dist/app.js"]
```

---

#### [MODIFY] Root `docker-compose.yml` (hoặc tạo mới nếu chưa có)
Thêm services:
```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  mcp:
    build: ./mcp-server
    restart: unless-stopped
    env_file: ./mcp-server/.env
    ports:
      - "3001:3001"
    depends_on:
      - redis

  agent-gateway:
    build: ./agent-gateway
    restart: unless-stopped
    env_file: ./agent-gateway/.env
    depends_on:
      - redis
      - mcp

volumes:
  redis_data:
```

---

### Component 3: Root Workspace Integration

---

#### [MODIFY] Root `package.json`
Thêm scripts:
```json
"dev:gateway": "cd agent-gateway && nr dev",
"i:gateway": "cd agent-gateway && ni",
"dev:full": "concurrently \"nr dev:backend\" \"nr dev:mcp\" \"nr dev:gateway\""
```

---

#### [MODIFY] `pnpm-workspace.yaml`
Thêm `agent-gateway` vào workspace packages.

---

## Kiến trúc Thư mục Cuối cùng

```
agent-gateway/
├── src/
│   ├── config/
│   │   └── env.ts              # Typed env với Zod validation
│   ├── services/
│   │   ├── redis.service.ts    # Redis CRUD: session, history, rate-limit
│   │   ├── mcp.service.ts      # MCP SSE client + sessionId injection
│   │   └── llm.service.ts      # Vercel AI SDK + 9Router setup
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # Session check + browser login flow
│   │   └── rate-limit.middleware.ts  # 1 msg/s per user
│   ├── bot/
│   │   ├── index.ts            # Telegraf setup + commands
│   │   └── handler.ts          # Agent loop (AI SDK generateText)
│   └── app.ts                  # Entry point
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## TypeScript Type Safety Strategy

Dùng advanced types cho MCP tool integration:

```typescript
// Discriminated union cho tool call result
type ToolResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: "UNAUTHORIZED" | "VALIDATION_ERROR" | "UNKNOWN" }

// Mapped type để auto-inject sessionId vào tool arguments
type WithSession<T extends Record<string, unknown>> = T & { sessionId: string }

// Infer MCP tool types từ schema
type McpToolInput<T extends z.ZodSchema> = z.infer<T>
```

---

## Error Handling Map

| Error | Nguồn gốc | Xử lý |
|-------|-----------|-------|
| Session expired (`UnauthorizedError`) | MCP `requireSession()` | Xóa Redis session → gửi link login lại |
| Login timeout (5 phút) | Poll loop | Xóa pending login → thông báo user thử lại |
| LLM timeout (>15s) | 9Router | AbortSignal timeout → "Hệ thống bận, thử lại" |
| Tool validation error (400) | MCP tools | Đưa error message vào LLM context → LLM hỏi lại user |
| Rate limit | Redis counter | Reply "Vui lòng chờ 1 giây" |
| Media/file message | Telegram | Reply "Chỉ hỗ trợ văn bản" |
| MCP SSE disconnect | Network | Reconnect với exponential backoff |

---

## Verification Plan

### Automated Tests
```bash
# Unit tests (Vitest)
cd agent-gateway && nr test

# Test auth flow mock
# Test Redis service methods
# Test sessionId injection logic
```

### Manual Verification
1. Chạy `docker compose up redis mcp agent-gateway`
2. Nhắn `/start` → bot gửi welcome + login URL
3. Mở login URL → đăng nhập → bot confirm trong Telegram
4. Nhắn "Cho tôi xem lịch làm việc tuần này" → bot gọi MCP tools → trả kết quả
5. Nhắn "Tôi muốn xin nghỉ phép" → bot hỏi đủ params → gửi request
6. Nhắn `/logout` → session bị xóa → nhắn lại phải login lại
7. Test timeout: tắt MCP server → xem bot handle gracefully

---

## Implementation Phases

| Phase | Nội dung | Files | Ước tính |
|-------|----------|-------|----------|
| **P1** | Scaffold + config | `package.json`, `env.ts`, `tsconfig.json`, `.env.example` | 30m |
| **P2** | Redis service | `redis.service.ts` | 45m |
| **P3** | MCP service + login flow | `mcp.service.ts` | 1.5h |
| **P4** | LLM service + system prompt | `llm.service.ts` | 30m |
| **P5** | Auth middleware | `auth.middleware.ts`, `rate-limit.middleware.ts` | 45m |
| **P6** | Bot + Agent handler | `bot/index.ts`, `bot/handler.ts`, `app.ts` | 1.5h |
| **P7** | Docker + workspace | `Dockerfile`, `docker-compose.yml` updates | 30m |
| **P8** | Testing + polish | Error handling, edge cases | 1h |
