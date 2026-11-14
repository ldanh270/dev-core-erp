/**
 * Export lifecycle states used by security log export flows.
 */
export const EXPORT_STATUS = {
  IDLE: "idle",
  COUNTING: "counting",
  FETCHING: "fetching",
  BUILDING: "building",
  SUCCESS: "success",
  ERROR: "error",
} as const

/**
 * Union type of all export lifecycle states.
 */
export type IExportStatus = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS]

/**
 * Maps activity actions to UI badge variants for security screens.
 */
export const ACTIVITY_ACTION_VARIANTS: Record<
  string,
  "success" | "danger" | "warning" | "neutral" | "info"
> = {
  login: "success",
  logout: "neutral",
  failed_login: "danger",
  account_locked: "danger",
  account_unlocked: "success",
  role_assigned: "success",
  role_revoked: "warning",
  password_changed: "warning",
  // Audit Types
  ROLE_ASSIGNED: "success",
  ROLE_REVOKED: "warning",
  ROLE_REPLACED: "warning",
  PERMISSION_ASSIGNED: "success",
  PERMISSION_REVOKED: "warning",
  PERMISSION_REPLACED: "warning",
  ROLE_CREATED: "success",
  ROLE_UPDATED: "neutral",
  ROLE_DELETED: "danger",
  PERMISSION_CREATED: "success",
  PERMISSION_UPDATED: "neutral",
  PERMISSION_DELETED: "danger",
  EMPLOYEE_DEACTIVATED: "warning",
  EMPLOYEE_DELETED: "danger",
  PART_TIME_SHIFTS_ASSIGNED: "success",
} as const

/**
 * Maps activity actions to Vietnamese UI labels.
 */
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  login: "Đăng nhập",
  logout: "Đăng xuất",
  failed_login: "Đăng nhập thất bại",
  account_locked: "Khóa tài khoản",
  account_unlocked: "Mở khóa tài khoản",
  role_assigned: "Cấp vai trò",
  role_revoked: "Thu hồi vai trò",
  password_changed: "Đổi mật khẩu",
  // Audit Types
  ROLE_ASSIGNED: "Cấp vai trò",
  ROLE_REVOKED: "Thu hồi vai trò",
  ROLE_REPLACED: "Cập nhật vai trò",
  PERMISSION_ASSIGNED: "Cấp quyền",
  PERMISSION_REVOKED: "Thu hồi quyền",
  PERMISSION_REPLACED: "Cập nhật quyền",
  ROLE_CREATED: "Tạo vai trò",
  ROLE_UPDATED: "Cập nhật vai trò",
  ROLE_DELETED: "Xóa vai trò",
  PERMISSION_CREATED: "Tạo quyền",
  PERMISSION_UPDATED: "Cập nhật quyền",
  PERMISSION_DELETED: "Xóa quyền",
  EMPLOYEE_DEACTIVATED: "Vô hiệu hóa nhân viên",
  EMPLOYEE_DELETED: "Xóa nhân viên",
  PART_TIME_SHIFTS_ASSIGNED: "Phân ca làm việc",
} as const

/**
 * High-level categories assigned to security activity records.
 */
export const SECURITY_ACTIVITY_CATEGORY = {
  SECURITY: "security",
  ROLE: "role",
  PERMISSION: "permission",
  EMPLOYEE: "employee",
} as const

/**
 * Action-name prefixes used to classify audit log records by domain.
 */
export const SECURITY_AUDIT_ACTION_PREFIX = {
  ROLE: "ROLE_",
  PERMISSION: "PERMISSION_",
  EMPLOYEE: "EMPLOYEE_",
} as const

/**
 * Supported scope values for security activity-log queries.
 */
export const SECURITY_QUERY_SCOPE = {
  ALL: "all",
  ME: "me",
} as const

/**
 * Union type of all supported security query scopes.
 */
export type ISecurityQueryScope = (typeof SECURITY_QUERY_SCOPE)[keyof typeof SECURITY_QUERY_SCOPE]

/**
 * Shared query-key segments for React Query caches in the security module.
 */
export const SECURITY_QUERY_KEY = {
  ROOT: "security",
  SUMMARY: "summary",
  LOCKED_ACCOUNTS: "locked-accounts",
  LOGS: "logs",
  DETAIL: "detail",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  EMPLOYEES: "employees",
} as const

/**
 * Maps security categories to UI badge variants.
 */
export const SECURITY_CATEGORY_VARIANTS: Record<
  string,
  "success" | "danger" | "warning" | "neutral" | "info"
> = {
  security: "danger",
  role: "warning",
  permission: "warning",
  employee: "info",
} as const

/**
 * Tabs available in the users-management screen.
 */
export const USERS_MANAGEMENT_TABS = {
  ALL: "all",
  LOCKED: "locked",
} as const

/**
 * Union type of all users-management tab keys.
 */
export type IUsersManagementTab = (typeof USERS_MANAGEMENT_TABS)[keyof typeof USERS_MANAGEMENT_TABS]
