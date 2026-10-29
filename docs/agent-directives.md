# Agent Directives — SOLID & Patterns Enforcement

> **READ THIS FIRST.** Every agent generating backend code MUST follow this file.
> These rules override any default coding style. No exceptions.

---

## Before Writing Any Code

Run this mental checklist:

```
1. Does an interface exist for this class?       → if NO, create interface first
2. Am I instantiating a class inside another?    → if YES, inject it instead
3. Can I describe this class without "and"?      → if NO, split it
4. Is this a new behavior variant?               → if YES, use Strategy/Factory, not if/else
5. Is this logic duplicated?                     → if YES, extract to util/service
6. Does caller need ALL interface methods?       → if NO, split the interface
```

---

## Mandatory Patterns Per Layer

### Route Files (`route/*.route.ts`)

```
ROLE: Wire concrete classes. Only place that does `new ConcreteClass()`.
MUST:
  - Create concrete instances (repo, service, controller)
  - Compose middleware stack (validate → requireAuth → handler)
  - Never contain business logic
  - Never contain SQL or data access
```

```ts
// Correct route file structure
const repo       = new PgAuthRepository(db)
const service    = new AuthService(repo)
const controller = new AuthController(service)

router.post("/signup",
  validate(signupSchema),   // decorator: input guard
  controller.signup          // terminal handler
)

router.post("/login",
  validate(loginSchema),
  rateLimiter,
  controller.login
)
```

---

### Controllers (`controller/*.controller.ts`)

```
ROLE: HTTP adapter only.
MUST:
  - Accept IService in constructor (not concrete class)
  - Parse req.body / req.params → call service method
  - Return typed JSON response using HttpStatusCode constants
  - Never contain: if/else business logic, DB calls, password hashing, JWT ops

MUST NOT:
  - new ConcreteClass() inside
  - import from repository directly
  - contain try/catch beyond top-level error delegation
```

```ts
// Correct controller
export class AuthController {
  constructor(private service: IAuthService) {} // ← interface, not class

  signup = async (req: Request<{}, {}, SignupDto>, res: Response) => {
    const result = await this.service.signup(req.body) // body already validated by middleware
    res.status(HttpStatusCode.CREATED).json({ data: result, error: null })
  }
}
```

---

### Services (`service/*.service.ts`)

```
ROLE: Business logic orchestration.
MUST:
  - Accept IRepository in constructor (not concrete class)
  - Throw AppError with correct statusCode + layer name
  - Coordinate between repository calls and utilities
  - Never: write SQL, parse HTTP req/res, set cookies directly

ALLOWED to:
  - Call multiple repositories
  - Call util functions (jwt.util, hash.util)
  - Emit domain events (eventBus.emit)
```

```ts
// Correct service
export class AuthService implements IAuthService {
  constructor(private repo: IAuthRepository) {} // ← interface

  async signup(data: SignupDto): Promise<User> {
    const existing = await this.repo.findByEmail(data.email)
    if (existing) throw new AppError("Email already registered", HttpStatusCode.CONFLICT, "AuthService")

    const passwordHash = await hashPassword(data.password)
    return this.repo.createUser({ ...data, passwordHash })
  }
}
```

---

### Repositories (`repository/*.repository.ts`)

```
ROLE: Data access only.
MUST:
  - Implement the matching I*Repository interface
  - Accept DB client/pool in constructor
  - Use parameterized queries ONLY ($1, $2 — never string interpolation)
  - Return domain models (strip sensitive fields like passwordHash on select)
  - Never: contain business logic, call other services, hash passwords

CLASS NAME: Prefix with driver name → PgAuthRepository, MysqlAuthRepository
```

```ts
// Correct repository
export class PgAuthRepository implements IAuthRepository {
  constructor(private db: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query<User>(
      "SELECT id, email, name, role, created_at, updated_at FROM users WHERE email = $1",
      [email] // ← parameterized, never `WHERE email = '${email}'`
    )
    return rows[0] ?? null
  }

  async createUser(data: SignupDto & { passwordHash: string }): Promise<User> {
    const { rows } = await this.db.query<User>(
      "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at, updated_at",
      [data.email, data.name, data.passwordHash, "staff"]
    )
    return rows[0]
  }
}
```

---

### Utilities (`util/*.util.ts`)

```
ROLE: Pure functions only.
MUST:
  - Be stateless — no side effects, no DB, no HTTP
  - Be importable anywhere without circular deps
  - Have explicit input/output types — no `any`

Files to create (currently missing):
  - jwt.util.ts    → signAccessToken, verifyAccessToken, signRefreshToken
  - hash.util.ts   → hashPassword, comparePassword
  - pagination.util.ts → toPaginationMeta, toOffset
```

---

## Frontend & UI Directives

```
ROLE: Implement polished, modern React components.
MUST:
  - Adhere strictly to docs/frontend-design-spec.md
  - Use "Pill" geometry (rounded-full) for all interactive elements
  - Use "Soft-Square" (rounded-3xl) for all containers
  - Use HEX-based semantic tokens (bg-primary, text-foreground, etc.)
  - Implement "Comfortable" density (64px row height for tables)
  - Ensure dark mode support via the .dark class
```

---

## When to Use Which Pattern

| Scenario | Pattern | File Location |
|----------|---------|--------------|
| New domain entity (User, Product...) | Repository + Service + Controller | Follow existing auth structure |
| Multiple interchangeable algorithms | Strategy | `service/{domain}/{variant}.strategy.ts` |
| Complex object construction | Builder | `util/{domain}.builder.ts` |
| Multiple concrete implementations | Factory | `service/{domain}/{domain}.factory.ts` |
| Wrap third-party lib | Facade | `util/{lib}.util.ts` |
| Add cross-cutting concern | Decorator (Middleware) | `middleware/{concern}.middleware.ts` |
| Ordered request processing | Chain of Responsibility | Compose in route file |
| Domain events (email on signup) | Observer | `lib/event-bus.ts` + listener in service |
| Global shared instance | Singleton (module export) | `lib/*.ts` |
| Frontend shared state | Context + Reducer | `frontend/src/store/{domain}/` |

---

## Naming Reference

```
Pattern                File name                    Class name
──────────────────────────────────────────────────────────────
Repository interface   types/auth.types.ts          IAuthRepository
Repository impl        repository/auth.repository.ts  MongoAuthRepository
Service interface      types/auth.types.ts          IAuthService
Service impl           service/auth.service.ts      AuthService
Controller             controller/auth.controller.ts AuthController
Route                  route/auth.route.ts          —
Strategy               service/auth/local.strategy.ts LocalAuthStrategy
Factory                service/notification/notification.factory.ts NotificationFactory
Facade/util            util/jwt.util.ts             — (named exports only)
Middleware/Decorator   middleware/validate.middleware.ts — (named fn export)
DTO                    types/auth.types.ts          SignupDto, LoginDto
Domain model           types/auth.types.ts          User, Product
```

---

## References

| Principle / Pattern | Detailed Reference |
|--------------------|--------------------|
| SOLID (all 5)      | `docs/solid-principles.md` |
| Design Patterns    | `docs/design-patterns.md` |
| Interface Contracts| `docs/interface-contracts.md` |
| Code Standards     | `docs/code-standards.md` |
| Architecture       | `docs/system-architecture.md` |
| CLAUDE.md §2       | SOLID Applied |
| CLAUDE.md §3       | Pattern Cheat Sheet |
| CLAUDE.md §14      | Agent Behavior Directives |
