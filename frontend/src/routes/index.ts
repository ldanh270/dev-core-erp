import { ROLE } from "@/config/entities/employee.config.ts"
import { ROUTES } from "@/config/routes.config.ts"

import { type ComponentType, lazy } from "react"

const MainLayout = lazy(() => import("@/layouts/MainLayout.tsx"))

/**
 * Public routes (guest-only: e.g. login, forgot password).
 * Authenticated users are redirected away to their dashboard.
 */
const publicRoutes = [
  {
    path: ROUTES.AUTH.LOGIN,
    component: lazy(() => import("@/pages/auth/Login.tsx")),
    layout: null,
  },
  {
    path: ROUTES.AUTH.RESET_PASSWORD,
    component: lazy(() => import("@/pages/auth/ResetPassword.tsx")),
    layout: null,
  },
]

export interface RouteConfig {
  path: string
  component?: ComponentType
  layout?: ComponentType | null
  permissions?: string[]
  roles?: string[]
  children?: RouteConfig[]
}

/**
 * Open routes (unrestricted: anyone can access with zero authentication,
 * clients/visitors/evaluators can view standalone without login, exactly like an About Us page).
 */
const openRoutes: RouteConfig[] = [
  {
    path: "/database",
    component: lazy(() => import("@/pages/system/DatabaseReference.tsx")),
    layout: null,
  },
  {
    path: "/docs/database",
    component: lazy(() => import("@/pages/system/DatabaseReference.tsx")),
    layout: null,
  },
  {
    path: ROUTES.SETTINGS.DATABASE,
    component: lazy(() => import("@/pages/system/DatabaseReference.tsx")),
    layout: null,
  },
]

