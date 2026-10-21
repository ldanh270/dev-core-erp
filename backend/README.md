# DevCore ERP Backend API

This is the backend system for **DevCore ERP** (`dev-core-erp`) — an Enterprise Resource Planning platform tailored for IT outsourcing, software development, and marketing agencies. It is built strictly following **Clean Architecture** principles using TypeScript, Express 5, Prisma ORM, and runs on the high-performance **Bun** runtime.

## 🏗️ System Architecture (Clean Architecture)

The system strictly adheres to **S.O.L.I.D** principles and is clearly segregated into distinct layers to maximize scalability and maintainability:

```text
Route (HTTP method mapping)
  ↳ Controller (HTTP adapters: req, res, error handling)
      ↳ Service (Core Business Logic)
          ↳ Repository (Database Access Layer via Prisma)
```

1. **Routes (`src/routes/`)**: Exclusively handles endpoint definitions and binds them to corresponding controllers. Contains absolutely zero business logic.
2. **Controllers (`src/controllers/`)**: Interfaces directly with HTTP clients. It receives requests (post validation middleware), invokes the appropriate Service method, and standardizes the response using the `ApiResponse` format.
3. **Services (`src/services/`)**: Contains all core business logic (e.g., payroll calculations, application approval logic). It depends on Repositories injected via **Dependency Injection**.
4. **Repositories (`src/repositories/`)**: Interfaces directly with the PostgreSQL database via Prisma. All complex CRUD operations are encapsulated here.

## 🛠️ Core Technologies

- **Runtime:** `Bun` (Significantly faster than Node.js, native TypeScript execution, built-in test runner).
- **Web Framework:** `Express 5` (Superior native handling of Promise/Async errors compared to Express 4).
- **ORM:** `Prisma` (PostgreSQL data modeling with absolute type-safety).
- **Validation:** `Zod` (Strict type checking for Request Body, Query, and Params prior to controller execution).

## 🚀 Development Scripts

You can execute the following scripts using `bun run <command-name>` directly from the `backend/` directory:

- `dev`: Starts the server in watch mode with instant hot-reloading upon code changes.
- `seed`: Safely truncates the database and seeds comprehensive, relational mock data across all 26 tables.
- `seed:admin`: Initializes (or updates) the 5 default core role accounts (admin, hr_manager, general_manager, team_leader, employee).
- `clear`: A standalone utility command to safely truncate and wipe all database tables.

## 🌱 Seeder System (Database Mocking)

The Seeder is designed using the **Registry Pattern**. Each entity group operates as an independent file inside `src/scripts/seeders/` (e.g., `01-employees.seeder.ts`, `16-payslips.seeder.ts`) and is automatically registered via `seeder.registry.ts`.

When you execute `bun run seed`, the system automatically:

1. Performs a `TRUNCATE CASCADE` on the entire database.
2. Sorts seeders by their assigned priority order to perfectly resolve Foreign Key constraints.
3. Injects thousands of mock records that are flawlessly interconnected.

## ⚙️ Environment Variables (.env)

Create a `.env` file by duplicating `.env.example`. Ensure your `DATABASE_URL` is configured correctly:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/hrm_db?schema=public"
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
```

All system configurations (Roles, Error Codes, Regex Rules) are centralized in the `src/configs/` directory to completely eliminate hardcoded "magic values" scattered across the business logic.
