# Design Patterns — Applied Reference

> Agent-facing. Read before choosing an implementation approach.
> Use the **simplest pattern** that solves the problem. No pattern for pattern's sake.

---

## Pattern Decision Tree

```
Need to create objects?
  → Complex creation with >3 params?         → Builder
  → Multiple types from same interface?       → Factory
  → One shared instance (DB pool, logger)?    → Singleton (via DI)

Need to plug in behavior at runtime?
  → Swap algorithm/strategy?                  → Strategy
  → Add behavior without subclassing?         → Decorator
  → Simplify a subsystem?                     → Facade

Need to decouple components?
  → Emitter doesn't know listeners?           → Observer / EventEmitter
  → Chain handlers in order?                  → Chain of Responsibility

UI patterns?
  → State across many components?             → Context + Reducer
  → Flexible component composition?           → Compound Components
  → Async data from server?                   → React Query (not useState)
```

---

## 1. Factory Pattern

**When:** Multiple concrete types share same interface; caller shouldn't know which.

```ts
// types/notification.types.ts
interface INotification {
  send(to: string, body: string): Promise<void>
}

// service/notification/email.notification.ts
class EmailNotification implements INotification {
  async send(to: string, body: string) {
    /* smtp */
  }
}

// service/notification/sms.notification.ts
class SmsNotification implements INotification {
  async send(to: string, body: string) {
    /* twilio */
  }
}

// service/notification/notification.factory.ts
export class NotificationFactory {
  static create(type: "email" | "sms"): INotification {
    if (type === "email") return new EmailNotification()
    if (type === "sms") return new SmsNotification()
    throw new AppError(`Unknown notification type: ${type}`, 400, "NotificationFactory")
  }
}
```

---

## 2. Builder Pattern

**When:** Object creation needs >3 parameters or optional combinations.

```ts
// util/query.builder.ts
export class QueryBuilder {
  private table = ""
  private conditions: string[] = []
  private limitVal?: number
  private offsetVal?: number

  from(table: string) {
    this.table = table
    return this
  }
  where(condition: string) {
    this.conditions.push(condition)
    return this
  }
  limit(n: number) {
    this.limitVal = n
    return this
  }
  offset(n: number) {
    this.offsetVal = n
    return this
  }

  build(): string {
    let q = `SELECT * FROM ${this.table}`
    if (this.conditions.length) q += ` WHERE ${this.conditions.join(" AND ")}`
    if (this.limitVal) q += ` LIMIT ${this.limitVal}`
    if (this.offsetVal) q += ` OFFSET ${this.offsetVal}`
    return q
  }
}

// Usage
const query = new QueryBuilder().from("users").where("is_active = true").limit(20).offset(0).build()
```

---

## 3. Singleton Pattern

**When:** One shared instance (DB pool, logger, config).
**Rule:** Use DI container or module-level export — never `static getInstance()`.

```ts
// lib/database.ts — module singleton (Node/Bun module cache = single instance)
import { DB_CONFIG } from "@/config/database.config.ts"

import { Pool } from "pg"

export const db = new Pool(DB_CONFIG) // created once, imported everywhere

export const connectDB = async () => {
  await db.connect()
  console.log("DB connected")
}
```

```ts
// repository/auth.repository.ts — receives singleton via DI
export class PgAuthRepository implements IAuthRepository {
  constructor(private db: Pool) {} // injected, not imported directly
}
```

---

## 4. Strategy Pattern

**When:** Multiple interchangeable algorithms; replace if/else chains.

```ts
// types/auth.types.ts
interface IAuthStrategy {
  authenticate(credentials: unknown): Promise<User>
}

// service/auth/local.strategy.ts
export class LocalStrategy implements IAuthStrategy {
  async authenticate({ email, password }: LocalCredentials) {
    // find user, compare bcrypt hash
  }
}

// service/auth/google.strategy.ts
export class GoogleStrategy implements IAuthStrategy {
  async authenticate({ token }: GoogleCredentials) {
    // verify Google OAuth token
  }
}

// service/auth.service.ts
export class AuthService {
  constructor(private strategy: IAuthStrategy) {}
  login(credentials: unknown) {
    return this.strategy.authenticate(credentials)
  }
}

// route/auth.route.ts — swap strategy per endpoint
const localService = new AuthService(new LocalStrategy(repo))
const googleService = new AuthService(new GoogleStrategy())
```

---

## 5. Decorator Pattern

