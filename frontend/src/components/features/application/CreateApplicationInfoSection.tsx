import { DatePicker } from "@/components/common"
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { APPLICATION_TYPES } from "@/config/entities/attendance.config"
import type { ApplicationFormState } from "@/hooks/application/useCreateApplicationForm"
import type { IApprover } from "@/lib/api/employee.api"
import type { User } from "@/store/auth-store"

const UNASSIGNED_APPROVER_VALUE = "__unassigned_approver__"

interface Props {
  type: string
  form?: ApplicationFormState
  set?: <K extends keyof ApplicationFormState>(k: K, v: ApplicationFormState[K]) => void
  assignedToId: string
  setAssignedToId: (val: string) => void
  user: User | null
  approvers: IApprover[]
}

/** Renders requester and approver fields shared by all application types. */
export function CreateApplicationInfoSection({
  type,
  form,
  set,
  assignedToId,
  setAssignedToId,
  user,
  approvers,
}: Props) {
  return (
    <section className="shrink-0 overflow-visible rounded-xl border border-border bg-card">
      <div className="px-5 py-3 border-b border-border bg-muted/50 rounded-t-lg">
        <h3 className="font-semibold text-sm text-foreground">Thông tin đơn</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Nhân sự</label>
          <input
            type="text"
            disabled
            value={`${user?.fullName || "Người dùng"} - ${user?.email || ""}`}
            className="h-11 w-full cursor-not-allowed rounded-full border border-input bg-muted/50 px-4 text-sm text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Người duyệt</label>
          <Select
            value={assignedToId || UNASSIGNED_APPROVER_VALUE}
            onValueChange={(value) => {
              setAssignedToId(value === UNASSIGNED_APPROVER_VALUE ? "" : value)
            }}
          >
            <SelectTrigger className="h-11 bg-background px-4">
              <SelectValue placeholder="Chọn người duyệt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED_APPROVER_VALUE}>
                Không chỉ định (bất kỳ ai có thẩm quyền)
              </SelectItem>
              {approvers.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.fullName}
                  {a.position ? ` — ${a.position}` : ""} ({a.role.replace(/_/g, " ")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === APPLICATION_TYPES.RESIGNATION.LABEL && form && set && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Ngày thôi việc</label>
              <DatePicker
                value={form.startDate || null}
                onChange={(val) => {
                  set("startDate", val || "");
                }}
                placeholder="Chọn ngày thôi việc..."
                size="sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Lý do</label>
              <input
                type="text"
                placeholder="Nhập lý do hoặc ghi chú chi tiết"
                value={form.reason}
                onChange={(e) => {
                  set("reason", e.target.value)
                }}
                className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
