# Interface Contracts — Type Reference

> Define interfaces here FIRST. Implement after. Never couple to concrete class.
> All interfaces go in `backend/src/types/`.

---

## Auth Domain

```ts
// backend/src/types/auth.types.ts

// --- DTOs (Data Transfer Objects) ---

export interface SignupDto {
  email: string
  password: string
  name: string
}

export interface LoginDto {
  username: string
  password: string
}

// --- Domain Models ---

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = "admin" | "staff" | "viewer"

// --- Repository Contract (DIP §D) ---

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  createUser(data: SignupDto & { passwordHash: string }): Promise<User>
  saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>
  revokeRefreshToken(token: string): Promise<void>
  findByRefreshToken(token: string): Promise<{ userId: string } | null>
}

// --- Service Contract (DIP §D) ---

export interface IAuthService {
  signup(data: SignupDto): Promise<User>
  login(data: LoginDto): Promise<{ user: User; accessToken: string }>
  logout(refreshToken: string): Promise<void>
  refresh(refreshToken: string): Promise<{ accessToken: string }>
}

// --- JWT Payload ---

export interface JwtPayload {
  userId: string
  role: UserRole
  iat?: number
  exp?: number
}
```

---

## Shared / Common

```ts
// backend/src/types/common.types.ts

// API response envelope (CLAUDE.md §8)
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginationQuery {
  page?: number
  limit?: number
}

// Result type — use instead of try/catch in service returns
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// Augment Express Request to carry user after auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
```

---

## Barrel Export

```ts
// backend/src/types/index.ts
export * from "./auth.types.ts"
export * from "./common.types.ts"
// Add new domain types here as project grows
```

---

## Usage Rules

```
□ Import types from "@/types" barrel only — never from concrete files
□ DTOs for input (what caller sends)
□ Domain models for output (what service returns)
□ Never expose passwordHash in User return type — strip at repository layer
□ IRepository interface = source of truth for what repository must implement
□ IService interface = source of truth for what controller can call
```
