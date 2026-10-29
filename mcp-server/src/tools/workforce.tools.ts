import { z } from "zod"

import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import { mcpServer } from "../mcp.js"
import { createAuthedClient } from "../utils/devcore-client.js"
import { requireSession } from "../utils/session-guard.js"
import { buildError, buildSuccess } from "../utils/tool-response.js"

export const registerWorkforceTools = () => {
  mcpServer.tool("employee_contract_list", "List employee contracts visible to the authenticated user.", { sessionId: z.string(), employeeId: z.string().optional() }, async ({ sessionId, employeeId }) => {
    try {
      const session = requireSession(sessionId)
      const endpoint = employeeId ? DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE_CONTRACT.BY_EMPLOYEE(employeeId) : DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE_CONTRACT.BASE
      return buildSuccess((await createAuthedClient(session).get(endpoint)).data)
    } catch (error: unknown) {
      return buildError("Failed to list employee contracts", error instanceof Error ? error.message : String(error))
    }
  })

  mcpServer.tool("employee_contract_expiring", "List contracts that are approaching expiry.", { sessionId: z.string(), days: z.number().int().positive().max(365).optional() }, async ({ sessionId, days }) => {
    try {
      const session = requireSession(sessionId)
      return buildSuccess((await createAuthedClient(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE_CONTRACT.EXPIRING, { params: { days } })).data)
    } catch (error: unknown) {
      return buildError("Failed to list expiring contracts", error instanceof Error ? error.message : String(error))
    }
  })

  mcpServer.tool("part_time_availability_get_mine", "Get your part-time availability declaration.", { sessionId: z.string(), weekStart: z.string().optional() }, async ({ sessionId, weekStart }) => {
    try {
      const session = requireSession(sessionId)
      return buildSuccess((await createAuthedClient(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PART_TIME_AVAILABILITY.MINE, { params: { weekStart } })).data)
    } catch (error: unknown) {
      return buildError("Failed to fetch part-time availability", error instanceof Error ? error.message : String(error))
    }
  })

  mcpServer.tool("part_time_availability_list", "List part-time availability declarations for a week. Requires attendance.update permission.", { sessionId: z.string(), weekStart: z.string() }, async ({ sessionId, weekStart }) => {
    try {
      const session = requireSession(sessionId)
      return buildSuccess((await createAuthedClient(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PART_TIME_AVAILABILITY.BASE, { params: { weekStart } })).data)
    } catch (error: unknown) {
      return buildError("Failed to list part-time availability", error instanceof Error ? error.message : String(error))
    }
  })
}
