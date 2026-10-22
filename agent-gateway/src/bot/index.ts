import { Telegraf } from "telegraf"

import { env } from "../config/env.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { rateLimitMiddleware } from "../middlewares/rate-limit.middleware.js"
import { redisService } from "../services/redis.service.js"
import { handleAgentMessage } from "./handler.js"

// ---------------------------------------------------------------------------
// Bot factory
// ---------------------------------------------------------------------------
export function createBot(): Telegraf {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN)

  // ----- Global middlewares (order matters) -----
  bot.use(rateLimitMiddleware)

  // ----- Commands (no auth required) -----

  bot.command("start", async (ctx) => {
    const name = ctx.from.first_name ?? "bạn"
    await ctx.reply(
      `👋 Xin chào ${name}! Tôi là trợ lý AI DevCore ERP.\n\n` +
        `Tôi có thể giúp bạn:\n` +
        `• 📅 Xem lịch làm việc\n` +
        `• 🏖 Nộp đơn xin nghỉ phép\n` +
        `• 💰 Tra cứu phiếu lương\n` +
        `• 📋 Quản lý dự án và nhiệm vụ\n\n` +
        `Hãy nhắn tin để bắt đầu — tôi sẽ hướng dẫn bạn đăng nhập nếu cần.`,
    )
  })

  bot.command("logout", authMiddleware, async (ctx) => {
    const userId = String(ctx.from.id)
    await redisService.deleteSession(userId)
    await redisService.clearHistory(userId)
    await ctx.reply(
      "👋 Đã đăng xuất thành công. Lịch sử trò chuyện đã được xóa.\n" +
        "Nhắn tin bất kỳ để đăng nhập lại.",
    )
  })

  bot.command("clear", authMiddleware, async (ctx) => {
    const userId = String(ctx.from.id)
    await redisService.clearHistory(userId)
    await ctx.reply("🗑 Lịch sử trò chuyện đã được xóa. Bắt đầu cuộc hội thoại mới!")
  })

  bot.command("help", async (ctx) => {
    await ctx.reply(
      `📖 Hướng dẫn sử dụng:\n\n` +
        `/start — Giới thiệu và bắt đầu\n` +
        `/logout — Đăng xuất khỏi hệ thống\n` +
        `/clear — Xóa lịch sử trò chuyện\n` +
        `/help — Hiển thị hướng dẫn này\n\n` +
        `Để sử dụng nghiệp vụ, chỉ cần nhắn tin tự nhiên, ví dụ:\n` +
        `"Tôi muốn xin nghỉ phép ngày mai"`,
    )
  })

  // ----- Text messages (requires auth) -----
  bot.on("text", authMiddleware, handleAgentMessage)

  // ----- Non-text media: reject gracefully -----
  const UNSUPPORTED_TYPES = ["photo", "document", "video", "audio", "voice", "sticker"] as const
  for (const type of UNSUPPORTED_TYPES) {
    bot.on(type as "photo", async (ctx) => {
      await ctx.reply("📝 Hiện tại tôi chỉ hỗ trợ xử lý tin nhắn văn bản.")
    })
  }

  // ----- Global error handler -----
  bot.catch((err, ctx) => {
    console.error(`[Bot] Unhandled error for update ${ctx.updateType}:`, err)
  })

  return bot
}
