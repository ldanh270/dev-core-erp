# API Guide

**Status:** Current route-family guide, not generated OpenAPI
**Base URL:** `${VITE_API_BASE_URL}/api` or `/api` on same-origin deployments
**Authoritative route definitions:** `backend/src/routes/`

## Contract

Backend endpoints return a response envelope shaped as:

```ts
type ApiResponse<T> = {
  data: T | null
  error: {
    message: string
    code: string
    meta?: unknown
  } | null
  meta?: unknown
}
```

Validation failures use HTTP 400; authentication failures use 401; permission failures use 403. Consumers must branch on error code/status, not human-readable messages.

## Authentication

The backend accepts an `access_token` httpOnly cookie and supports an `Authorization: Bearer <token>` fallback. Login/refresh responses establish tokens; the frontend stores the short-lived access token in its Zustand state and uses cookies for credentialed transport.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate employee and establish token/session context |
| POST | `/auth/refresh` | Refresh cookie | Rotate/refresh access token |
| POST | `/auth/logout` | Required | Revoke current refresh session |
| GET | `/auth/me` | Required | Resolve current active employee, roles and permissions |
| POST | `/auth/change-password` | Required | Change current password |
| POST | `/auth/forgot-password` | Public | Start password-reset flow |
| POST | `/auth/validate-reset-token` | Public | Validate reset token |
| POST | `/auth/reset-password` | Public | Complete reset |

## API module catalog

| Base path | Module |
|---|---|
| `/auth`, `/security` | Authentication, activity/security monitoring and locked-account management |
| `/employees`, `/employee-contracts`, `/profile`, `/positions` | Workforce, contracts, self profile and positions |
| `/permissions`, `/roles` | Dynamic RBAC policy and assignments |
| `/shifts`, `/schedules`, `/attendance`, `/holidays`, `/weekly-schedule-templates`, `/part-time-availabilities` | Time planning, clocking, attendance and leave calendar setup |
| `/applications`, `/approvals`, `/shift-change-requests`, `/regime-categories` | Employee applications and approvals |
| `/salary-components`, `/salary-variables`, `/payslip-templates`, `/payrolls` | Payroll configuration, calculation, payslips and feedback |
| `/recruitment` | Requisitions, postings, intake, candidates, pipeline, interviews, offers, checks and OAuth accounts |
| `/projects`, `/tasks`, `/spent-times`, `/task-estimate-ai`, `/capacity-copilot` | Delivery management, time tracking and advisory forecasting |
| `/custom-queries`, `/activity-logs`, `/debug` | Reporting/auditing/diagnostics; access must remain restricted |

## Selected workflow endpoints

| Method | Path | Permission/control | Behavior |
|---|---|---|---|
| POST | `/attendance/check-in` | Authenticated employee | Record a check-in against scheduled/fallback shift context |
| POST | `/attendance/check-out` | Authenticated employee | Record a check-out and attendance metrics |
| POST | `/applications` | Authenticated employee | Submit a typed employee application |
| PATCH | `/applications/:id/approve` | `application.approve` | Approve application through workflow service |
| PATCH | `/applications/:id/reject` | `application.approve` | Reject with required reason where applicable |
| POST | `/payrolls/generate` | `payroll.create` | Generate a payroll period |
| POST | `/payrolls/:id/approve` | `payroll.approve` | Approve payroll after status validation |
| POST | `/payrolls/:id/reject` | `payroll.approve` | Reject payroll after status validation |
| GET | `/payrolls/my/payslips` | Authenticated employee | Retrieve own payslips |
| POST | `/recruitment/requisitions/:id/submit` | `recruitment.update` | Submit requisition for approval |
| POST | `/recruitment/requisitions/:id/approve` | `recruitment.requisition.approve` | Approve/reject requisition via dedicated transition |
| POST | `/recruitment/offers/:id/send` | `recruitment.approve` | Send an offer |
| POST | `/projects` | Authenticated employee | Create project subject to service rules |
| GET | `/projects/:id/gantt` | Authenticated employee | Retrieve project Gantt data |

## Client rules

1. Use `frontend/src/lib/api-client.ts` rather than creating unconfigured Axios calls.
2. Use domain API clients in `frontend/src/lib/api/` for frontend operations.
3. Use `routerNavigate` for in-app navigation after API outcomes; never hard reload to an internal route.
4. Send only values validated by the relevant Zod schema; enums must use centralized values/configuration.
5. Treat a 401/403 as an authorization event. The standard client handles serialized refresh and clears identity only after confirmed session expiration.

## Versioning and OpenAPI

The repository has Swagger dependencies, but this document does not claim a current generated OpenAPI endpoint or complete machine-readable specification. Route modules and Zod schemas are the current contract source. **Recommendation:** generate OpenAPI from route/schema metadata and publish it as a release artifact before external API consumption grows.

For architecture and security details, see [enterprise-project-documentation.md](enterprise-project-documentation.md). For cross-layer DTO conventions, see [interface-contracts.md](interface-contracts.md).
