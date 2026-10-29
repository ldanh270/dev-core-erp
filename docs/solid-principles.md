# SOLID Principles — Applied Reference

> This file is **agent-facing**. Read before generating any class, service, repository, or interface.
> Violating these rules = rejected code. No exceptions.

---

## S — Single Responsibility Principle

> One class, one reason to change.

### Rule

Split if you need "and" to describe what a class does.

### Enforcement

```
- AuthController: handles HTTP only
- uthService      → business logic only
- AuthRepository: DB queries only
- ppError         → typed error only
- JwtUtil: token sign/verify only

- Anti-pattern: AuthService that also sends emails → extract EmailService
- Anti-pattern: ontroller that queries DB directly        → extract repository
- Anti-pattern: Middleware that contains business rules → push to service
- Anti-pattern: epository that hashes passwords           → push to util/service
```

### File-level SRP

```
One file = one exported class or one cohesive set of pure functions.
If file needs "and" in its description → split it.
```

### Examples in this codebase

```ts
// CORRECT — controller does HTTP only
export class AuthController {
  signup = async (req: Request<{}, {}, SignupDto>, res: Response) => {
    const result = await this.service.signup(req.body)
    res.status(HttpStatusCode.CREATED).json({ data: result })
  }
}

// INCORRECT — controller doing hashing (not its job)
export class AuthController {
  signup = async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10) // ← belongs in service/util
    const user = await db.query(...)                       // ← belongs in repository
  }
}
```

---

## O — Open/Closed Principle

> Open for extension, closed for modification.

### Rule

Add behavior via composition, config, or strategy — never by editing core logic.

### Enforcement

```
- Add new payment method → new class implements IPaymentStrategy
- dd new auth method → new class implements IAuthStrategy
- Add new export format → new class implements IExporter
- eature flags to branch behavior → never if/else in core

- Anti-pattern: Edit AuthService.login() to add new login type
- Anti-pattern: dd if/else chains in service methods for variants
- Anti-pattern: Modify working middleware to support new case inline
```

### Pattern: Strategy Injection

```ts
// OCP — extend without modifying
interface INotificationStrategy {
  send(to: string, message: string): Promise<void>
}

class EmailNotification implements INotificationStrategy { ... }
class SmsNotification implements INotificationStrategy { ... }

class NotificationService {
  constructor(private strategy: INotificationStrategy) {} // inject, don't hardcode
  notify(to: string, msg: string) { return this.strategy.send(to, msg) }
}
```

### Pattern: Config Objects

```ts
// OCP — new roles do not touch core
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["read", "write", "delete"],
  staff: ["read", "write"],
  viewer: ["read"],
}
// Add new role → only update config, core unchanged
```

---

## L — Liskov Substitution Principle

> Subtypes must be substitutable for their base type.

### Rule

If subclass overrides a method and throws "not implemented" → hierarchy is wrong. Redesign.

### Enforcement

```
- Every class implementing IAuthRepository must fully implement all methods
- ock/stub implementations for tests must honor the same contract
- Overrides must not narrow accepted input or widen thrown errors

- Anti-pattern: class FakeRepo implements IAuthRepository { findByEmail() { throw new Error("not implemented") } }
- Anti-pattern: ubclass that ignores required interface method
- Anti-pattern: Override that returns undefined where interface promises T
```

### Example

```ts
interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>
  createUser(data: CreateUserDto): Promise<User>
}

// LSP satisfied — both implementations are fully substitutable
class PgAuthRepository implements IAuthRepository { ... }
class MockAuthRepository implements IAuthRepository { ... } // for tests
```

---

## I — Interface Segregation Principle

> No class forced to implement methods it doesn't use.

### Rule

Narrow, purpose-built interfaces > fat interfaces.

### Enforcement

```
- IUserReader { findById, findByEmail }
- UserWriter { create, update, delete }
- Controllers only import the interface methods they call

- Anti-pattern: IUserRepository with 15 methods when controller calls 2
- Anti-pattern: ne mega-interface imported everywhere
- Anti-pattern: Passing full service to a utility that needs one method
```

### Split Pattern

```ts
// Anti-pattern: Fat interface forces all implementors to define everything
interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>
  createUser(data: CreateUserDto): Promise<User>
  saveRefreshToken(userId: string, token: string): Promise<void>
  revokeRefreshToken(token: string): Promise<void>
  findAllUsers(): Promise<User[]> // admin only — unrelated to auth flow
  deleteUser(id: string): Promise<void> // admin only — unrelated to auth flow
}

// PREFERRED: Segregated interfaces — callers import only what they need
interface IAuthReader {
  findByEmail(email: string): Promise<User | null>
}

interface IAuthWriter {
  createUser(data: CreateUserDto): Promise<User>
}

interface ITokenStore {
  saveRefreshToken(userId: string, token: string): Promise<void>
  revokeRefreshToken(token: string): Promise<void>
}

interface IUserAdmin extends IAuthReader {
  findAllUsers(): Promise<User[]>
  deleteUser(id: string): Promise<void>
}
```

---

## D — Dependency Inversion Principle

> High-level modules depend on abstractions, not concretions.

### Rule

Inject dependencies. Never `new ConcreteClass()` inside a class body.

### Enforcement

```
- Controller takes IAuthService in constructor
- ervice takes IAuthRepository in constructor
- Route file does the concrete wiring
- ests inject mock implementations

- Anti-pattern: class AuthService { private repo = new PgAuthRepository() }
- Anti-pattern: lass AuthController { private service = new AuthService() }
- Anti-pattern: Importing a class and instantiating it inside another class
```

### Wiring Pattern (this codebase)

```ts
// route/auth.route.ts — only place that touches concrete classes
const repo = new PgAuthRepository(db) // concrete
const service = new AuthService(repo) // depends on IAuthRepository
const controller = new AuthController(service) // depends on IAuthService

router.post("/signup", validate(signupSchema), controller.signup)
```

```ts
// service/auth.service.ts — depends on abstraction only
export class AuthService {
  constructor(private repo: IAuthRepository) {} // abstraction
}

// repository/auth.repository.ts — implements abstraction
export class PgAuthRepository implements IAuthRepository {
  constructor(private db: Pool) {}
}
```

---

## Quick Checklist (Run Before Every PR)

```
□ Each class has ONE clear responsibility?
□ New behavior added via extension, not mutation of existing class?
□ All interface methods implemented by every implementor?
□ Interfaces are narrow — no unused methods forced on implementor?
□ No `new ConcreteClass()` inside another class body?
□ All dependencies injected via constructor?
□ Abstractions (interfaces) defined for every repository and service?
□ Tests inject mock implementations via same interface?
```
