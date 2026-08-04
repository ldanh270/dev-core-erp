# HRP Frontend

React 19 single-page application for operating the Integrated HR and Product System.

## Responsibilities

- Renders workforce, attendance, application, payroll, recruitment, project and security workflows.
- Enforces permission-aware routing after backend authorization revalidation.
- Centralizes authenticated API transport, token refresh and user-facing error feedback.
- Provides shared form, table, drawer, dialog and design-system primitives.

## Technology

| Concern | Implementation |
|---|---|
| Application | React 19, Vite, TypeScript |
| Routing | React Router with lazy public/private routes |
| Server state | TanStack React Query |
| Client state | Zustand with persisted identity cache |
| HTTP | Axios with cookies, Bearer token support and refresh queue |
| Forms | React Hook Form and Zod |
| UI | Tailwind CSS v4, shadcn/Radix primitives, Sonner |

## Structure

```text
src/
├── components/   Shared providers, common components and UI primitives
├── config/       API, routes, subsystems, entity and rule configuration
├── lib/          Axios client, navigation singleton and API modules
├── pages/        Feature pages grouped by business domain
├── routes/       Public/private route configuration and permission metadata
├── schemas/      Client-side validation schemas
├── store/        Zustand stores
└── utils/        Navigation, date, export and domain helpers
```

## Run locally

```powershell
Copy-Item .env.example .env
pnpm dev
```

Set `VITE_API_BASE_URL` to the backend host without `/api`, for example `http://localhost:5000`. When unset, the client uses same-origin `/api`.

Useful commands:

```powershell
pnpm dev
pnpm build
pnpm lint
pnpm lint:styles
```

From the repository root, use `nr dev:frontend` to run this package.

## Authentication and navigation

`api-client.ts` sends credentialed requests, attaches the active access token, and serializes concurrent refresh attempts. A confirmed 401/403 expiration clears the local session; transient authorization failures keep identity cached but route guards fail closed and provide retry behavior.

Use `routerNavigate` from `@/lib/router-navigator` for application navigation. Do not use `window.location.href` for internal routes because it tears down React providers, modals and notifications.

## UI implementation rules

- Use semantic design tokens, never raw color literals.
- Buttons, inputs and badges use `rounded-full`.
- Primary containers use `rounded-xl`; nested wrappers use `rounded-lg`.
- Use shared API clients and centralized enum configuration rather than re-creating request shapes or status values.
- Follow [the frontend design specification](../docs/frontend-design-spec.md) and [the enterprise architecture reference](../docs/enterprise-project-documentation.md).
