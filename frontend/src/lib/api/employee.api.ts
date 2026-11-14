import apiClient from "@/lib/api-client"
import type {
  CreateEmployeeDto,
  Employee,
  EmployeeListQuery,
  PaginatedEmployees,
  UpdateEmployeeDto,
  UpdateStatusDto,
} from "@/types/employee.types"

interface ApiResponse<T> {
  data: T
  error: { message: string; code?: string } | null
  status?: string
}

/**
 * HTTP API client for employee master data operations.
 */
export const employeeApi = {
  /**
   * Fetches paginated employee records based on optional query filters.
   *
   * @param query - Filter, search, and pagination parameters
   * @returns Paginated list of employees
   */
  list: async (query?: EmployeeListQuery): Promise<PaginatedEmployees> => {
    const response = await apiClient.get<ApiResponse<PaginatedEmployees>>("/employees", {
      params: query,
    })
    return response.data.data
  },

  /**
   * Fetches a single employee by unique ID.
   *
   * @param id - Employee ID
   * @returns Employee details
   */
  getOne: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`)
    return response.data.data
  },

  /**
   * Creates a new employee record.
   *
   * @param data - Employee creation data payload
   * @returns Created employee record
   */
  create: async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.post<ApiResponse<Employee>>("/employees", data)
    return response.data.data
  },

  /**
   * Updates fields of an existing employee record.
   *
   * @param id - Employee ID to update
   * @param data - Updated employee fields
   * @returns Updated employee record
   */
  update: async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, data)
    return response.data.data
  },

  /**
   * Updates employment status (e.g. active, probation, terminated).
   *
   * @param id - Employee ID
   * @param data - Status update payload
   * @returns Updated employee record
   */
  updateStatus: async (id: string, data: UpdateStatusDto): Promise<Employee> => {
    const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}/status`, data)
    return response.data.data
  },

  /**
   * Fetches list of employees eligible to act as workflow approvers.
   *
   * @returns Array of approver employee summaries
   */
  getApprovers: async (): Promise<IApprover[]> => {
    const response = await apiClient.get<ApiResponse<IApprover[]>>("/employees/approvers")
    return response.data.data
  },
}

/**
 * Summary representation of an approver employee.
 */
export interface IApprover {
  id: string
  fullName: string
  role: string
  position: string | null
}
