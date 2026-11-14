import { PageCard, SectionHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PERSONAL_EMPLOYEE_LINK_SELF } from "@/config/entities/attendance.config"
import { EMPLOYEE_STATUS } from "@/config/entities/employee.config"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { usePermission } from "@/hooks/use-permission"
import { useUpdatePersonalEmployeeLink } from "@/hooks/use-profile"
import type { Employee } from "@/types/employee.types"
import type { ProfileDto } from "@/types/profile.types"

import { useState } from "react"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PersonalEmployeeLinkSectionProps {
  profile: ProfileDto
}

interface PersonalEmployeeLinkFormProps {
  profile: ProfileDto
  employees: Employee[]
  isEmployeesLoading: boolean
  initialEmployeeId: string
}

/**
 * PersonalEmployeeLinkForm Component.
 */
function PersonalEmployeeLinkForm({
  profile,
  employees,
  isEmployeesLoading,
  initialEmployeeId,
}: PersonalEmployeeLinkFormProps) {
  const updateLink = useUpdatePersonalEmployeeLink()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId)
  const activeEmployees = employees.filter((employee) => employee.status === EMPLOYEE_STATUS.ACTIVE)

  const handleSave = () => {
    const personalEmployeeId =
      selectedEmployeeId === PERSONAL_EMPLOYEE_LINK_SELF ? null : selectedEmployeeId

    updateLink.mutate(personalEmployeeId, {
      onSuccess: () => {
        toast.success("Đã cập nhật hồ sơ chấm công liên kết")
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật liên kết")
      },
    })
  }

  return (
    <div className="space-y-3 max-w-xl">
      <Select
        value={selectedEmployeeId}
        onValueChange={setSelectedEmployeeId}
        disabled={isEmployeesLoading || updateLink.isPending}
      >
        <SelectTrigger className="rounded-full">
          <SelectValue placeholder="Chọn hồ sơ nhân viên" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PERSONAL_EMPLOYEE_LINK_SELF}>
            Dùng chính tài khoản của tôi ({profile.fullName})
          </SelectItem>
          {activeEmployees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.fullName} — {employee.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-sm text-muted-foreground">
        {profile.personalEmployee
          ? `Đang liên kết: ${profile.personalEmployee.fullName}`
          : "Chưa liên kết hồ sơ khác — dùng dữ liệu của tài khoản đăng nhập."}
      </p>

      <Button
        type="button"
        className="rounded-full"
        onClick={handleSave}
        disabled={updateLink.isPending || isEmployeesLoading}
      >
        {updateLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Lưu liên kết
      </Button>
    </div>
  )
}

/**
 * PersonalEmployeeLinkSection Component.
 */
export function PersonalEmployeeLinkSection({ profile }: PersonalEmployeeLinkSectionProps) {
  const { hasPermission } = usePermission()
  const canManageLink = hasPermission("employee.update")
  const { data: employeeData, isLoading: isEmployeesLoading } = useEmployees({
    page: 1,
    limit: SYSTEM_CONFIG.PAGINATION.BULK_LIMIT,
  })

  if (!canManageLink) {
    return null
  }

  const employees = employeeData?.data ?? []
  const linkKey = profile.personalEmployee?.id ?? PERSONAL_EMPLOYEE_LINK_SELF

  return (
    <PageCard className="space-y-4">
      <SectionHeader title="Hồ sơ chấm công liên kết" />
      <p className="text-sm text-muted-foreground">
        Chọn hồ sơ nhân viên dùng cho Lịch của tôi và máy chấm công.
      </p>

      <PersonalEmployeeLinkForm
        key={linkKey}
        profile={profile}
        employees={employees}
        isEmployeesLoading={isEmployeesLoading}
        initialEmployeeId={linkKey}
      />
    </PageCard>
  )
}
