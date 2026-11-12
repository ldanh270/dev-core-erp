import type {
  ComponentType,
  ComponentValueType,
  EmployeeSalaryConfig,
  Payroll,
  PayrollStatus,
  Payslip,
  PayslipDetail,
  PayslipTemplate,
  Prisma,
  SalaryComponent,
} from "@prisma/client"
import type { SalaryVariable } from "@prisma/client"

export type PayslipTemplateWithComponents = PayslipTemplate & {
  createdBy: {
    fullName: string
  }
  components: Array<{
    componentId: string
    overrideFormula: string | null
    component: SalaryComponent
  }>
}

export type EmployeeSalaryConfigWithTemplate = EmployeeSalaryConfig & {
  template: PayslipTemplateWithComponents
}

export type PayslipWithDetails = Payslip & {
  details: PayslipDetail[]
  employee?: {
    id: string
    userId: string
    firstName: string
    lastName: string
    email: string
  }
}

export type PayrollWithPayslips = Payroll & {
  payslips: PayslipWithDetails[]
}

export type IMyPayslipSummary = Payslip & {
  periodMonth?: number
  periodYear?: number
  status?: PayrollStatus
  receiptStatus?: IPayslipReceiptStatus
  isPreview?: boolean
  canFeedback?: boolean
  dailyWorkLogs?: IPayslipDailyWorkLog[]
}

export type IPayslipReceiptStatus = "not_received" | "received"

export interface IPayslipDailyWorkLog {
  date: string
  dayOfMonth: number
  employeeShiftId?: string | null
  shiftName?: string | null
  status: string
  workMinutes: number
  workHours: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  checkInAt?: string | null
  checkOutAt?: string | null
  note?: string | null
}

export interface IPayslipFeedbackDTO {
  payslipId: string
  date: string
  reason: string
  checkInAt?: string | null
  checkOutAt?: string | null
}

// ── SalaryVariable ──────────────────────────────────────────────────────────

export interface ISalaryVariableRepository {
  findAll(filter?: { isActive?: boolean }): Promise<SalaryVariable[]>
  findById(id: string): Promise<SalaryVariable | null>
  findByCode(code: string): Promise<SalaryVariable | null>
  create(data: ICreateSalaryVariableDTO & { createdById: string }): Promise<SalaryVariable>
  update(id: string, data: IUpdateSalaryVariableDTO): Promise<SalaryVariable>
  softDelete(id: string): Promise<void>
}

export interface ISalaryVariableService {
  listVariables(filter?: { isActive?: boolean }): Promise<SalaryVariable[]>
  getVariable(id: string): Promise<SalaryVariable>
  createVariable(data: ICreateSalaryVariableDTO, createdById: string): Promise<SalaryVariable>
  updateVariable(id: string, data: IUpdateSalaryVariableDTO): Promise<SalaryVariable>
  deleteVariable(id: string): Promise<void>
}

export interface ICreateSalaryVariableDTO {
  code: string
  name: string
  value: number
  description?: string
}

export interface IUpdateSalaryVariableDTO extends Partial<ICreateSalaryVariableDTO> {
  isActive?: boolean
}

// ── SalaryComponent ──────────────────────────────────────────────────────────

export interface ISalaryComponentRepository {
  findAll(filter: { type?: ComponentType; isActive?: boolean }): Promise<SalaryComponent[]>
  findById(id: string): Promise<SalaryComponent | null>
  create(data: ICreateSalaryComponentDTO & { createdById: string }): Promise<SalaryComponent>
  update(id: string, data: IUpdateSalaryComponentDTO): Promise<SalaryComponent>
  softDelete(id: string): Promise<void> // isActive = false
}

export interface ISalaryComponentService {
  listComponents(filter: { type?: ComponentType; isActive?: boolean }): Promise<SalaryComponent[]>
  createComponent(data: ICreateSalaryComponentDTO, createdById: string): Promise<SalaryComponent>
  updateComponent(id: string, data: IUpdateSalaryComponentDTO): Promise<SalaryComponent>
  deleteComponent(id: string): Promise<void>
  validateFormula(formula: string): Promise<{ valid: boolean; error?: string }>
}

export interface ICreateSalaryComponentDTO {
  code?: string
  name: string
  type: ComponentType
  valueType?: ComponentValueType
  formula: string
  description?: string
}
export interface IUpdateSalaryComponentDTO extends Partial<ICreateSalaryComponentDTO> {
  isActive?: boolean
}

// ── PayslipTemplate ──────────────────────────────────────────────────────────

export interface IPayslipTemplateRepository {
  findAll(filter: { isActive?: boolean }): Promise<PayslipTemplateWithComponents[]>
  findById(id: string): Promise<PayslipTemplateWithComponents | null>
  create(data: ICreatePayslipTemplateDTO, createdById: string): Promise<PayslipTemplate>
  update(id: string, data: IUpdatePayslipTemplateDTO): Promise<PayslipTemplate>
  softDelete(id: string): Promise<void>
}

