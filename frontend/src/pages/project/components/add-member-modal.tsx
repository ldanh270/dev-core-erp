import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PROJECT_MEMBER_WORK_MODE,
  PROJECT_MEMBER_WORK_MODES,
  getProjectMemberWorkModeLabel,
} from "@/config/entities/project.config"
import { PROJECT_MESSAGES } from "@/config/messages/project.message"
import { projectApi } from "@/lib/api/project.api"
import type { Employee } from "@/types/employee.types"
import type { ProjectMember } from "@/types/project.types"
import { isPartTimeWorkSchedule } from "@/utils/employee/is-part-time-work-schedule.util"
import { extractErrorMessage } from "@/utils/error-helper"

import { useEffect, useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useProjectRoles } from "../hooks/use-project-role"

interface AddMemberModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  members: ProjectMember[]
  allEmployees: Employee[]
  teamLeaderId?: string | null
}

const SELECT_NONE_VALUE = "none"

/** Add employee to project with PT-specific hourlyRate and workMode (remote/onsite). */
export function AddMemberModal({
  isOpen,
  onOpenChange,
  projectId,
  members,
  allEmployees,
  teamLeaderId,
}: AddMemberModalProps) {
  const queryClient = useQueryClient()
  const [memberEmployeeId, setMemberEmployeeId] = useState(SELECT_NONE_VALUE)
  const [hourlyRate, setHourlyRate] = useState("")
  // Default remote: PT logs Spent Time without GPS. TL can switch to onsite per project.
  const [workMode, setWorkMode] = useState<string>(PROJECT_MEMBER_WORK_MODE.REMOTE)
  const [roleId, setRoleId] = useState("")
  const [memberError, setMemberError] = useState<string | null>(null)

  const { data: roles = [] } = useProjectRoles(projectId)

  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      const devRole = roles.find((r) => r.code === "developer")
      if (devRole) {
        setRoleId(devRole.id)
      } else {
        setRoleId(roles[0].id)
      }
    }
  }, [roles, roleId])

  const selectedEmployee = allEmployees.find((e) => e.id === memberEmployeeId)
  // PT members require hourlyRate on ProjectMember for payroll.
  const isPartTime = selectedEmployee ? isPartTimeWorkSchedule(selectedEmployee) : false

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (memberEmployeeId === SELECT_NONE_VALUE) {
        throw new Error("Vui lòng chọn nhân viên")
      }
      if (isPartTime && (!hourlyRate || Number(hourlyRate) <= 0)) {
        // Backend rejects PT members without rate — payroll uses ProjectMember.hourlyRate.
        throw new Error(PROJECT_MESSAGES.PART_TIME_HOURLY_RATE_REQUIRED)
      }

      return projectApi.addMember(projectId, {
        employeeId: memberEmployeeId,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        workMode,
        roleId: roleId || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      onOpenChange(false)
      setMemberEmployeeId(SELECT_NONE_VALUE)
      setHourlyRate("")
      setWorkMode(PROJECT_MEMBER_WORK_MODE.REMOTE)
      // Reset roleId to default developer
      const devRole = roles.find((r) => r.code === "developer")
      setRoleId(devRole ? devRole.id : roles[0]?.id || "")
      setMemberError(null)
      toast.success("Thêm thành viên vào dự án thành công")
    },
    onError: (err: unknown) => {
      setMemberError(extractErrorMessage(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMemberError(null)
    addMemberMutation.mutate()
  }

  const handleClose = () => {
    setMemberEmployeeId(SELECT_NONE_VALUE)
    setHourlyRate("")
    setWorkMode(PROJECT_MEMBER_WORK_MODE.REMOTE)
    const devRole = roles.find((r) => r.code === "developer")
    setRoleId(devRole ? devRole.id : roles[0]?.id || "")
    setMemberError(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-[450px] rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Thêm thành viên dự án
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn nhân viên, mức lương/giờ (bắt buộc với part-time) và chế độ làm việc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {memberError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {memberError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="memberEmp" className="text-xs font-semibold text-muted-foreground">
              Chọn nhân sự
            </Label>
            <Select value={memberEmployeeId} onValueChange={setMemberEmployeeId}>
              <SelectTrigger
                id="memberEmp"
                className="w-full h-10 border-border rounded-full px-4 bg-background"
              >
                <SelectValue placeholder="Chọn nhân sự" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">
                  Chọn nhân viên
                </SelectItem>
                {allEmployees
                  .filter(
                    (emp) =>
                      !members.some((m) => m.employeeId === emp.id) && emp.id !== teamLeaderId,
                  )
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg">
                      {emp.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hourlyRate" className="text-xs font-semibold text-muted-foreground">
              Lương theo giờ (VND){isPartTime ? " *" : ""}
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="1000"
              value={hourlyRate}
              onChange={(e) => {
                setHourlyRate(e.target.value)
              }}
              placeholder="VD: 50000"
              className="h-10 rounded-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workMode" className="text-xs font-semibold text-muted-foreground">
              Chế độ làm việc
            </Label>
            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger
                id="workMode"
                className="w-full h-10 border-border rounded-full px-4 bg-background"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                {PROJECT_MEMBER_WORK_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode} className="rounded-lg">
                    {getProjectMemberWorkModeLabel(mode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs font-semibold text-muted-foreground">
              Vai trò trong dự án
            </Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger
                id="role"
                className="w-full h-10 border-border rounded-full px-4 bg-background"
              >
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="rounded-lg">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 rounded-full px-5 text-sm"
              disabled={addMemberMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-full px-5 text-sm bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? "Đang thêm..." : "Thêm thành viên"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
