import { DEVCORE_API_CONSTANTS } from "../constants/devcore-api.constants.js"
import type {
  CreatePayslipTemplateInput,
  CreateSalaryComponentInput,
  CreateSalaryVariableInput,
  GeneratePayrollInput,
  RejectPayrollInput,
  SetSalaryConfigInput,
  UpdatePayrollSettingsInput,
  UpdatePayslipTemplateInput,
  UpdateSalaryComponentInput,
  UpdateSalaryVariableInput,
  ValidateFormulaInput,
} from "../schemas/payroll.schema.js"
import { SessionData } from "../types/session.types.js"
import { createAuthedClient } from "../utils/devcore-client.js"

export class PayrollService {
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

  // ─── Salary Components ────────────────────────────────────────────────────────

  async listSalaryComponents(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENTS,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch salary components")
    }
  }

  async createSalaryComponent(session: SessionData, data: CreateSalaryComponentInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENTS,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create salary component")
    }
  }

  async updateSalaryComponent(session: SessionData, id: string, data: UpdateSalaryComponentInput) {
    try {
      const res = await this.client(session).put(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update salary component")
    }
  }

  async deleteSalaryComponent(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete salary component")
    }
  }

  async validateFormula(session: SessionData, data: ValidateFormulaInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_COMPONENT_VALIDATE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to validate formula")
    }
  }

  // ─── Salary Variables ─────────────────────────────────────────────────────────

  async listSalaryVariables(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLES,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch salary variables")
    }
  }

  async getSalaryVariable(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch salary variable")
    }
  }

  async createSalaryVariable(session: SessionData, data: CreateSalaryVariableInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLES,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create salary variable")
    }
  }

  async updateSalaryVariable(session: SessionData, id: string, data: UpdateSalaryVariableInput) {
    try {
      const res = await this.client(session).put(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update salary variable")
    }
  }

  async deleteSalaryVariable(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.SALARY_VARIABLE_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete salary variable")
    }
  }

  // ─── Payslip Templates ────────────────────────────────────────────────────────

  async listPayslipTemplates(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch payslip templates")
    }
  }

  async createPayslipTemplate(session: SessionData, data: CreatePayslipTemplateInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATES,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to create payslip template")
    }
  }

  async updatePayslipTemplate(session: SessionData, id: string, data: UpdatePayslipTemplateInput) {
    try {
      const res = await this.client(session).put(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATE_BY_ID(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update payslip template")
    }
  }

  async deletePayslipTemplate(session: SessionData, id: string) {
    try {
      const res = await this.client(session).delete(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYSLIP_TEMPLATE_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to delete payslip template")
    }
  }

  // ─── Employee Salary Config ───────────────────────────────────────────────────

  async getEmployeeSalaryConfig(session: SessionData, empId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG(empId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch employee salary config")
    }
  }

  async getEmployeeSalaryConfigHistory(session: SessionData, empId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG_HISTORY(empId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch employee salary config history")
    }
  }

  async setEmployeeSalaryConfig(session: SessionData, empId: string, data: SetSalaryConfigInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_SALARY_CONFIG(empId),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to set employee salary config")
    }
  }

  // ─── Payrolls & Payslips ──────────────────────────────────────────────────────

  async getPayrollSettings(session: SessionData) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_SETTINGS,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch payroll settings")
    }
  }

  async updatePayrollSettings(session: SessionData, data: UpdatePayrollSettingsInput) {
    try {
      const res = await this.client(session).put(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_SETTINGS,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to update payroll settings")
    }
  }

  async generatePayroll(session: SessionData, data: GeneratePayrollInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_GENERATE,
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to generate payroll")
    }
  }

  async listPayrolls(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLLS)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch payrolls")
    }
  }

  async getPayroll(session: SessionData, id: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_BY_ID(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch payroll")
    }
  }

  async approvePayroll(session: SessionData, id: string) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_APPROVE(id),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to approve payroll")
    }
  }

  async rejectPayroll(session: SessionData, id: string, data: RejectPayrollInput) {
    try {
      const res = await this.client(session).post(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_REJECT(id),
        data,
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to reject payroll")
    }
  }

  async getPayslip(session: SessionData, payrollId: string, empId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.PAYROLL_PAYSLIP(payrollId, empId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch payslip")
    }
  }

  async getEmployeePayslips(session: SessionData, empId: string) {
    try {
      const res = await this.client(session).get(
        DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.EMPLOYEE_PAYSLIPS(empId),
      )
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch employee payslips")
    }
  }

  async getMyPayslips(session: SessionData) {
    try {
      const res = await this.client(session).get(DEVCORE_API_CONSTANTS.ENDPOINTS.PAYROLL.MY_PAYSLIPS)
      return res.data
    } catch (e: any) {
      this.handleError(e, "Failed to fetch my payslips")
    }
  }
}

export const payrollService = new PayrollService()
