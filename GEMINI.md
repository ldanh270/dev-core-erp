# GEMINI.md — DevCore ERP (SWP391 Project)

This document provides technical context, architecture overview, and development guidelines for the **DevCore ERP** project.

## Project Overview

**DevCore ERP** (Web-Based Enterprise Resource Planning System for IT Outsourcing Companies) — Hệ thống hoạch định nguồn lực doanh nghiệp dựa trên nền tảng web, thiết kế chuyên biệt cho các công ty IT Outsourcing. Tích hợp quản lý nhân sự, dự án & công việc, chấm công, tính lương, tuyển dụng và trợ lý AI trên một nền tảng fullstack TypeScript thống nhất.

### Tech Stack

- **Runtime:** [Bun](https://bun.sh/) (Primary runtime and package manager)
- **Backend:** Node.js with [Express 5](https://expressjs.com/) (using `@types/express` for Type Safety)
- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (configured via root Prettier plugin)
- **Database:** TBD (Structure suggests a Repository pattern, likely SQL-based)

## Directory Structure

```text
.
├── backend/            # Express server (TS + Bun)
│   ├── src/
│   │   ├── configs/    # Centralized configurations grouped by feature:
│   │   │   ├── entities/ # Domain enums (employee, attendance, payroll, etc.)
│   │   │   ├── auth/     # Security and token configurations
│   │   │   ├── system/   # Server, HTTP, and Cloudinary configurations
│   │   │   ├── rules/    # Workflow and approval rules
│   │   ├── controller/ # Request handlers
│   │   ├── lib/        # Shared libraries (DB connection, etc.)
│   │   ├── middleware/ # Express middlewares
│   │   ├── repository/ # Data access layer
│   │   ├── route/      # API route definitions
│   │   ├── service/    # Business logic layer
│   │   └── util/       # Helper functions
├── frontend/           # React application (Vite)
│   ├── src/
│   │   ├── assets/     # Static assets
│   │   └── ...         # Standard React structure
├── AGENTS.md           # Sub-agent specialized instructions
├── CLAUDE.md           # Engineering principles and coding standards
└── GEMINI.md           # This file (Project context for AI)
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed locally.

### Installation

```bash
# Install dependencies for both parts
cd backend && bun install
cd ../frontend && bun install
```

### Running Development Servers

```bash
# Backend
cd backend && bun run dev

# Frontend
cd frontend && bun run dev
```

## Development Guidelines

### Coding Standards

- **S.O.L.I.D. Principles:** Strictly enforced. Full reference: [`docs/solid-principles.md`](docs/solid-principles.md)
- **Design Patterns:** Factory, Strategy, Decorator, Repository, Facade, Observer. Full reference: [`docs/design-patterns.md`](docs/design-patterns.md)
- **Interface Contracts:** All interfaces defined before implementation. Full reference: [`docs/interface-contracts.md`](docs/interface-contracts.md)
- **Agent Directives:** Mandatory per-layer rules (route/controller/service/repository). Full reference: [`docs/agent-directives.md`](docs/agent-directives.md)
- **Type Safety:** No `any`. Interfaces for every service and repository. DTOs for all inputs.
- **Naming Conventions:**
  - Variables: `camelCase`
  - Functions: `verbNoun` (e.g., `fetchUser`)
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Interfaces: `I` prefix (e.g., `IAuthRepository`)

### Backend Architecture

```
Route (concrete wiring only)
  → Controller (HTTP adapter, depends on IService)
  → Service (business logic, depends on IRepository)
  → Repository (DB queries, implements IRepository)
```

- **Controllers:** HTTP in/out only. No business logic, no SQL, no hashing.
- **Services:** Business logic only. Depend on `IRepository` interface, not concrete class.
- **Repositories:** SQL only. Parameterized queries always. Implement `I*Repository` interface.
- **Dependencies:** Constructor injection everywhere. Route file is the only place with `new ConcreteClass()`.
- **Errors:** Throw `AppError(message, statusCode, layer)` — never raw strings.
- **Utils:** Pure functions only. `jwt.util.ts` (sign/verify), `hash.util.ts` (bcrypt).

### Frontend Architecture

- **React 19:** React Compiler enabled (`babel-plugin-react-compiler`).
- **Component hierarchy:** Page → Feature → UI Component → Primitive
- **State:** Server data → React Query. Shared UI → Context + Reducer. Local → useState.
- **Styling:** Tailwind CSS semantic utility classes backed by global design tokens.
- **Color policy (mandatory):**
  - Never hardcode colors in frontend components/styles (`#hex`, `rgb()`, `hsl()`, inline style color literals).
  - Always use semantic token utilities (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.).
  - Keep all color definitions centralized in global theme variables (light as default, dark mode via `.dark` token overrides).

#### Navigation outside React (Mandatory Pattern)

**NEVER use `window.location.href` for in-app navigation.** It causes a full page reload which destroys the React tree, unmounting `<Toaster>` and other providers before they can render feedback to the user.

Use the `router-navigator` singleton instead:

```ts
// ✅ DO — works anywhere (Axios interceptors, Zustand actions, utils)
import { routerNavigate } from "@/lib/router-navigator"
routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })

// ❌ DON'T — destroys React tree, kills toasts/modals mid-flight
window.location.href = "/login"
```

**How it works:**
1. `frontend/src/lib/router-navigator.ts` — singleton that stores the React Router `navigate` fn.
2. `NavigatorInjector` component in `App.tsx` calls `useNavigate()` and registers it via `setNavigate()`.
3. `routerNavigate(path, options)` calls the stored fn. Falls back to `window.location.href` only if called before the router mounts (rare bootstrap edge-case).

### Enum Naming Convention (Critical)

| Layer          | Key format    | Value format         |
| -------------- | ------------- | -------------------- |
| Prisma schema  | N/A           | `lower_snake_case`   |
| Backend const  | `UPPER_SNAKE` | = exact Prisma value |
| Frontend const | `UPPER_SNAKE` | = exact Prisma value |
| Zod enum       | N/A           | use `*_VALUES` array |
| API response   | N/A           | = exact Prisma value |

Rules:

- NEVER use UPPERCASE string as enum value (e.g., "DRAFT", "APPROVED")
- NEVER hardcode enum strings in services/repositories — always import from configs/entities/
- NEVER define enum values in frontend that differ from backend/DB values
- Zod schemas must use the exported `*_VALUES` or `*_TYPES` array from config, not inline literals
- New Prisma enum values must be added to backend config FIRST, then mirrored to frontend config

## Documentation Index

| Doc                                                            | Contents                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`docs/solid-principles.md`](docs/solid-principles.md)         | All 5 SOLID rules, codebase examples, checklist                           |
| [`docs/design-patterns.md`](docs/design-patterns.md)           | 10 patterns with TS code (Factory, Strategy, Decorator, etc.)             |
| [`docs/interface-contracts.md`](docs/interface-contracts.md)   | All interfaces: `IAuthRepository`, `IAuthService`, DTOs, `ApiResponse<T>` |
| [`docs/agent-directives.md`](docs/agent-directives.md)         | Per-layer rules, pattern decision tree, naming reference                  |
| [`docs/system-architecture.md`](docs/system-architecture.md)   | Architecture diagram, request lifecycle, auth flow                        |
| [`docs/code-standards.md`](docs/code-standards.md)             | Naming, conventions, gap analysis                                         |
| [`docs/codebase-summary.md`](docs/codebase-summary.md)         | All files, module breakdown, known bugs                                   |
| [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md) | Feature requirements, tech stack, missing deps                            |

## TODOs & Missing Implementations

- [ ] Install missing deps: `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `mongodb` or `mongoose`
- [ ] `backend/src/config/env.ts` — typed env wrapper, fail-fast on startup
- [ ] `backend/src/types/` — `IAuthRepository`, `IAuthService`, DTOs, `ApiResponse<T>`
- [ ] `backend/src/lib/database.ts` — MongoDB connection
- [ ] `backend/src/util/jwt.util.ts` — `signAccessToken`, `verifyAccessToken`
- [ ] `backend/src/util/hash.util.ts` — `hashPassword`, `comparePassword`
- [ ] `backend/src/middleware/auth.middleware.ts` — JWT guard
- [ ] `backend/src/middleware/validate.middleware.ts` — Zod input validation
- [ ] `backend/src/middleware/cors.middleware.ts` — CORS for frontend dev
- [ ] Implement `AuthService.signup/login/logout/refresh`
- [ ] Implement `MongoAuthRepository` methods
- [ ] Frontend routing (TanStack Router or React Router)
- [ ] `backend/.env.example`

---

_Note: This file is used by Gemini CLI to understand the project context. Update when significant architectural changes occur._
