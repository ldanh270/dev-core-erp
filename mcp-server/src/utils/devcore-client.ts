import axios, { AxiosInstance } from "axios"

import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import { logger } from "./logger.js"

/**
 * Attach request/response interceptors for debug logging.
 * Logs method, URL, status, duration, and error details.
 */
function attachLoggingInterceptors(client: AxiosInstance, label: string): void {
  client.interceptors.request.use((config) => {
    const method = config.method?.toUpperCase() ?? "?"
    const url = config.url ?? ""
    logger.http(`→ [${label}] ${method} ${url}`)
    if (process.env.DEBUG === "true" && config.data) {
      logger.debug(`  Body:`, config.data)
    }
    const authHeader = config.headers?.["Authorization"] || config.headers?.authorization
    if (label === "authed") {
      logger.debug(`  Auth Header:`, authHeader)
    }
    // Attach start time for duration tracking
    ;(config as any)._startTime = Date.now()
    return config
  })

  client.interceptors.response.use(
    (response) => {
      const elapsed = Date.now() - ((response.config as any)._startTime ?? Date.now())
      const method = response.config.method?.toUpperCase() ?? "?"
      const url = response.config.url ?? ""
      logger.success(`← [${label}] ${method} ${url} ${response.status} (${elapsed}ms)`)
      return response
    },
    (error) => {
      const config = error.config ?? {}
      const elapsed = Date.now() - ((config as any)._startTime ?? Date.now())
      const method = config.method?.toUpperCase() ?? "?"
      const url = config.url ?? ""
      const status = error.response?.status ?? "ERR"
      const message = error.response?.data?.message ?? error.message ?? "Unknown error"
      logger.error(`← [${label}] ${method} ${url} ${status} (${elapsed}ms) — ${message}`)
      if (process.env.DEBUG === "true" && error.response?.data) {
        logger.debug(`  Response body:`, error.response.data)
      }
      return Promise.reject(error)
    },
  )
}

/**
 * Default HTTP Client without authentication (Used for login, forgot-password, etc.)
 */
export const devcoreClient = axios.create({
  baseURL: DEVCORE_API_CONSTANTS.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})
attachLoggingInterceptors(devcoreClient, "public")

export const hrpClient = devcoreClient

/**
 * Create an HTTP Client with a Bearer token and optional Cookies (Used for authenticated requests)
 */
export const createAuthedClient = (session: { jwt: string; cookies?: string[] }) => {
  const headers: any = {
    "Content-Type": "application/json",
  }

  if (session.jwt) {
    headers["Authorization"] = `Bearer ${session.jwt}`
  }

  if (session.cookies && session.cookies.length > 0) {
    headers["Cookie"] = session.cookies.join("; ")
  }

  const client = axios.create({
    baseURL: DEVCORE_API_CONSTANTS.BASE_URL,
    headers,
    withCredentials: true,
  })
  attachLoggingInterceptors(client, "authed")
  return client
}
