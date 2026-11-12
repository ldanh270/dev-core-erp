import type { NavigateFunction, NavigateOptions } from "react-router-dom"

/**
 * Singleton navigator for use outside React components.
 *
 * Problem: React Router's `useNavigate()` can only be called inside React components.
 * Services like Axios interceptors, Zustand actions, or utility functions live
 * outside the React tree and cannot call hooks.
 *
 * Solution: Store the `navigate` function from `useNavigate()` in a module-level
 * ref, then read it from anywhere in the app.
 *
 * Usage:
 * 1. Inject once at the app root via the `NavigatorInjector` component (see App.tsx).
 * 2. Call `routerNavigate(path, options)` from any non-React module.
 *
 * @example — inside an Axios interceptor
 * ```ts
 * import { routerNavigate } from "@/lib/router-navigator"
 * routerNavigate(ROUTES.AUTH.LOGIN, { replace: true })
 * ```
 */
let _navigate: NavigateFunction | null = null

/**
 * Called once by `NavigatorInjector` in App.tsx to register the navigate fn.
 * Do NOT call this from anywhere else.
 *
 * @param navigate - React Router navigate function instance
 */
export const setNavigate = (navigate: NavigateFunction): void => {
  _navigate = navigate
}

/**
 * Navigates programmatically from outside a React component tree without hard reload.
 * Falls back to validated `window.location.assign` if the navigator is not yet initialised.
 *
 * @param to - Target route path string
 * @param options - Optional React Router navigation options (e.g. replace, state)
 */
export const routerNavigate = (to: string, options?: NavigateOptions): void => {
  if (_navigate) {
    _navigate(to, options)
  } else {
    // Fallback: navigator not ready yet (should be extremely rare)
    // Security: Strict validation via URL API to clear static analysis taint
    try {
      const parsedUrl = new URL(to, window.location.origin)
      // Only allow redirects to the same origin
      if (parsedUrl.origin === window.location.origin) {
        window.location.assign(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash)
      } else {
        console.error("routerNavigate blocked an unsafe redirection attempt:", to)
        window.location.assign("/")
      }
    } catch {
      window.location.assign("/")
    }
  }
}
