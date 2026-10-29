export const DEVCORE_API_CONSTANTS = {
  BASE_URL:
    process.env.DEVCORE_API_BASE_URL ||
    process.env.HRP_API_BASE_URL ||
    "http://localhost:5000",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      CHANGE_PASSWORD: "/api/auth/change-password",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      VALIDATE_RESET_TOKEN: "/api/auth/validate-reset-token",
      RESET_PASSWORD: "/api/auth/reset-password",
      ACTIVITY_LOGS: "/api/auth/activity-logs",
      ACTIVITY_LOG_BY_ID: (id: string) => `/api/auth/activity-logs/${id}`,
    },
    SECURITY: {
      DASHBOARD: "/api/security/dashboard",
      LOCKED_ACCOUNTS: "/api/security/locked-accounts",
      UNLOCK: (employeeId: string) => `/api/security/unlock/${employeeId}`,
    },
    EMPLOYEE: {
      BASE: "/api/employees",
      APPROVERS: "/api/employees/approvers",
      BY_ID: (id: string) => `/api/employees/${id}`,
      STATUS: (id: string) => `/api/employees/${id}/status`,
    },
    PROFILE: {
      ME: "/api/profile/me",
      AVATAR: "/api/profile/me/avatar",
      CHANGE_PASSWORD: "/api/profile/me/change-password",
      LINK_EMPLOYEE: "/api/profile/me/personal-employee-link",
    },
    APPLICATION: {
      BASE: "/api/applications",
      ME: "/api/applications/me",
      BY_ID: (id: string) => `/api/applications/${id}`,
      CANCEL: (id: string) => `/api/applications/${id}/cancel`,
      APPROVE: (id: string) => `/api/applications/${id}/approve`,
      REJECT: (id: string) => `/api/applications/${id}/reject`,
      BY_EMPLOYEE: (employeeId: string) => `/api/applications/employee/${employeeId}`,
    },
    APPROVAL: {
      BASE: "/api/approvals",
      PROCESS: (category: string, id: string) => `/api/approvals/${category}/${id}`,
    },
    REGIME_CATEGORY: {
      BASE: "/api/regime-categories",
      BY_ID: (id: string) => `/api/regime-categories/${id}`,
    },
    EMPLOYEE_CONTRACT: {
      BASE: "/api/employee-contracts",
      EXPIRING: "/api/employee-contracts/expiring",
      BY_EMPLOYEE: (id: string) => `/api/employee-contracts/employee/${id}`,
    },
    PART_TIME_AVAILABILITY: {
      MINE: "/api/part-time-availabilities/mine",
      BASE: "/api/part-time-availabilities",
      BY_EMPLOYEE: (id: string) => `/api/part-time-availabilities/employee/${id}`,
    },
    ATTENDANCE: {
      BASE: "/api/attendance",
      CHECK_IN: "/api/attendance/check-in",
      CHECK_OUT: "/api/attendance/check-out",
      SCAN: "/api/attendance/scan",
      EXPORT: "/api/attendance/export",
    },
    SHIFTS: {
      BASE: "/api/shifts",
      BY_ID: (id: string) => `/api/shifts/${id}`,
      SCHEDULES_MY: "/api/schedules/my",
      SCHEDULES_MY_ALL: "/api/schedules/my/all",
      SCHEDULES_EMPLOYEE: (empId: string) => `/api/schedules/employee/${empId}`,
      SCHEDULES_EMPLOYEE_ALL: (empId: string) => `/api/schedules/employee/${empId}/all`,
      SCHEDULES_ASSIGN: "/api/schedules/assign",
      SCHEDULES_OVERRIDE: "/api/schedules/override",
      SCHEDULES_GENERATE_PREVIEW: "/api/schedules/generate/preview",
      SCHEDULES_GENERATE: "/api/schedules/generate",
      SCHEDULES_SETTINGS: "/api/schedules/settings",
      SHIFT_CHANGE_REQUESTS: "/api/shift-change-requests",
      SHIFT_CHANGE_MINE: "/api/shift-change-requests/mine",
      SHIFT_CHANGE_APPROVE: (id: string) => `/api/shift-change-requests/${id}/approve`,
      SHIFT_CHANGE_REJECT: (id: string) => `/api/shift-change-requests/${id}/reject`,
    },
    WEEKLY_TEMPLATE: {
      BASE: "/api/weekly-schedule-templates",
      BY_ID: (id: string) => `/api/weekly-schedule-templates/${id}`,
      APPLY: (id: string) => `/api/weekly-schedule-templates/${id}/apply`,
    },
    HOLIDAY: {
      BASE: "/api/holidays",
      CHECK: "/api/holidays/check",
      BY_ID: (id: string) => `/api/holidays/${id}`,
    },
    PAYROLL: {
      SALARY_COMPONENTS: "/api/salary-components",
      SALARY_COMPONENT_BY_ID: (id: string) => `/api/salary-components/${id}`,
      SALARY_COMPONENT_VALIDATE: "/api/salary-components/validate",
      SALARY_VARIABLES: "/api/salary-variables",
      SALARY_VARIABLE_BY_ID: (id: string) => `/api/salary-variables/${id}`,
      PAYSLIP_TEMPLATES: "/api/payslip-templates",
      PAYSLIP_TEMPLATE_BY_ID: (id: string) => `/api/payslip-templates/${id}`,
      EMPLOYEE_SALARY_CONFIG: (empId: string) => `/api/employees/${empId}/salary-config`,
      EMPLOYEE_SALARY_CONFIG_HISTORY: (empId: string) =>
        `/api/employees/${empId}/salary-config/history`,
      PAYROLLS: "/api/payrolls",
      PAYROLL_BY_ID: (id: string) => `/api/payrolls/${id}`,
      PAYROLL_SETTINGS: "/api/payrolls/settings",
      PAYROLL_GENERATE: "/api/payrolls/generate",
      PAYROLL_APPROVE: (id: string) => `/api/payrolls/${id}/approve`,
      PAYROLL_REJECT: (id: string) => `/api/payrolls/${id}/reject`,
      PAYROLL_PAYSLIP: (payrollId: string, empId: string) =>
        `/api/payrolls/${payrollId}/payslips/${empId}`,
      EMPLOYEE_PAYSLIPS: (empId: string) => `/api/payrolls/employee/${empId}/payslips`,
      MY_PAYSLIPS: "/api/payrolls/my/payslips",
    },
    PROJECTS: {
      BASE: "/api/projects",
      BY_ID: (id: string) => `/api/projects/${id}`,
      MEMBERS: (id: string) => `/api/projects/${id}/members`,
      MEMBER_BY_ID: (projectId: string, empId: string) =>
        `/api/projects/${projectId}/members/${empId}`,
      CATEGORIES: (projectId: string) => `/api/projects/${projectId}/categories`,
      CATEGORY_BY_ID: (projectId: string, catId: string) =>
        `/api/projects/${projectId}/categories/${catId}`,
      TASKS: "/api/tasks",
      TASK_BY_ID: (id: string) => `/api/tasks/${id}`,
      SPENT_TIMES: "/api/spent-times",
      SPENT_TIME_BY_ID: (id: string) => `/api/spent-times/${id}`,
    },
  },
}

export const HRP_API_CONSTANTS = DEVCORE_API_CONSTANTS
