import type { Context, MiddlewareFn } from "telegraf"

import { mcpService } from "../services/mcp.service.js"
import { redisService } from "../services/redis.service.js"

// ---------------------------------------------------------------------------
// Poll login_status until completed/failed/timeout
// ---------------------------------------------------------------------------
const LOGIN_POLL_INTERVAL_MS = 5_000   // Check every 5 seconds
const LOGIN_POLL_MAX_MS = 5 * 60_000  // Give up after 5 minutes

async function pollLoginCompletion(
  loginId: string,
  userId: string,
  notifyUser: (text: string) => Promise<void>,
): Promise<void> {
  const deadline = Date.now() + LOGIN_POLL_MAX_MS

  const poll = (): Promise<void> =>
    new Promise((resolve) => {
      const timer = setInterval(async () => {
        // Stop if deadline exceeded
        if (Date.now() > deadline) {
          clearInterval(timer)
          await redisService.deletePendingLogin(userId)
          await notifyUser(
            "⏰ Hết thời gian đăng nhập. Nhắn bất kỳ tin nhắn nào để thử lại.",
          )
          resolve()
          return
        }

        const result = await mcpService.pollLoginStatus(loginId)

        if (!result.success) {
          clearInterval(timer)
          await redisService.deletePendingLogin(userId)
          await notifyUser("❌ Lỗi kiểm tra trạng thái đăng nhập. Vui lòng thử lại.")
          resolve()
          return
        }

        const { status, sessionId } = result.data

        if (status === "pending") return // Keep polling

        clearInterval(timer)
        await redisService.deletePendingLogin(userId)

        if (status === "completed" && sessionId) {
          await redisService.setSession(userId, sessionId)
          await notifyUser(
            "✅ Đăng nhập thành công! Bạn có thể bắt đầu sử dụng trợ lý ngay bây giờ.",
          )
        } else {
          // status === "failed"
          await notifyUser(
            "❌ Đăng nhập thất bại. Vui lòng nhắn tin để thử lại.",
          )
        }

        resolve()
      }, LOGIN_POLL_INTERVAL_MS)
    })

  return poll()
}

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------

/**
 * Attaches `ctx.state.sessionId` if the user has an active session.
 * If not, triggers the browser-based login flow via MCP `login_start`.
 */
export const authMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = String(ctx.from?.id)
  if (!userId) {
    await ctx.reply("Không thể xác định người dùng.")
    return
  }

  // 1. Check existing session
  const session = await redisService.getSession(userId)
  if (session) {
    // Attach to context state for downstream handlers
    ctx.state.sessionId = session.sessionId
    return next()
  }

  // 2. Check if already in login flow
  const pendingLoginId = await redisService.getPendingLogin(userId)
  if (pendingLoginId) {
    await ctx.reply(
      "🔄 Bạn đang trong quá trình đăng nhập. Vui lòng hoàn tất trên trình duyệt.",
    )
    return
  }

  // 3. Start new login flow
  await ctx.reply("🔐 Bạn chưa đăng nhập. Đang khởi tạo liên kết đăng nhập...")

  const loginResult = await mcpService.startLogin()

  if (!loginResult.success) {
    await ctx.reply(
      `❌ Không thể tạo liên kết đăng nhập: ${loginResult.error}\nVui lòng thử lại sau.`,
    )
    return
  }

  const { loginId, loginUrl } = loginResult.data

  await redisService.setPendingLogin(userId, loginId)
  await ctx.reply(
    `🌐 Vui lòng mở liên kết sau để đăng nhập vào hệ thống DevCore ERP:\n\n${loginUrl}\n\n⏳ Liên kết hết hạn sau 5 phút.`,
    { parse_mode: "HTML" },
  )

  // 4. Background poll — do NOT await (non-blocking)
  pollLoginCompletion(loginId, userId, async (text) => {
    await ctx.telegram.sendMessage(ctx.from!.id, text)
  }).catch((err: unknown) => {
    console.error("[Auth] Poll error:", err)
  })

  // Do NOT call next() — user must login first
}
