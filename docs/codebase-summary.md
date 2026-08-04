# Codebase Summary

**Status:** Current implementation baseline
**Last reviewed:** 2026-08-04

## Repository map

```text
integrated-hr-and-product-system/
├── backend/                 Express API, Prisma schema, migrations, jobs and tests
├── frontend/                React SPA, pages, API clients, state and UI primitives
├── mcp-server/              MCP transport, browser login, sessions and HRP tools
├── agent-gateway/           Telegram/AI orchestration, Redis state and MCP client
├── caddy/                   Production reverse-proxy/TLS configuration
├── nginx/                   Alternate proxy configuration (not production Compose default)
├── docs/                    Architecture, API, UI and engineering documentation
├── .github/workflows/       PR build, deploy and rollback automation
├── docker-compose.yml       Local MCP/gateway/Redis stack
└── docker-compose.prod.yml  Production service topology
```

## Backend

```text
backend/src/
├── configs/        Canonical entity, auth, system and business-rule configuration
├── connectors/     External connectors, including recruitment integrations
├── controllers/    HTTP adapters
├── libs/           Prisma runtime and scheduled job bootstrapping
├── middlewares/    CORS, error, authentication, validation and permissions
├── repositories/   Prisma data-access implementations
├── routes/         REST route composition
├── schemas/        Zod input schemas
├── scripts/        Seed, repair, clear and developer utilities
├── services/       Workflow, calculation and domain services
├── types/          Service/repository DTO contracts
├── utils/          Shared error, token, time and domain helpers
└── __tests__/      Jest tests for services, schemas, middleware and utilities
```

Major backend modules:

| Domain | Examples |
|---|---|
| Identity and security | Auth, refresh tokens, password reset, roles, permissions, security dashboard, activity logs |
| Workforce | Employees, profiles, contracts, positions, salary configurations |
| Attendance | Shifts, schedules/templates, attendance, real shifts, holidays, part-time availability |
| Requests | Applications, approvals, shift change, regimes and attachments |
| Payroll | Components, variables, templates, payroll runs, payslips and scheduled automation |
| Recruitment | Requisitions, job postings, intake/connectors, candidates, interviews, scorecards, offers and background checks |
| Delivery | Projects, members, roles, task statuses, tasks, trackers, spent time and capacity copilot |

## Frontend

```text
frontend/src/
├── components/     Shared shells, providers, common components and shadcn-style primitives
├── config/         API, routes, subsystem, entity and UI configuration
├── lib/api/        Typed domain API clients
├── pages/          Route pages grouped by business area
├── routes/         Public/private route definitions and permission metadata
├── schemas/        Frontend Zod form schemas
├── store/          Zustand client state
└── utils/          Navigation, export, date and feature utilities
```

Page modules cover application, attendance, authentication, employees, payroll, personal self-service, projects, recruitment and security. React Query handles remote state; Zustand handles persisted client state; Axios centralizes cookie/token transport and refresh handling.

## MCP server and agent gateway

`mcp-server` exposes MCP through SSE or stdio, holds browser-login sessions and registers tool families for HRP operations. `agent-gateway` runs a Telegram bot, validates Redis/MCP availability at startup, manages bounded user history, calls the AI provider, and invokes MCP tools with server-injected sessions.

## Source-of-truth pointers

| Need | Read |
|---|---|
| Mounted APIs and startup | `backend/src/index.ts` |
| Domain models | `backend/prisma/schema.prisma` |
| Route contract | `backend/src/routes/` plus `backend/src/schemas/` |
| Workflow rules | `backend/src/services/` |
| Browser access/routing | `frontend/src/App.tsx`, `frontend/src/routes/` |
| UI standard | `docs/frontend-design-spec.md` |
| MCP tool catalogue | `mcp-server/src/mcp.ts`, `mcp-server/src/tools/` |
| Production deployment | `docker-compose.prod.yml`, `caddy/Caddyfile`, `.github/workflows/` |

For the architectural reasoning, data relationships and operations model, see [enterprise-project-documentation.md](enterprise-project-documentation.md).
