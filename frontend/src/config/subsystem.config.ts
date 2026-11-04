import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import {
  type IEmployeeType,
  type IWorkScheduleType,
  ROLE,
  WORK_SCHEDULE_TYPE,
} from "@/config/entities/employee.config"
import { PERSONAL_TAB_LABELS } from "@/config/entities/personal.config"
import { ROUTES } from "@/config/routes.config"

import {
  BrainCircuit,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  CircleDollarSign,
  FilePlus2,
  FileText,
  Settings,
  Settings2,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type SubsystemId =
  | "hrm"
  | "application"
  | "attendance"
  | "payroll"
  | "asset"
  | "recruitment"
  | "training"
  | "security"
  | "settings"
  | "project"

export interface NavItem {
  name: string
  path: string
  icon: LucideIcon
  roles?: string[]
  employeeTypes?: IEmployeeType[]
  workScheduleTypes?: IWorkScheduleType[]
  permissions?: string[]
  subItems?: { name: string; path: string; icon?: LucideIcon }[]
}

export interface SubsystemConfig {
  id: SubsystemId
  name: string
  description: string
  icon: LucideIcon
  routePrefix: string
  sidebarItems: NavItem[]
  permissions?: string[]
}

/** Baseline permission that distinguishes payroll administration from personal payslips.
 * Users without this permission are redirected to ROUTES.PAYROLL.MY_PAYSLIPS instead of
 * the payroll list — the subsystem stays visible so self-service payslip access is preserved. */
export const PAYROLL_SUBSYSTEM_PERMISSION = "payroll.read"

/** Baseline permission required for personal and administrative attendance history.
 * Users without this permission land on the shared holiday calendar when entering
 * the Attendance subsystem; users with it but without the admin role land on their
 * own attendance summary. Admins get the full dashboard. */
export const ATTENDANCE_SUBSYSTEM_PERMISSION = "attendance.read"

export const SUBSYSTEMS: SubsystemConfig[] = [
  {
    id: "hrm",
    name: "Nhân sự",
    description: "Quản lý hồ sơ, hợp đồng, bảo hiểm, công việc...",
    icon: Users,
    routePrefix: ROUTES.HRM.BASE,
    sidebarItems: [
      {
        name: "Hồ sơ nhân sự",
        path: ROUTES.HRM.EMPLOYEES,
        icon: Users,
        permissions: ["employee.read"],
      },
      {
        name: "Hợp đồng lao động",
        path: ROUTES.HRM.CONTRACTS,
        icon: FileText,
        permissions: ["employee.read"],
      },
      {
        name: "Bảo hiểm",
        path: ROUTES.HRM.INSURANCE,
        icon: ShieldCheck,
        permissions: ["employee.read"],
      },
      {
        name: "Nhật ký hoạt động",
        path: ROUTES.HRM.ACTIVITY_LOGS,
        icon: FileText,
        permissions: ["audit.read"],
      },
      {
        name: "Tổng quan bảo mật",
        path: ROUTES.HRM.DASHBOARD,
        icon: ShieldCheck,
        permissions: ["security.read"],
      },
    ],
  },
  {
    id: "application",
    name: "Đơn từ",
    description: "Tạo đơn từ và duyệt đơn trực tuyến",
    icon: FileText,
    routePrefix: ROUTES.APPLICATION.BASE,
    sidebarItems: [
      {
        name: PERSONAL_TAB_LABELS.applications,
        path: ROUTES.APPLICATION.MY_APPLICATIONS,
        icon: FileText,
      },
      { name: "Bạn duyệt", path: ROUTES.APPLICATION.MANAGE, icon: UserCheck },
      {
        name: "Đơn thư",
        path: ROUTES.APPLICATION.ALL,
        icon: FilePlus2,
        permissions: ["application.read"],
        subItems: Object.values(APPLICATION_TYPES).map((t) => ({
          name: t.DESCRIPTION,
          path: `${ROUTES.APPLICATION.ALL}?type=${t.LABEL}`,
        })),
      },
    ],
  },
  {
    id: "attendance",
    name: "Chấm công",
    description: "Quản lý phân ca, chấm công và nghỉ phép",
    icon: CalendarClock,
    routePrefix: ROUTES.ATTENDANCE.BASE,
    sidebarItems: [
      {
        name: PERSONAL_TAB_LABELS.schedule,
        path: ROUTES.ATTENDANCE.MY_SCHEDULE,
        icon: CalendarClock,
      },
      {
        name: PERSONAL_TAB_LABELS.availability,
        path: ROUTES.ATTENDANCE.MY_AVAILABILITY,
        icon: CalendarRange,
        workScheduleTypes: [WORK_SCHEDULE_TYPE.PART_TIME],
      },
      {
        name: "Bảng chấm công",
        path: ROUTES.ATTENDANCE.DASHBOARD,
        icon: ChartNoAxesColumn,
        permissions: ["attendance.read"],
        roles: [ROLE.ADMIN],
      },
      {
        // Self-service summary is available to every employee with personal attendance access.
        name: "Chấm công của tôi",
        path: ROUTES.ATTENDANCE.SUMMARY,
        icon: UserCheck,
        permissions: ["attendance.read"],
      },
      {
        name: "Lịch làm việc",
        path: ROUTES.ATTENDANCE.WORK_SCHEDULES,
        icon: CalendarDays,
        permissions: ["attendance.update"],
      },
      {
        name: "Xếp ca part-time",
        path: ROUTES.ATTENDANCE.PART_TIME_AVAILABILITY,
        icon: CalendarRange,
        permissions: ["attendance.update"],
        // Assign from submitted free-time windows — not fixed weekly templates.
      },
      {
        name: "Lịch hàng tuần",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULES,
        icon: CalendarClock,
        permissions: ["attendance.update"],
      },
      {
        name: "Cấu hình lịch tuần",
        path: ROUTES.ATTENDANCE.WEEKLY_SCHEDULE_CONFIG,
        icon: Settings2,
        permissions: ["attendance.update"],
      },
      {
        name: "Ca làm việc",
        path: ROUTES.ATTENDANCE.SHIFTS,
        icon: CalendarClock,
        permissions: ["attendance.update"],
      },
      { name: "Ngày lễ", path: ROUTES.ATTENDANCE.HOLIDAYS, icon: CalendarClock },
    ],
  },
  {
    id: "payroll",
    name: "Bảng lương",
    description: "Tự động tính và chi trả bảng lương",
    icon: CircleDollarSign,
    routePrefix: ROUTES.PAYROLL.BASE,
    // Admin items carry payroll.read individually. The subsystem itself stays visible
    // because every employee must be able to enter its self-service payslip page.
    sidebarItems: [
      {
        name: "Kỳ lương",
        path: ROUTES.PAYROLL.LIST,
        icon: FileText,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        name: "Thành phần lương",
        path: ROUTES.PAYROLL.SALARY_COMPONENTS,
        icon: Settings,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        name: "Biến hệ thống",
        path: ROUTES.PAYROLL.SALARY_VARIABLES,
        icon: Settings,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        name: "Mẫu phiếu lương",
        path: ROUTES.PAYROLL.PAYSLIP_TEMPLATES,
        icon: FileText,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        name: "Chu kỳ lương",
        path: ROUTES.PAYROLL.CYCLE,
        icon: CalendarClock,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        name: "Lương nhân sự",
        path: ROUTES.PAYROLL.EMPLOYEE_SALARY,
        icon: Users,
        permissions: [PAYROLL_SUBSYSTEM_PERMISSION],
      },
      {
        // No permission gate: filterNavItems removes the admin entries above and leaves
        // this as the only payroll sidebar item for a regular employee.
        name: PERSONAL_TAB_LABELS.payslips,
        path: ROUTES.PAYROLL.MY_PAYSLIPS,
        icon: CircleDollarSign,
      },
    ],
  },
  {
    id: "recruitment",
    name: "Tuyển dụng",
    description: "Quản lý hồ sơ ứng viên và lịch phỏng vấn",
    icon: Briefcase,
    routePrefix: ROUTES.RECRUITMENT.BASE,
    sidebarItems: [
      {
        name: "Tổng quan",
        path: ROUTES.RECRUITMENT.DASHBOARD,
        icon: Briefcase,
        permissions: ["recruitment.read"],
      },
      {
        name: "Yêu cầu tuyển dụng",
        path: ROUTES.RECRUITMENT.REQUISITIONS,
        icon: FilePlus2,
        permissions: ["recruitment.read"],
      },
      {
        name: "Danh sách ứng viên",
        path: ROUTES.RECRUITMENT.CANDIDATES,
        icon: Users,
        permissions: ["recruitment.read"],
      },
      {
        name: "Lịch phỏng vấn của tôi",
        path: ROUTES.RECRUITMENT.MY_INTERVIEWS,
        icon: CalendarClock,
      },
      {
        name: "Tài khoản OAuth",
        path: ROUTES.RECRUITMENT.OAUTH_ACCOUNTS,
        icon: Settings,
        permissions: ["recruitment.posting.manage"],
      },
      {
        name: "Tiếp nhận ứng viên",
        path: ROUTES.RECRUITMENT.APPLICANT_INTAKE,
        icon: Upload,
        permissions: ["recruitment.intake.manage"],
      },
    ],
  },
  {
    id: "project",
    name: "Dự án",
    description: "Quản lý dự án, tiến độ công việc và báo cáo",
    icon: Briefcase,
    routePrefix: ROUTES.PROJECT.BASE,
    sidebarItems: [
      {
        name: PERSONAL_TAB_LABELS.projects,
        path: ROUTES.PROJECT.MY_PROJECTS,
        icon: Briefcase,
      },
      {
        name: "Danh sách dự án",
        path: ROUTES.PROJECT.LIST,
        icon: Briefcase,
        permissions: ["project.read"],
      },
      // Admin/PM-only board for weekly Capacity Copilot shortage/surplus overview.
      {
        name: "Dự báo capacity",
        path: ROUTES.PROJECT.CAPACITY_BOARD,
        icon: BrainCircuit,
        permissions: ["project.update"],
      },
    ],
  },
  {
    id: "settings",
    name: "Cài đặt",
    description: "Cài đặt hệ thống",
    icon: Settings,
    routePrefix: ROUTES.SETTINGS.BASE,
    sidebarItems: [
      {
        name: "Vai trò",
        path: ROUTES.SETTINGS.ROLES,
        icon: ShieldCheck,
        permissions: ["role.read"],
      },
      {
        name: "Cấu hình quyền",
        path: ROUTES.SETTINGS.ROLE_PERMISSIONS,
        icon: ShieldCheck,
        permissions: ["role.read"],
      },
      {
        name: "Phân quyền",
        path: ROUTES.SETTINGS.PERMISSIONS,
        icon: ShieldCheck,
        permissions: ["role.read"],
      },
    ],
  },
]