**When:** Add behavior (logging, caching, auth) without subclassing.

### Express Middleware as Decorator

```ts
// middleware/validate.middleware.ts
export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success)
      throw new AppError(result.error.message, HttpStatusCode.UNPROCESSABLE_ENTITY, "Validation")
    req.body = result.data
    next()
  }

// middleware/auth.middleware.ts
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken
  if (!token) throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED, "Auth")
  req.user = verifyToken(token) // attach to request
  next()
}

// route/user.route.ts — stack decorators
router.get("/profile", requireAuth, controller.getProfile)
router.post("/", requireAuth, validate(createUserSchema), controller.create)
```

### Service-level Decorator (Caching)

```ts
// service/cached-user.service.ts
export class CachedUserService implements IUserService {
  constructor(
    private inner: IUserService,
    private cache: Map<string, User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    if (this.cache.has(id)) return this.cache.get(id)!
    const user = await this.inner.findById(id)
    if (user) this.cache.set(id, user)
    return user
  }
}
```

---

## 6. Observer / EventEmitter Pattern

**When:** Decouple event emitter from listeners. Side effects triggered by domain events.

```ts
// lib/event-bus.ts
import { EventEmitter } from "events"

export const eventBus = new EventEmitter()

// Typed events
export type AppEvents = {
  "user.created": { userId: string; email: string }
  "user.login": { userId: string; ip: string }
}

// service/auth.service.ts — emits
await this.repo.createUser(data)
eventBus.emit("user.created", { userId: user.id, email: user.email })

// service/email.service.ts — listens (registered at startup)
eventBus.on("user.created", async ({ email }) => {
  await sendWelcomeEmail(email)
})
```

---

## 7. Chain of Responsibility (Middleware Pipeline)

**When:** Request passes through ordered handlers; each can stop or forward.

```ts
// Already Express's native pattern — use it explicitly:
router.post(
  "/signup",
  rateLimiter, // ← stops if too many requests
  validate(signupSchema), // ← stops if invalid body
  requireGuest, // ← stops if already logged in
  controller.signup, // ← terminal handler
)
```

---

## 8. Facade Pattern

**When:** Simplify complex subsystem behind clean API. Third-party lib wrappers.

```ts
// util/jwt.util.ts — facade over jsonwebtoken
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from "@/config/constant/auth.config.ts"
import { HttpStatusCode } from "@/config/constant/http.config.ts"
import { AppError } from "@/util/error.util.ts"

import jwt from "jsonwebtoken"

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL })

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload
  } catch {
    throw new AppError("Invalid or expired token", HttpStatusCode.UNAUTHORIZED, "JwtUtil")
  }
}
```

```ts
// util/hash.util.ts — facade over bcryptjs
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS)

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash)
```

---

## 9. Repository Pattern

**When:** Isolate all data access. Services never touch DB directly.

```ts
// types/auth.types.ts
export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>
  createUser(data: CreateUserDto): Promise<User>
  saveRefreshToken(userId: string, token: string): Promise<void>
  revokeRefreshToken(token: string): Promise<void>
}

// repository/auth.repository.ts
export class PgAuthRepository implements IAuthRepository {
  constructor(private db: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.db.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email], // ← parameterized, never interpolated
    )
    return rows[0] ?? null
  }
  // ... other methods
}
```

---

## 10. Context + Reducer (Frontend)

**When:** UI state shared across many components (>2 levels deep).

```ts
// frontend/src/store/auth/auth.context.tsx
type AuthState = { user: User | null; isLoading: boolean }
type AuthAction =
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_SUCCESS": return { ...state, user: action.payload, isLoading: false }
    case "LOGOUT":        return { user: null, isLoading: false }
    case "SET_LOADING":   return { ...state, isLoading: action.payload }
  }
}

export const AuthContext = createContext<{
  state: AuthState
  dispatch: Dispatch<AuthAction>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isLoading: false })
  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
```

---

## Anti-Patterns — Never Do

```
- God class          → one class doing everything
- Anemic domain      → classes with only getters/setters, logic in controller
- Service locator    → static registry of dependencies (use DI instead)
- Singleton via static getInstance() → use module exports or DI
- Primitive obsession → pass (email: string, password: string, name: string, role: string) → use DTO
- Magic strings/numbers → use constants
- Deep inheritance    → max 1 level. Prefer composition
- Premature pattern   → don't add Strategy if there's only one algorithm
```
