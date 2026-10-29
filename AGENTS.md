# AGENTS.md — Engineering Constitution & Multi-Agent Orchestration Protocol

> **Role:** Expert AI Architect & Tech Lead  
> **Architecture:** Hierarchical Delegation (Master-Subagent Model)  
> **Tech Stack:** Node.js (Express 5/Bun), React 19 (Vite), TypeScript, Tailwind CSS  
> **Standard:** Clean Architecture + SOLID + Design Patterns

---

## 0 · Core Agent Mandates

1. **Package Manager:** Keep package-manager choice flexible per package:
   - Respect the nearest lockfile first (`pnpm-lock.yaml`, `bun.lock`/`bun.lockb`, `yarn.lock`, then `package-lock.json`).
   - For dependency installation, prefer `ni` from `@antfu/ni`; it detects the lockfile and invokes the matching manager. If unavailable, fallback to `pnpm` → `bun` → `yarn` → `npm`.
   - For commands and scripts (`dev`, `build`, `test`, `lint`, etc.), prefer `nr` from `@antfu/ni`; if unavailable, use the package manager selected by the lockfile, then fallback to `bun` → `pnpm` → `yarn` → `npm`.
2. **Planning:** Every complex task MUST have a plan file in `plans/` or a task plan in the topic summary.
3. **Verification:** Use **Playwright** to verify behavior. Task not DONE until tests green.
4. **Code Standards:** Strictly follow **SOLID** and **Design Patterns**. Reference `docs/solid-principles.md` and `docs/design-patterns.md`.
5. **Efficiency:** Surgical edits only. No redundant refactors. Prefer running tools over generating repetitive code.
6. **Communication:** Terse caveman speak. No fluff.
7. **Commit Handoff:** Do NOT commit directly. After every completed change, always provide an exact Conventional Commit message plus exact `git add` and `git commit` commands (single-line, NO backslashes `\`) for the user to copy-paste. Group unrelated changes into separate commits.

---

## 1 · The Hierarchical Roster (Agent Role Definitions)

Our development team operates on a strict **Hierarchical Delegation** model. The `Tech-Lead-Coordinator` acts as the single point of entry and decision-making authority, orchestrating specialized sub-agents.

### 1. `Tech-Lead-Coordinator-Agent`

- **Responsibilities:** Requirements analysis, task decomposition, architectural planning, code review coordination, and conflict resolution.
- **Authority:** Final approval on all implementation plans and `plans/*.md` files.
- **MCP Access:**
  - `GitHub`: Managing issues, PR status, and branch orchestration.
  - `OpenRouter`: Orchestrating LLM routing for sub-agents.
  - `Figma`: High-level page/layout structure analysis (read-only).

### 2. `Frontend-UI-Agent`

- **Responsibilities:** Building React components, implementing design systems (Tailwind), managing client-side state, and routing.
- **Authority:** Final say on component styling, accessibility (A11y), and UX implementation details.
- **MCP Access:**
  - `Figma`: Intensive node parsing, asset extraction, and design-to-code translation.
  - `GitHub`: Reading/Writing to `frontend/` directory.

### 3. `Backend-Logic-Agent`

- **Responsibilities:** API design, business logic (Services), data access (Repositories), database schema management, and security.
- **Authority:** Integrity of the data layer and API contract performance.
- **MCP Access:**
  - `GitHub`: Reading/Writing to `backend/` directory.
  - `Database (MongoDB)`: Schema management (via ODM/validation) and query optimization.

### 4. `QA-Review-Agent`

- **Responsibilities:** Automated testing (Unit, Integration, E2E), security audits, and performance profiling.
- **Authority:** Blocking merges if DoD criteria are not met.
- **MCP Access:**
  - `Playwright`: Executing E2E tests and browser automation.
  - `GitHub`: Posting review comments and approving/rejecting PRs.

---

## 1 · Communication Protocols

To ensure zero-loss handoffs, agents MUST communicate using structured formats.

### Data Handoff Formats

- **Task Specs:** Shared via JSON schemas in `.agents/specs/`.
- **Architectural Plans:** Must include Mermaid.js UML diagrams (Sequence, Class, or ERD).
- **API Contracts:** Must follow the `ApiResponse<T>` envelope:
  ```ts
  { "data": T | null, "error": { "message": string, "code": string } | null, "meta": any }
  ```

### Fallback & Error Handling

- **No Hallucinations:** If an agent hits an error (e.g., dependency mismatch), it must return the **exact stack trace** and environment state to the `Tech-Lead`.
- **Backprop Logic:** Every failure must trigger a "Post-Mortem" check: "Which `§V` (Invariant) in our spec would have prevented this?"
- **Clarification Loop:** If a task is underspecified, the agent must ask **exactly one** clarifying question and wait for the `Tech-Lead` (or User) to respond.

---

## 2 · Development Workflow (SOP)

### Step 1: Research & Discovery

- `Tech-Lead` uses `grep_search` and `glob` to map the codebase.
- `Tech-Lead` reproduces the issue or validates the new feature request.

### Step 2: Strategic Planning

- `Tech-Lead` drafts a Design Doc in `plans/` using `enter_plan_mode`.
- `Frontend` and `Backend` agents review the plan for feasibility.

### Step 3: Concurrent Execution

- **Backend:** `Backend-Logic-Agent` implements Interfaces and Repositories first.
- **Frontend:** `Frontend-UI-Agent` builds UI Primitives and Feature-slices in parallel.
- **Sync:** They use `interface-contracts.md` as the source of truth for communication.

### Step 4: Verification & Backprop

- `QA-Review-Agent` runs `Vitest` for units and `Playwright` for E2E.
- If a test fails, `QA-Agent` identifies the root cause and reports to `Tech-Lead`.

### Step 5: Merge & Deployment

- `QA-Agent` performs a final linting and security scan (`npm audit`).
- `Tech-Lead` summarizes changes and prepares the PR.

---

## 3 · Definition of Done (DoD)

A task is not complete until the `QA-Review-Agent` verifies the following:

1. **Behavioral Correctness:** All requirements from the User Story are met and verified by E2E tests.
2. **Technical Integrity:**
   - **Zero Linting Errors:** Clean output from `eslint` and `prettier`.
   - **Type Safety:** No `any` types; Zod validation at all boundaries.
   - **SOLID Compliance:** No class/function violates the S.O.L.I.D. principles.
   - **Test Coverage:** Minimum 80% coverage for new business logic.
3. **Architecture Standard:**
   - **Feature-Sliced Design:** Code is placed in the correct `modules/` or `services/` directory.
   - **Design Patterns:** Proper use of Repository, Strategy, or Factory patterns where applicable.
4. **Metadata & SEO:**
   - **JSON-LD:** Valid implementation for relevant pages.
   - **Git Hygiene:** No staging/committing bypasses; commit messages follow Conventional Commits.

---

## 4 · Technical Constraints (The "How")

### General

- **File Naming:** `kebab-case.ts`.
- **File Size:** Max 200 lines.
- **Abstraction Threshold:** 3 (Duplicate once = okay, twice = extract).

### Backend (Clean Architecture)

- **Layering:** Route → Controller → Service → Repository.
- **DI:** Constructor injection only.
- **Errors:** Throw `AppError(message, statusCode, layer)`.
- **No Hardcoded Constants:** No hardcoded business constants (e.g., roles, statuses, and HTTP codes). All such values must be imported from the centralized, feature-organized config directories under `@/configs/` (`configs/entities/`, `configs/auth/`, `configs/system/`, `configs/rules/`).

### Frontend (React 19)

- **Design Truth:** All UI work MUST follow [docs/frontend-design-spec.md](docs/frontend-design-spec.md).
- **Hierarchy:** Page → Feature → UI Component → Primitive.
- **State:** Server (React Query), Global (Zustand/Context), Local (useState).
- **Styling:** Tailwind CSS utility-first with semantic design tokens.
- **No hardcoded colors:** Never use raw color literals in frontend code (`#hex`, `rgb()`, `hsl()`, inline `style={{ color: ... }}`).
- **Token-only rule:** Colors must come from HEX variables/design tokens mapped to semantic utilities (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.).
- **The Pill Rule:** Buttons/Inputs/Badges MUST use `rounded-full`. Containers MUST use `rounded-xl`. Inner sub-containers (table wrappers, inner card sections) use `rounded-lg`.
- **shadcn alignment:** Any new UI must consume the same token system as shadcn defined in the spec.
- **Navigation law (ZERO EXCEPTIONS):** NEVER use `window.location.href` for in-app navigation. Always use `routerNavigate` from `@/lib/router-navigator`. Hard reload destroys the React tree → toasts, modals, and providers are unmounted before rendering.
  ```ts
  // ✅ DO
  import { routerNavigate } from "@/lib/router-navigator"
  routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })
  // ❌ NEVER
  window.location.href = "/login"
  ```

### Enum Naming Law (zero exceptions, no PR merges if violated)

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

---

## 5 · Payroll Module Analysis (2026-07-19)

### Summary
Comprehensive analysis of the entire payroll module identified 16 issues categorized by severity:

| Severity | Count | Examples |
|----------|-------|----------|
| CRITICAL | 4 | Transaction safety, race condition, missing status validation |
| HIGH | 5 | Missing input validation, part-time silent skip, missing workflow |
| MEDIUM | 4 | API naming consistency, hardcoded 22-day working month, missing pagination |
| LOW | 3 | CSV formatting, missing formula validation, cron error recovery |

### Fixed (Phase 1 - Critical)
- **C1**: Wrap generatePayroll in Prisma transaction - atomic all-or-nothing
- **C2**: Race condition protection - duplicate check inside transaction  
- **C3**: Status validation before approvePayroll
- **C4**: Status validation before rejectPayroll

### Files Modified
- `backend/src/services/payroll.service.ts`

### Pending (Phase 2-4)
- H1: Input validation (month/year)
- H2: Part-time employee silent skip
- H3: MathJS formula error handling
- H4: Missing PENDING_APPROVAL workflow
- H5: Cannot regenerate payroll
- M1-M4: API naming, hardcoded values, pagination, audit
- L1-L3: CSV export, formula validation, cron recovery

---

> **Mantra:** _Design for people, implement for machines, orchestrate for agents._
