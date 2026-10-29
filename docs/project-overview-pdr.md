# Project Overview & PDR

## Project Identity

| Field       | Value                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| Name        | **DevCore ERP** — Web-Based Enterprise Resource Planning System for IT Outsourcing Companies |
| Course      | SWP391 (Software Project)                                                                  |
| Semester    | Summer 2026                                                                                |
| Backend pkg | `devcore-erp-backend`                                                                      |
| Runtime     | Bun + Express 5 + TypeScript                                                               |
| Frontend    | React 19 + Vite 8 + TypeScript                                                             |

## Purpose

**DevCore ERP** is a web-based Enterprise Resource Planning (ERP) platform designed specifically for IT outsourcing firms, software development houses, and digital marketing agencies. The system unifies human resources management, project & task tracking, payroll processing, attendance and scheduling, recruitment pipelines, dynamic role-based access control, and an internal AI assistant — enabling organizations to manage the complete employee lifecycle and project delivery workflow on a single unified platform.

**Architecture:** Fullstack TypeScript monorepo with decoupled `backend/` (REST API) and `frontend/` (SPA) workspaces communicating over HTTP.

---

## Feature Requirements (PDR)

### Phase 1 — Foundation (Current)

- [x] Express server bootstrapped with Bun
- [x] Database connection module (`lib/database.ts`) — stub, TODO connect real DB
- [x] Auth domain scaffolded: controller → service → repository layer
- [x] JWT auth config: access token (15m TTL), refresh token (7d TTL)
- [x] Global error handler middleware with `AppError` typed class
- [x] HTTP status code constants
- [x] Cookie-based token transport (`cookie-parser`)
- [ ] **Signup** endpoint — controller wired, service logic TODO
- [ ] **Login** endpoint — not yet created
- [ ] **Logout** endpoint — not yet created
- [ ] **Refresh token** endpoint — not yet created
- [ ] Auth guard middleware (JWT verify) — missing
- [ ] Input validation middleware (Zod) — missing
- [ ] Real DB driver (PostgreSQL/MySQL) — not connected

### Phase 2 — Core ERP Modules (Planned)

- [ ] Employee management CRUD (profiles, contracts, departments)
- [ ] Role-based access control (admin, general_manager, team_leader, employee)
- [ ] Project & Task management (Kanban, time logging, categories)
- [ ] Attendance & leave tracking (check-in/out, leave requests, approval workflow)
- [ ] Payroll management (salary calculation, approval, export)
- [ ] Recruitment module (job postings, applicant tracking, onboarding)
- [ ] Frontend pages: dashboard, employee list, project board, payroll

### Phase 3 — Polish & Scale (Future)

- [ ] Pagination on all list endpoints
- [ ] Rate limiting on auth endpoints
- [ ] CI/CD pipeline
- [ ] E2E tests (Playwright)
- [ ] API versioning (`/api/v1/`)
- [ ] Reporting & analytics dashboard
- [ ] Notification system (email / in-app)

---

## Tech Stack

### Backend

| Package       | Version | Purpose                   |
| ------------- | ------- | ------------------------- |
| bun           | latest  | Runtime + package manager |
| express       | ^5.2.1  | HTTP framework            |
| cookie-parser | ^1.4.7  | Cookie middleware         |
| dotenv        | ^17.4.2 | Env var loading           |
| typescript    | ~6.x    | Type safety               |

### Frontend

| Package                     | Version | Purpose        |
| --------------------------- | ------- | -------------- |
| react                       | ^19.2.6 | UI framework   |
| vite                        | ^8.0.12 | Build tool     |
| typescript                  | ~6.0.2  | Type safety    |
| babel-plugin-react-compiler | ^1.0.0  | React compiler |

### Missing (Should Add)

- `jsonwebtoken` — JWT sign/verify (auth not functional without it)
- `zod` — input validation at boundaries
- `bcryptjs` — password hashing
- Database driver: `pg` (PostgreSQL) or `mysql2`
- `cors` — CORS headers for frontend dev

---

## API Contract (Current)

```
POST /api/auth/signup   → 201 | 400
GET  /                  → 200 { message: "Connect to server successfully" }
*    /*                 → 404 { status, message }
```

---

## Environment Variables Required

```env
PORT=5000
ACCESS_TOKEN_SECRET=<secret>
# DB vars TBD when driver added
```
