import { IconBox, PageCard, SectionHeader, StatusPill } from "@/components/common"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  ROLE_LABELS,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import type { ProfileDto } from "@/types/profile.types"
import {
  Briefcase,
  Calendar,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react"

const ROLE_LABEL_MAP = new Map(Object.entries(ROLE_LABELS))
const EMPLOYEE_TYPE_LABEL_MAP = new Map(Object.entries(EMPLOYEE_TYPE_LABELS))
const EMPLOYEE_STATUS_LABEL_MAP = new Map(Object.entries(EMPLOYEE_STATUS_LABELS))

export interface ProfileOverviewSectionProps {
  profile: ProfileDto
}

/**
 * Renders the read-only overview profile cards: personal info, contact info, and job configuration.
 */
export function ProfileOverviewSection({ profile }: ProfileOverviewSectionProps) {
  const roleLabels =
    profile.roles && profile.roles.length > 0
      ? profile.roles.map((role) => ROLE_LABEL_MAP.get(role) || role).join(", ")
      : "Chưa cập nhật"

  const statusVariant =
    profile.status === EMPLOYEE_STATUS.ACTIVE
      ? "success"
      : profile.status === EMPLOYEE_STATUS.ON_LEAVE
        ? "warning"
        : "neutral"

  return (
    <div className="space-y-6">
      {/* Personal & Identity Card */}
      <PageCard>
        <SectionHeader title="Thông tin cá nhân" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-2">
          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox icon={User} colorClass="bg-primary/10 text-primary" size="sm" />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Họ và tên
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{profile.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Calendar}
              colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Ngày sinh
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={ShieldCheck}
              colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                CMND / CCCD
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.nationalId || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 md:col-span-2">
            <IconBox
              icon={MapPin}
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Địa chỉ thường trú
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.address || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Contact Information Card */}
      <PageCard>
        <SectionHeader title="Thông tin liên hệ" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-2">
          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Mail}
              colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Email liên hệ
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <IconBox
              icon={Phone}
              colorClass="bg-teal-500/10 text-teal-600 dark:text-teal-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Số điện thoại
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.phone || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>
      </PageCard>

      {/* Job & Contract Configuration Card */}
      <PageCard>
        <SectionHeader title="Thông tin công việc" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-2">
          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Briefcase}
              colorClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Chức vụ
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.position || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={ShieldCheck}
              colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Vai trò hệ thống
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{roleLabels}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Briefcase}
              colorClass="bg-rose-500/10 text-rose-600 dark:text-rose-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Loại nhân sự
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {EMPLOYEE_TYPE_LABEL_MAP.get(profile.employeeType) || profile.employeeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Briefcase}
              colorClass="bg-orange-500/10 text-orange-600 dark:text-orange-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Hình thức làm việc
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {getWorkScheduleTypeLabel(profile.workScheduleType)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
            <IconBox
              icon={Calendar}
              colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Ngày bắt đầu
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile.startDate
                  ? new Date(profile.startDate).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1 md:col-span-2">
            <IconBox
              icon={ShieldCheck}
              colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-500"
              size="sm"
            />
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Trạng thái làm việc
              </p>
              <div className="mt-1">
                <StatusPill
                  variant={statusVariant}
                  label={EMPLOYEE_STATUS_LABEL_MAP.get(profile.status) || profile.status}
                />
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  )
}
