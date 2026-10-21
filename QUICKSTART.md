# 🚀 Quickstart Guide — DevCore ERP

Hướng dẫn thiết lập và chạy dự án cho người mới (hỗ trợ cả **Node.js/npm/pnpm** và **Bun**).

---

## 1. Yêu cầu hệ thống (Prerequisites)

* **Runtime:** Node.js v20+ **hoặc** Bun v1.1+ (chọn 1 trong 2, cái nào cũng chạy được).
* **Package Manager:** `pnpm`, `npm`, `yarn` hoặc `bun`.
* **Database:** PostgreSQL (khuyến nghị dùng Supabase hoặc PostgreSQL local / Docker).

---

## 2. Các bước khởi chạy nhanh (4 Bước)

### Bước 1: Sao chép file cấu hình môi trường (.env)

Mở terminal tại thư mục gốc của dự án và chạy:

**Windows (PowerShell):**
```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
Copy-Item mcp-server/.env.example mcp-server/.env
Copy-Item agent-gateway/.env.example agent-gateway/.env
```

**macOS / Linux / Git Bash:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mcp-server/.env.example mcp-server/.env
cp agent-gateway/.env.example agent-gateway/.env
```

> [!IMPORTANT]
> Mở file `backend/.env` và cập nhật tối thiểu:
> 1. `DATABASE_URL` & `DIRECT_URL`: Chuỗi kết nối PostgreSQL (ví dụ Supabase).
> 2. `SEED_CORE_ACCOUNTS_PASSWORD=Admin@123456` (dùng để tạo mật khẩu admin bootstrap/seed).
> 3. `SEED_EMPLOYEE_PASSWORD=Employee@123456`

---

### Bước 2: Cài đặt Dependencies

Dùng thẳng package manager bạn quen thuộc (`pnpm`, `bun`, hoặc `npm`), không cần cài thêm tool gì khác:

#### Cách 1: Dùng pnpm (hoặc npm)
```bash
# Cài backend
cd backend && pnpm install
# hoặc: npm install --legacy-peer-deps

# Cài frontend
cd ../frontend && pnpm install
# hoặc: npm install

cd ..
```

#### Cách 2: Dùng Bun (Nhanh nhất)
```bash
cd backend && bun install
cd ../frontend && bun install
cd ..
```

---

### Bước 3: Chuẩn bị Cơ sở dữ liệu (Prisma)

Tạo Prisma Client và deploy schema vào Database:

**Nếu dùng Bun:**
```bash
cd backend
bun x prisma generate
bun x prisma migrate deploy
```

**Nếu dùng npm / npx:**
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

*(Tùy chọn) Nạp dữ liệu mẫu (Seed Data):*
```bash
# Seed dữ liệu demo (tài khoản, dự án, chấm công...)
npm run seed
# hoặc: bun run seed
```

---

### Bước 4: Chạy Development Server

Dự án gồm 2 phần chính phục vụ giao diện Web ERP:

#### Mở Terminal 1 — Chạy Backend (Port 5000):
```bash
cd backend
npm run dev
# hoặc: bun run dev
```

#### Mở Terminal 2 — Chạy Frontend Web (Port 5173):
```bash
cd frontend
npm run dev
# hoặc: bun run dev
```

Truy cập web tại: **http://localhost:5173**  
API Backend tại: **http://localhost:5000**

---

## 3. Tài khoản đăng nhập mặc định (Sau khi Seed / Bootstrap)

* **Tài khoản Admin:**
  * **Username:** `admin` (hoặc email: `admin@company.com`)
  * **Password:** Giá trị cấu hình tại `SEED_CORE_ACCOUNTS_PASSWORD` trong `backend/.env` (Mặc định gợi ý: `Admin@123456`).

---

## 4. (Tùy chọn) Chạy AI Assistant & Telegram Bot

Nếu bạn cần phát triển thêm tính năng AI Telegram Bot / MCP Server:
```bash
# Yêu cầu cài Docker Desktop
docker compose up -d --build
```
* MCP Server: `http://localhost:3001`
* Agent Gateway: `http://localhost:3002/health`
* Redis: `localhost:6379`
