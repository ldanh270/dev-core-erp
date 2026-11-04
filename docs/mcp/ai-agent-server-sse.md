# TÀI LIỆU KỸ THUẬT: HỆ THỐNG TELEGRAM AI AGENT TÍCH HỢP MCP (SSE)

## 1. Tổng quan hệ thống (Architecture Overview)

Hệ thống đóng vai trò là một cầu nối thông minh giữa người dùng cuối (qua Telegram) và hệ thống quản trị nội bộ (qua MCP Server). 

**Các thành phần cốt lõi:**
1. **Telegram Bot UI:** Giao diện tương tác duy nhất của người dùng.
2. **Node.js Agent Service (Lõi xử lý):** Hứng tin nhắn, kiểm tra xác thực, lưu lịch sử, và điều phối logic.
3. **9Router Proxy:** Gateway trung gian để gọi API các mô hình LLM (OpenAI/Anthropic).
4. **MCP Server (SSE):** Backend nội bộ chứa các logic nghiệp vụ (Tools: Xin nghỉ, tra phép, duyệt đơn...) và yêu cầu xác thực qua Bearer Token.
5. **Redis (Memory/Cache):** Lưu trữ Session, Chat History và User Auth Mapping.

---

## 2. Stack Công nghệ Đề xuất (Tech Stack)

* **Runtime:** Node.js (v18+)
* **Framework Bot:** `telegraf`
* **AI/Agent Framework:** `ai` (Vercel AI SDK) hoặc `langchain`
* **MCP Client:** `@modelcontextprotocol/sdk` (sử dụng module SSE)
* **Database/Cache:** Redis (qua thư viện `ioredis`)
* **Môi trường:** Docker, Docker Compose (để đóng gói Node.js và Redis).

---

## 3. Thiết kế Cấu trúc Dữ liệu (State Management)

Bạn cần thiết lập Redis để lưu 2 loại dữ liệu chính nhằm đảm bảo tính phi trạng thái (stateless) cho Node.js server:

**1. User Auth Mapping (Key-Value):**
* `Key`: `user_auth:{telegram_user_id}`
* `Value`: `{"auth_token": "jwt_or_bearer_token", "user_info": {...}}`
* `TTL`: Bằng với thời gian sống của token bên MCP Server.

**2. Chat History (List/Array):**
* `Key`: `chat_history:{telegram_user_id}`
* `Value`: Mảng các tin nhắn theo chuẩn Role (user, assistant, tool).
* `TTL`: 24h (Tự động xóa lịch sử nếu user không chat sau 1 ngày để reset ngữ cảnh).

---

## 4. Hướng dẫn Implement Chi tiết (Từng Phase)

### Phase 1: Xây dựng Middleware Xác thực (Authentication Guard)

Mọi tin nhắn đến từ Telegram phải đi qua một Middleware để kiểm tra xem người dùng đã liên kết tài khoản hệ thống chưa.

* **Bước 1:** `telegraf` nhận sự kiện `bot.on('text')`.
* **Bước 2:** Lấy `ctx.from.id` (Telegram User ID) tra cứu trong Redis (`user_auth:{id}`).
* **Bước 3.1 (Chưa đăng nhập):** Trả về tin nhắn chứa URL đăng nhập:
  `"Vui lòng đăng nhập hệ thống nội bộ để cấp quyền cho trợ lý: https://your-domain.com/login?telegram_id=123456"`
  *(Lưu ý: Trang web Frontend của bạn sau khi login thành công cần gọi một API webhook bắn ngược lại Node.js Service để lưu `auth_token` vào Redis map với `telegram_id` này).*
* **Bước 3.2 (Đã đăng nhập):** Lấy `auth_token` đưa vào `ctx.state.authToken` và gọi `next()` để chuyển sang luồng Agent.

### Phase 2: Tích hợp MCP Client qua SSE (Khởi tạo động)

Không khởi tạo MCP Client ở cấp độ Global. Mỗi yêu cầu của user cần một instance kết nối SSE riêng rẽ (hoặc attach header động) để truyền đúng Token của user đó xuống MCP Server.

* **Khởi tạo Client:** Sử dụng `SSEClientTransport` từ `@modelcontextprotocol/sdk`.
* **Truyền Auth:** Trong cấu hình Transport, thêm headers: `Authorization: Bearer <ctx.state.authToken>`.
* **Khởi tạo kết nối & Lấy danh sách Tools:** Gọi lệnh connect và `client.listTools()`. Convert danh sách tools này sang định dạng mà LLM hiểu được (Vercel AI SDK có hàm convert hoặc bạn tự map sang chuẩn OpenAI function calling).