const privateRoutes: RouteConfig[] = [
  {
    path: ROUTES.HRM.EMPLOYEES,
    component: lazy(() => import("@/pages/EmployeeList.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.CREATE_EMPLOYEE,
    component: lazy(() => import("@/pages/employees/EmployeeCreate.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.CONTRACTS,
    component: lazy(() => import("@/pages/employees/ContractsPage.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.CREATE_CONTRACT,
    component: lazy(() => import("@/pages/employees/EmployeeContractCreate.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.INSURANCE,
    component: lazy(() => import("@/pages/employees/InsurancePage.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.PROFILE,
    component: lazy(() => import("@/pages/Profile.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.LOGIN_HISTORY,
    component: lazy(() => import("@/pages/security/LoginHistory.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.DASHBOARD,
    component: lazy(() => import("@/pages/attendance/AttendanceTimesheet.tsx")),
    layout: MainLayout,
    permissions: ["attendance.read"],
    roles: [ROLE.ADMIN],
  },
  {
    path: ROUTES.ATTENDANCE.SUMMARY,
    component: lazy(() => import("@/pages/attendance/AttendanceSummary.tsx")),
    layout: MainLayout,
    permissions: ["attendance.read"],
  },
  {
    path: ROUTES.ATTENDANCE.WORK_SCHEDULES,
    component: lazy(() => import("@/pages/attendance/WorkSchedules.tsx")),
    layout: MainLayout,
    permissions: ["attendance.update"],
  },
  {
    path: ROUTES.ATTENDANCE.PART_TIME_AVAILABILITY,
    component: lazy(() => import("@/pages/attendance/PartTimeAvailability.tsx")),
    layout: MainLayout,
    permissions: ["attendance.update"],
  },
  {
    path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULES,
    component: lazy(() => import("@/pages/attendance/WeeklySchedules.tsx")),
    layout: MainLayout,
    permissions: ["attendance.update"],
  },
  {
    path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULE_CONFIG,
    component: lazy(() => import("@/pages/attendance/WeeklyScheduleConfig.tsx")),
    layout: MainLayout,
    permissions: ["attendance.update"],
  },
  {
    path: ROUTES.ATTENDANCE.REAL_SHIFT,
    component: lazy(() => import("@/pages/attendance/RealShift.tsx")),
    layout: MainLayout,
    permissions: ["attendance.read"],
  },
  {
    path: ROUTES.ATTENDANCE.SHIFTS,
    component: lazy(() => import("@/pages/attendance/ShiftManagement.tsx")),
    layout: MainLayout,
    permissions: ["attendance.update"],
  },
  {
    path: ROUTES.ATTENDANCE.HOLIDAYS,
    component: lazy(() => import("@/pages/attendance/Holidays.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.APPLICATION.ALL,
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
    permissions: ["application.read"],
  },
  {
    path: ROUTES.APPLICATION.MANAGE,
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.APPLICATION.CREATE,
    component: lazy(() => import("@/pages/application/CreateApplicationPage.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PAYROLL.SALARY_COMPONENTS,
    component: lazy(() => import("@/pages/payroll/SalaryComponents.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.SALARY_VARIABLES,
    component: lazy(() => import("@/pages/payroll/SalaryVariables.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.CYCLE,
    component: lazy(() => import("@/pages/payroll/PayrollCycle.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.EMPLOYEE_SALARY,
    component: lazy(() => import("@/pages/payroll/EmployeeSalary.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.LIST,
    component: lazy(() => import("@/pages/payroll/PayrollManagement.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.PAYROLL.PAYSLIP_TEMPLATES,
    component: lazy(() => import("@/pages/payroll/PayslipTemplates.tsx")),
    layout: MainLayout,
    permissions: ["payroll.read"],
  },
  {
    path: ROUTES.RECRUITMENT.DASHBOARD,
    component: lazy(() => import("@/pages/recruitment/RecruitmentDashboard.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.RECRUITMENT.REQUISITIONS,
    component: lazy(() => import("@/pages/recruitment/RequisitionsPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.RECRUITMENT.OAUTH_ACCOUNTS,
    component: lazy(() => import("@/pages/recruitment/OAuthAccountsPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.posting.manage"],
  },
  {
    path: ROUTES.RECRUITMENT.APPLICANT_INTAKE,
    component: lazy(() => import("@/pages/recruitment/ApplicantIntakePage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.intake.manage"],
  },
  {
    path: ROUTES.RECRUITMENT.APPLICATIONS,
    component: lazy(() => import("@/pages/recruitment/CandidatesPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.RECRUITMENT.CANDIDATES,
    component: lazy(() => import("@/pages/recruitment/CandidatesPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.RECRUITMENT.APPLICATION_DETAIL,
    component: lazy(() => import("@/pages/recruitment/ApplicationDetailPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.RECRUITMENT.MY_INTERVIEWS,
    component: lazy(() => import("@/pages/recruitment/MyInterviewsPage.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.HRM.DASHBOARD,
    component: lazy(() => import("@/pages/security/SecurityDashboard.tsx")),
    layout: MainLayout,
    permissions: ["security.read"],
  },
  {
    path: ROUTES.SETTINGS.ROLES,
    component: lazy(() => import("@/pages/security/RolesManagement.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: "/project/positions",
    component: lazy(() => import("@/pages/security/PositionsManagement.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.SETTINGS.ROLE_PERMISSIONS,
    component: lazy(() => import("@/pages/security/RolePermissions.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.HRM.ACTIVITY_LOGS,
    component: lazy(() => import("@/pages/security/ActivityLogs.tsx")),
    layout: MainLayout,
    permissions: ["audit.read"],
  },
  {
    path: ROUTES.SETTINGS.PERMISSIONS,
    component: lazy(() => import("@/pages/security/PermissionMatrix.tsx")),
    layout: MainLayout,
    permissions: ["role.read"],
  },
  {
    path: ROUTES.ATTENDANCE.MY_SCHEDULE,
    component: lazy(() => import("@/pages/attendance/MySchedule.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.ATTENDANCE.MY_AVAILABILITY,
    component: lazy(() => import("@/pages/personal/MyPartTimeAvailability.tsx")),
    layout: MainLayout,
    // Page-level guard redirects full-time employees to schedule view.
  },
  {
    path: ROUTES.PAYROLL.MY_PAYSLIPS,
    component: lazy(() => import("@/pages/payroll/MyPayslips.tsx")),
    layout: MainLayout,
  },
  {
    path: "/recruitment/requisitions/:id/:tab",
    component: lazy(() => import("@/pages/recruitment/RequisitionDetailPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: "/recruitment/requisitions/:id",
    component: lazy(() => import("@/pages/recruitment/RequisitionDetailPage.tsx")),
    layout: MainLayout,
    permissions: ["recruitment.read"],
  },
  {
    path: ROUTES.PROJECT.MY_PROJECTS,
    component: lazy(() => import("@/pages/project/ProjectDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.APPLICATION.MY_APPLICATIONS,
    component: lazy(() => import("@/pages/application/ApplicationDashboard.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.LIST,
    component: lazy(() => import("@/pages/project/ProjectList.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.CAPACITY_BOARD,
    component: lazy(() => import("@/pages/project/ProjectCapacityBoardPage.tsx")),
    layout: MainLayout,
    permissions: ["project.update"],
  },
  {
    path: "/project/:id/:tab",
    component: lazy(() => import("@/pages/project/ProjectDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: "/project/:id",
    component: lazy(() => import("@/pages/project/ProjectDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_NEW_WITH_ID,
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_NEW,
    component: lazy(() => import("@/pages/project/NewTask.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_DETAIL,
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
  {
    path: ROUTES.PROJECT.TASK_DETAIL_WITH_ID,
    component: lazy(() => import("@/pages/project/TaskDetail.tsx")),
    layout: MainLayout,
  },
]

export { privateRoutes, publicRoutes, openRoutes }
