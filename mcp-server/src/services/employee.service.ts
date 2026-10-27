import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  CreateEmployeeInput,
  ListEmployeesInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "../schemas/employee.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class EmployeeService {
  private client(session: SessionData) {
    return createAuthedClient(session)
  }

  private handleError(error: any, fallback: string): never {
    if (error.response) {
      throw new Error(
        error.response.data?.message || error.response.data?.error?.message || fallback,
      )
    }
    throw new Error(`Connection error: ${error.message}`)
  }

  async list(session: SessionData, params?: ListEmployeesInput) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BASE, {
        params,
      })
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list employees")
    }
  }

  async listApprovers(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.APPROVERS)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to list approvers")
    }
  }

  async getOne(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch employee")
    }
  }

  async create(session: SessionData, data: CreateEmployeeInput) {
    try {
      const res = await this.client(session).post(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BASE, data)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create employee")
    }
  }

  async update(session: SessionData, id: string, data: UpdateEmployeeInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update employee")
    }
  }

  async updateStatus(session: SessionData, id: string, data: UpdateEmployeeStatusInput) {
    try {
      const res = await this.client(session).patch(
        DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.STATUS(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update employee status")
    }
  }

  async delete(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(DEVCORE_API_CONSTANTS.ENDPOINTS.EMPLOYEE.BY_ID(id))
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete employee")
    }
  }
}

export const employeeService = new EmployeeService()