export interface IPayslipTemplateService {
  listTemplates(filter: { isActive?: boolean }): Promise<PayslipTemplateWithComponents[]>
  createTemplate(
    data: ICreatePayslipTemplateDTO,
    createdById: string,
  ): Promise<PayslipTemplateWithComponents>
  updateTemplate(
    id: string,
    data: IUpdatePayslipTemplateDTO,
  ): Promise<PayslipTemplateWithComponents>
  deleteTemplate(id: string): Promise<void>
}

export interface ICreatePayslipTemplateDTO {
  name: string
  description?: string
  components: Array<{ componentId: string; overrideFormula?: string }>
}
export interface IUpdatePayslipTemplateDTO extends Partial<ICreatePayslipTemplateDTO> {
  isActive?: boolean
}

// ── EmployeeSalaryConfig ─────────────────────────────────────────────────────

export interface IEmployeeSalaryConfigRepository {
  findActiveByEmployee(
    employeeId: string,
    atDate: Date,
  ): Promise<EmployeeSalaryConfigWithTemplate | null>
  findActiveByEmployees?(
    employeeIds: string[],
    atDate: Date,
  ): Promise<Map<string, EmployeeSalaryConfigWithTemplate>>
  findAllByEmployee(employeeId: string): Promise<EmployeeSalaryConfig[]>
  create(
    data: ICreateSalaryConfigDTO & { employeeId: string; createdById: string },
  ): Promise<EmployeeSalaryConfig>
  closeCurrentConfig(employeeId: string, effectiveTo: Date): Promise<void>
}

export interface IEmployeeSalaryConfigService {
  getActiveConfig(employeeId: string, atDate?: Date): Promise<EmployeeSalaryConfig>
  getConfigHistory(employeeId: string): Promise<EmployeeSalaryConfig[]>
  assignConfig(
    employeeId: string,
    data: ICreateSalaryConfigDTO,
    createdById: string,
  ): Promise<EmployeeSalaryConfig>
  bulkAssignTemplate(
    data: IBulkAssignSalaryTemplateDTO,
    createdById: string,
  ): Promise<{ assignedCount: number }>
}

export interface ICreateSalaryConfigDTO {
  templateId: string
  baseSalary: number
  effectiveFrom: Date
  note?: string
}

export interface IBulkAssignSalaryTemplateDTO {
  employeeIds: string[]
  templateId: string
  defaultBaseSalary: number
  effectiveFrom: Date
  note?: string
}

// ── Payroll Computation ──────────────────────────────────────────────────────

export interface IPayrollRepository {
  findByPeriod(month: number, year: number, name: string): Promise<Payroll | null>
  findById(id: string): Promise<Payroll | null>
  findAll(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]>
  create(data: { periodMonth: number; periodYear: number; name: string }): Promise<Payroll>
  updateStatus(id: string, data: IUpdatePayrollStatusDTO): Promise<Payroll>
  updateTotalAmount(id: string, totalAmount: Prisma.Decimal): Promise<void>
}

export interface IPayslipRepository {
  findByPayroll(payrollId: string): Promise<PayslipWithDetails[]>
  findByEmployee(employeeId: string): Promise<Payslip[]>
  findOne(payrollId: string, employeeId: string): Promise<PayslipWithDetails | null>
  createWithDetails(data: ICreatePayslipDTO): Promise<Payslip>
}

export interface IPayrollService {
  generatePayroll(month: number, year: number, name?: string): Promise<Payroll>
  getPayroll(month: number, year: number, name?: string): Promise<Payroll>

  getPayrollById(id: string): Promise<PayrollWithPayslips>
  listPayrolls(filter: { status?: PayrollStatus; year?: number }): Promise<Payroll[]>
  approvePayroll(payrollId: string, approverId: string): Promise<Payroll>
  rejectPayroll(payrollId: string, approverId: string, reason: string): Promise<Payroll>
  getPayslip(payrollId: string, employeeId: string): Promise<PayslipWithDetails>
  getMyPayslips(employeeId: string): Promise<IMyPayslipSummary[]>
  submitMyPayslipFeedback(employeeId: string, data: IPayslipFeedbackDTO): Promise<unknown>
}

export interface IUpdatePayrollStatusDTO {
  status: PayrollStatus
  approvedById?: string
  approvedAt?: Date
  rejectReason?: string
}

export interface ICreatePayslipDTO {
  payrollId: string
  employeeId: string
  salaryConfigId: string
  totalAdditions: number
  totalDeductions: number
  netSalary: number
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  details: Array<{
    componentId: string
    name: string // snapshot
    type: ComponentType // snapshot
    value: number
  }>
}

// ── Formula Context ──────────────────────────────────────────────────────────

export interface IFormulaContext {
  [key: string]: number
  // From EmployeeSalaryConfig
  baseSalary: number

  // From AttendanceRecord aggregate
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  holidayDays: number
}

export interface IAttendanceSummary {
  workingDays: number
  absentDays: number
  overtimeMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  holidayDays: number
}
