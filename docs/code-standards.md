# Code Standards

> Source of truth: `CLAUDE.md`. This doc records what's currently applied + what's missing.

---

## Naming Conventions

| Kind        | Convention  | Example                          | Status                                 |
| ----------- | ----------- | -------------------------------- | -------------------------------------- |
| Classes     | PascalCase  | `AuthController`, `AppError`     | Compliant                              |
| Files       | kebab-case  | `auth.controller.ts`             | Compliant                              |
| Constants   | UPPER_SNAKE | `ACCESS_TOKEN_SECRET`, `MAX_...` | Compliant                              |
| Methods     | camelCase   | `signup`, `connectDB`            | Compliant                              |
| Types/enums | PascalCase  | `HttpStatusCodeType`             | Compliant                              |
| Interfaces  | `I` prefix  | `IOrderRepository`               | Pending (no interfaces defined)        |

---

## Architecture Pattern

**Strict 3-layer architecture** for all domains:

```
Route → Controller → Service → Repository → DB
         (HTTP)    (Business)  (Data Access)
```

- Controller: HTTP in/out only, delegates to service
- Service: business logic, calls repository
- Repository: all DB queries, no business logic

### DI Pattern

Constructor injection used in controller:

```ts
class AuthController {
  constructor(private service: AuthService) {}
}
```

Route creates concrete instances and injects:

```ts
const service = new AuthService()
const controller = new AuthController(service)
```

> [!NOTE]
> No DI container — manual wiring. Acceptable for scale, but consider `tsyringe` or `inversify` if complexity grows.

---

## Error Handling

### `AppError` — typed application error

```ts
throw new AppError("User not found", 404, "AuthService")
```

Fields: `message`, `statusCode`, `layer`

### Global handler

`globalErrorHandler` middleware catches `AppError` → typed JSON response. Unknown errors → 500.

> [!WARNING]
> Currently NOT registered in `index.ts` — raw inline handler used instead. Fix: replace inline with `app.use(globalErrorHandler)`.

---

## Config & Constants Rules

All literals in `configs/` structured by feature/responsibility:
- `@/configs/entities/` — Domain enums & validation lists (roles, employee status, project status, etc.)
- `@/configs/auth/` — JWT credentials, token lifetimes, regex validation, and password reset statuses
- `@/configs/system/` — App ports, database connection string, HTTP status codes, and Cloudinary settings
- `@/configs/rules/` — Business rules configurations (e.g. approval workflow mappings)

Rules:
- No hardcoded business values (such as roles, statuses, and HTTP codes).
- All literals and constants must be imported from the centralized, feature-organized config directories.
- No raw numbers or strings in handlers.

---

## What's Missing vs CLAUDE.md Standards

| Standard                                                  | Required By       | Status                       |
| --------------------------------------------------------- | ----------------- | ---------------------------- |
| `env.ts` — typed env wrapper with startup validation      | CLAUDE.md §1      | Missing                      |
| `types/index.ts` — shared type barrel                     | CLAUDE.md §1      | Missing                      |
| Zod validation at every controller boundary               | CLAUDE.md §8, §12 | Missing                      |
| `Result<T, E>` return type or try/catch in every async fn | CLAUDE.md §6      | Partial                      |
| No `any` types                                            | CLAUDE.md §14     | Violated in controller       |
| Interfaces for repository (`IAuthRepository`)             | CLAUDE.md §2-D    | Missing                      |
| `cors` middleware                                         | Security baseline | Missing                      |
| Rate limiting on auth endpoints                           | CLAUDE.md §12     | Missing                      |
| Tests (`tests/` or `*.test.ts`)                           | CLAUDE.md §10     | Missing entirely             |
| Password hashing (`bcrypt`)                               | Security baseline | Missing                      |
| API versioning (`/api/v1/`)                               | CLAUDE.md §8      | Not versioned                |

---

## File Length & Function Rules

- Max fn: 20 lines (Compliant; all current functions are short)
- Max params: 3 (Compliant)
- No commented-out code: Violated (`index.ts` line 12 has commented import)

---

## Import Aliases

Path alias `@/` maps to `src/` (configured in tsconfig). Used consistently:

```ts
import { HttpStatusCode } from "@/config/constant/http.config.ts"
import { AuthService } from "@/service/auth.service.ts"
```
