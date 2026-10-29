# Quickstart Guide — DevCore ERP

Onboarding and setup guide for developers (supporting **Node.js/npm/pnpm** and **Bun**).

---

## 1. Prerequisites

* **Runtime:** Node.js v20+ or Bun v1.1+ (either runtime is supported).
* **Package Manager:** `pnpm`, `npm`, `yarn`, or `bun`.
* **Database:** PostgreSQL (Supabase, local PostgreSQL, or Docker container).

---

## 2. Quick Setup (4 Steps)

### Step 1: Copy Environment Configuration (.env)

Open a terminal at the project root and execute:

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
> Open `backend/.env` and configure the following parameters:
> 1. `DATABASE_URL` & `DIRECT_URL`: PostgreSQL connection strings (e.g., Supabase instance).
> 2. `SEED_PASSWORD=Admin123@` (used to generate default credentials during database seeding).

---

### Step 2: Install Dependencies

Use your preferred package manager (`pnpm`, `bun`, or `npm`):

#### Option 1: Using pnpm (or npm)
```bash
# Backend installation
cd backend && pnpm install
# Alternatively: npm install --legacy-peer-deps

# Frontend installation
cd ../frontend && pnpm install
# Alternatively: npm install

cd ..
```

#### Option 2: Using Bun (Fastest)
```bash
cd backend && bun install
cd ../frontend && bun install
cd ..
```

---

### Step 3: Database Setup (Prisma)

Generate the Prisma Client and apply migrations to the database:

**Using Bun:**
```bash
cd backend
bun x prisma generate
bun x prisma migrate deploy
```

**Using npm / npx:**
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

*(Optional) Seed Sample Data:*
```bash
# Seed demonstration data (accounts, departments, projects, attendance)
npm run seed
# Alternatively: bun run seed
```

---

### Step 4: Start Development Servers

The web application consists of two primary services:

#### Terminal 1 — Backend API (Port 5000):
```bash
cd backend
npm run dev
# Alternatively: bun run dev
```

#### Terminal 2 — Frontend Web (Port 5173):
```bash
cd frontend
npm run dev
# Alternatively: bun run dev
```

Access the Web application at: **http://localhost:5173**  
Backend REST API endpoint: **http://localhost:5000**

---

## 3. Default Login Credentials (After Seeding)

* **Admin Account:**
  * **Username:** `admin` (or email: `admin@company.com`)
  * **Password:** Configured via `SEED_PASSWORD` in `backend/.env` (Default: `Admin123@`).

---

## 4. (Optional) Run AI Assistant & Telegram Bot

To run the AI Telegram Assistant and MCP Server locally:
```bash
# Requires Docker Desktop
docker compose up -d --build
```
* MCP Server: `http://localhost:3001`
* Agent Gateway: `http://localhost:3002/health`
* Redis: `localhost:6379`
