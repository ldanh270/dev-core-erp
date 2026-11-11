const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/** Absolute backend URL in production; same-origin /api when no env is configured. */
export const API_BASE_URL = configuredApiBaseUrl
  ? `${configuredApiBaseUrl.replace(/\/$/, "")}${configuredApiBaseUrl.endsWith("/api") ? "" : "/api"}`
  : "/api"

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    VALIDATE_RESET_TOKEN: "/auth/validate-reset-token",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PAYROLL: {
    BASE: "/payrolls",
    MY_PAYSLIPS: "/payrolls/my/payslips",
    MY_PAYSLIP_FEEDBACK: (payslipId: string) => `/payrolls/my/payslips/${payslipId}/feedback`,
    GENERATE: "/payrolls/generate",
    SETTINGS: "/payrolls/settings",
    SALARY_COMPONENTS: "/salary-components",
    PAYSLIP_TEMPLATES: "/payslip-templates",
    EMPLOYEE_SALARY_CONFIG: "/employees",
    BULK_ASSIGN_SALARY_TEMPLATE: "/employees/salary-config/bulk-assign",
  },
  ATTENDANCE: {
    BASE: "/attendance",
    CHECK_IN: "/attendance/check-in",
    CHECK_OUT: "/attendance/check-out",
    SCAN: "/attendance/scan",
    EXPORT: "/attendance/export",
    MATRIX: "/attendance/matrix",
  },
  SHIFTS: {
    BASE: "/shifts",
  },
  SCHEDULES: {
    BASE: "/schedules",
    MY: "/schedules/my",
    MY_WEEK: "/schedules/my/week",
    MY_ALL: "/schedules/my/all",
    MY_SHIFTS: "/schedules/my/shifts",
    ASSIGN: "/schedules/assign",
    OVERRIDE: "/schedules/override",
    GENERATE_PREVIEW: "/schedules/generate/preview",
    GENERATE: "/schedules/generate",
    SETTINGS: "/schedules/settings",
    EMPLOYEE: (employeeId: string) => `/schedules/employee/${employeeId}`,
    EMPLOYEE_WEEK: (employeeId: string) => `/schedules/employee/${employeeId}/week`,
    EMPLOYEE_ALL: (employeeId: string) => `/schedules/employee/${employeeId}/all`,
    EMPLOYEE_SHIFTS: (employeeId: string) => `/schedules/employee/${employeeId}/shifts`,
  },
  SHIFT_CHANGE_REQUESTS: {
    BASE: "/shift-change-requests",
    MINE: "/shift-change-requests/mine",
  },
  APPROVALS: {
    BASE: "/approvals",
    APPLICATION: (id: string) => `/approvals/application/${id}`,
  },
  HOLIDAYS: {
    BASE: "/holidays",
  },
  WEEKLY_SCHEDULE_TEMPLATES: {
    BASE: "/weekly-schedule-templates",
    APPLY: (id: string) => `/weekly-schedule-templates/${id}/apply`,
  },
  /** Part-time weekly availability — employee submit + admin assign-shifts. */
  PART_TIME_AVAILABILITIES: {
    BASE: "/part-time-availabilities",
    MINE: "/part-time-availabilities/mine",
    EMPLOYEE: (employeeId: string) => `/part-time-availabilities/employee/${employeeId}`,
    APPROVE: (id: string) => `/part-time-availabilities/${id}/approve`,
    REJECT: (id: string) => `/part-time-availabilities/${id}/reject`,
    /** Admin read-only greedy suggestions — confirm via ASSIGN_SHIFTS. */
    SUGGEST: "/part-time-availabilities/suggest",
    /** Admin creates EmployeeShift rows from submitted availability. */
    ASSIGN_SHIFTS: (id: string) => `/part-time-availabilities/${id}/assign-shifts`,
  },
  SECURITY: {
    DASHBOARD: "/security/dashboard",
    LOCKED_ACCOUNTS: "/security/locked-accounts",
    UNLOCK: (employeeId: string) => `/security/unlock/${employeeId}`,
    ACTIVITY_LOGS: "/audit",
    MY_ACTIVITY_LOGS: "/auth/me/activity-logs",
    MY_ACTIVITY_LOG_DETAIL: (id: string) => `/auth/me/activity-logs/${id}`,
    ACTIVITY_LOG_DETAIL: (id: string) => `/audit/${id}`,
  },
  ROLES: {
    BASE: "/roles",
    DETAIL: (id: string) => `/roles/${id}`,
    PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    PERMISSION_DETAIL: (id: string, permissionId: string) => `/roles/${id}/permissions/${permissionId}`,
  },
  PERMISSIONS: {
    BASE: "/permissions",
    DETAIL: (id: string) => `/permissions/${id}`,
  },
  EMPLOYEES: {
    ROLES: (id: string) => `/employees/${id}/roles`,
    ROLE_DETAIL: (id: string, roleId: string) => `/employees/${id}/roles/${roleId}`,
  },
  DEBUG: {
    ROUTE_MANIFEST: "/debug/route-manifest",
  },
  NOTIFICATIONS: {
    BASE: "/notifications",
    STREAM: "/notifications/stream",
    UNREAD_COUNT: "/notifications/unread-count",
    READ_ALL: "/notifications/read-all",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    DELETE: (id: string) => `/notifications/${id}`,
  },
} as const
