import apiClient from "@/lib/api-client.ts"
import type {
  IPayroll,
  IPayrollWithPayslips,
  IPayslipTemplate,
  ISalaryComponent,
} from "@/types/payroll.types.ts"

// --- Salary Components ---

/**
 * Fetches salary components optionally filtered by component type and active status.
 *
 * @param params - Optional query filter for type (earning, deduction) and isActive
 * @returns Array of salary components
 */
export const getSalaryComponents = async (params?: { type?: string; isActive?: boolean }) => {
  const response = await apiClient.get<{ data: ISalaryComponent[] }>("/salary-components", {
    params,
  })
  return response.data.data
}

/**
 * Creates a new salary component.
 *
 * @param data - Salary component creation payload
 * @returns Created salary component
 */
export const createSalaryComponent = async (data: Partial<ISalaryComponent>) => {
  const response = await apiClient.post<{ data: ISalaryComponent }>("/salary-components", data)
  return response.data.data
}

// --- Payslip Templates ---

/**
 * Fetches payslip templates with optional active state filter.
 *
 * @param params - Optional isActive query filter
 * @returns Array of payslip templates
 */
export const getPayslipTemplates = async (params?: { isActive?: boolean }) => {
  const response = await apiClient.get<{ data: IPayslipTemplate[] }>("/payslip-templates", {
    params,
  })
  return response.data.data
}

/**
 * Payload required to construct or configure a payslip template.
 */
export interface ICreatePayslipTemplatePayload {
  name: string
  description?: string
  components: Array<{
    componentId: string
    overrideFormula?: string
  }>
}

/**
 * Creates a new payslip template with assigned salary components.
 *
 * @param data - Payslip template definition
 * @returns Created payslip template
 */
export const createPayslipTemplate = async (data: ICreatePayslipTemplatePayload) => {
  const response = await apiClient.post<{ data: IPayslipTemplate }>("/payslip-templates", data)
  return response.data.data
}

/**
 * Updates an existing payslip template.
 *
 * @param id - Payslip template ID
 * @param data - Update fields
 * @returns Updated template
 */
export const updatePayslipTemplate = async (
  id: string,
  data: Partial<ICreatePayslipTemplatePayload> & { isActive?: boolean },
) => {
  const response = await apiClient.put<{ data: IPayslipTemplate }>(`/payslip-templates/${id}`, data)
  return response.data.data
}

/**
 * Deletes a payslip template by ID.
 *
 * @param id - Payslip template ID to remove
 * @returns API response acknowledgement
 */
export const deletePayslipTemplate = async (id: string) => {
  const response = await apiClient.delete(`/payslip-templates/${id}`)
  return response.data
}

// --- Payrolls ---

/**
 * Fetches list of payroll periods/runs.
 *
 * @param params - Optional status or year filters
 * @returns Array of payroll periods
 */
export const getPayrolls = async (params?: { status?: string; year?: number }) => {
  const response = await apiClient.get<{ data: IPayroll[] }>("/payrolls", { params })
  return response.data.data
}

/**
 * Fetches full details for a specific payroll run including all generated employee payslips.
 *
 * @param id - Payroll ID
 * @returns Payroll run with nested payslip records
 */
export const getPayrollDetails = async (id: string) => {
  const response = await apiClient.get<{ data: IPayrollWithPayslips }>(`/payrolls/${id}`)
  return response.data.data
}

/**
 * Triggers batch payroll generation for the given month and year.
 *
 * @param data - Month, year, and optional title for the payroll run
 * @returns Newly generated payroll run record
 */
export const generatePayroll = async (data: { month: number; year: number; name?: string }) => {
  const response = await apiClient.post<{ data: IPayroll }>("/payrolls/generate", data)
  return response.data.data
}

/**
 * Approves a generated payroll run, advancing its workflow status.
 *
 * @param id - Payroll ID to approve
 * @returns Updated payroll record
 */
export const approvePayroll = async (id: string) => {
  const response = await apiClient.post<{ data: IPayroll }>(`/payrolls/${id}/approve`)
  return response.data.data
}

/**
 * Rejects a generated payroll run with an explanation reason.
 *
 * @param id - Payroll ID to reject
 * @param reason - Rejection rationale
 * @returns Updated payroll record
 */
export const rejectPayroll = async (id: string, reason: string) => {
  const response = await apiClient.post<{ data: IPayroll }>(`/payrolls/${id}/reject`, { reason })
  return response.data.data
}