### Phase 3: Xây dựng Agent Loop với Vercel AI SDK và 9Router

Đây là "bộ não" của hệ thống. Luồng xử lý một tin nhắn từ user đã xác thực:

1. **Nạp lịch sử (Load Context):** Rút 10 tin nhắn gần nhất từ Redis `chat_history:{telegram_user_id}`. Đẩy tin nhắn mới nhất của user vào mảng này.
2. **Cấu hình LLM qua 9Router:**
   * Khởi tạo OpenAI Client: override `baseURL` thành endpoint của 9router.
   * Gắn API Key của 9router.
3. **Định nghĩa System Prompt (Rất quan trọng):**
   Viết một prompt chặt chẽ yêu cầu tính chủ động:
   > *"Bạn là trợ lý nhân sự nội bộ. Khi người dùng yêu cầu nghiệp vụ, hãy kiểm tra danh sách Tools. BẮT BUỘC hỏi lại người dùng để thu thập đủ các tham số mà Tool yêu cầu (ví dụ: ngày nghỉ, người duyệt). Tuyệt đối không tự bịa ra thông tin. Trả lời bằng tiếng Việt, ngắn gọn."*
4. **Thực thi Generate Text (Kèm Tools):**
   * Chạy hàm `generateText` (của AI SDK), truyền vào: System Prompt, Lịch sử Chat, và danh sách Tools lấy từ MCP.
5. **Xử lý Logic Tool Calling (Bên trong Agent Loop):**
   * Nếu LLM quyết định gọi Tool: Bắt sự kiện gọi tool, lấy params do LLM sinh ra -> Gọi `client.callTool({ name, arguments })` tới MCP Server.
   * Nhận kết quả từ MCP Server -> Gửi lại kết quả đó cho LLM để nó tổng hợp câu trả lời cuối cùng.
6. **Trả kết quả & Cập nhật Redis:**
   * Gửi câu trả lời cuối (text) về lại cho user qua Telegram (`ctx.reply()`).
   * Lưu toàn bộ mảng tin nhắn (bao gồm cả lịch sử gọi tool và kết quả tool) đè lên Redis.

---

## 5. Xử lý Lỗi & Cạnh (Edge Cases)

Hệ thống thực tế sẽ gặp các tình huống sau, cần implement code để bọc lỗi (Try/Catch):

1. **Token Hết Hạn (401 Unauthorized từ MCP Server):**
   * Nếu gọi MCP Tool bị lỗi HTTP 401, Node.js phải tự động xóa key Auth trong Redis và nhắn Telegram: *"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại: [Link]"*.
2. **Lỗi Validation từ Tool (400 Bad Request):**
   * MCP Server trả về lỗi (vd: *"Ngày nghỉ không được nằm trong quá khứ"*). Node.js phải bắt lỗi này, đóng gói thành Text và đưa lại vào ngữ cảnh cho LLM: *"Hệ thống báo lỗi: Ngày nghỉ ở quá khứ. Hãy báo user chọn ngày khác"*. LLM sẽ tự biết xin lỗi và hỏi lại user.
3. **Tin nhắn quá dài hoặc user spam:**
   * Áp dụng Rate Limiting ở tầng `telegraf` (chỉ cho phép nhắn 1 tin/giây).
   * Nếu người dùng gửi ảnh/file mà MCP chưa hỗ trợ, cấu hình bot phản hồi: *"Hiện tại tôi chỉ hỗ trợ xử lý tin nhắn văn bản."*
4. **Time-out (LLM hoặc MCP phản hồi chậm):**
   * Khi bắt đầu gọi LLM, gửi một action qua Telegram: `ctx.sendChatAction('typing')`. Nếu quá 15s không có kết quả, ngắt kết nối và báo *"Hệ thống đang bận, xin thử lại sau"*.

---

## 6. Kiến trúc Thư mục Code Tham khảo (Folder Structure)

```text
/src
  /config
    - env.js        # Quản lý biến môi trường (9router key, Redis URL...)
  /services
    - redis.js      # Khởi tạo kết nối Redis, các hàm set/get history
    - mcp.js        # Hàm khởi tạo SSE Client, inject Token, map Tools
    - llm.js        # Setup Vercel AI SDK trỏ về 9router
  /middlewares
    - auth.js       # Kiểm tra Token từ Redis, chặn luồng
  /bot
    - index.js      # Khởi tạo Telegraf bot, setup webhook/polling
    - handler.js    # Logic ghép nối: Nhận tin -> LLM <-> MCP -> Trả tin
  app.js            # Điểm entry chạy ứng dụng & API endpoint (cho frontend callback webhook)