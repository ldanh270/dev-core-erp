import { PageCard } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { PROJECT_ROLES } from "@/config/entities/project.config"
import {
  type DisplayRoleMember,
  SELECT_NONE_VALUE,
  useProjectPositionRules,
} from "@/hooks/project/use-project-position-rules"
import type { ProjectRole } from "@/types/project-role.types"
import type { ProjectTracker } from "@/types/project-tracker.types"
import type { ProjectMember } from "@/types/project.types"

import type React from "react"

import { Edit2, Plus, RefreshCw, Save, Trash2, X } from "lucide-react"

import { TrackerDropdown } from "./TrackerDropdown"

function ProjectRoleFormDialog({
  isOpen,
  onOpenChange,
  editingId,
  roleName,
  roleCode,
  setRoleCode,
  onNameChange,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  roleName: string
  roleCode: string
  setRoleCode: (code: string) => void
  onNameChange: (name: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editingId ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Thiết lập tên vai trò dự án mới. Vai trò này có hiệu lực riêng biệt trong dự án này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="role_name" className="text-xs font-bold">
              Tên vai trò *
            </Label>
            <Input
              id="role_name"
              value={roleName}
              onChange={(e) => {
                onNameChange(e.target.value)
              }}
              placeholder="Ví dụ: Designer"
              className="rounded-full h-10 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role_code" className="text-xs font-bold">
              Mã vai trò (Tự động sinh) *
            </Label>
            <Input
              id="role_code"
              value={roleCode}
              onChange={(e) => {
                setRoleCode(e.target.value)
              }}
              placeholder="Ví dụ: designer"
              className="rounded-full h-10 text-sm font-mono"
              disabled
              required
            />
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="rounded-full text-xs h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {editingId ? "Cập nhật thay đổi" : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AssignMemberToRoleDialog({
  isOpen,
  onOpenChange,
  targetRole,
  selectedEmpId,
  onSelectedEmpIdChange,
  addMemberError,
  isSubmitting,
  members,
  teamLeaderId,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  targetRole: ProjectRole | null
  selectedEmpId: string
  onSelectedEmpIdChange: (id: string) => void
  addMemberError: string | null
  isSubmitting: boolean
  members: ProjectMember[]
  teamLeaderId?: string | null
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl bg-background border-border p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Gán thành viên vào vai trò: {targetRole?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Chọn thành viên hiện tại trong dự án để chuyển sang vai trò này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-3">
          {addMemberError && (
            <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
              {addMemberError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="directMemberEmp"
              className="text-xs font-semibold text-muted-foreground"
            >
              Chọn thành viên
            </Label>
            <Select value={selectedEmpId} onValueChange={onSelectedEmpIdChange}>
              <SelectTrigger
                id="directMemberEmp"
                className="w-full h-10 border-border rounded-full px-4 bg-background"
              >
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">
                  Chọn thành viên
                </SelectItem>
                {members
                  .filter((m) => m.employeeId !== teamLeaderId && m.roleId !== targetRole?.id)
                  .map((m) => (
                    <SelectItem key={m.employeeId} value={m.employeeId} className="rounded-lg">
                      {m.employee?.fullName || "Chưa rõ"} (Vai trò hiện tại:{" "}
                      {m.role?.name || "Chưa gán"})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
              }}
              className="rounded-full text-xs h-9"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="rounded-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gán..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProjectRoleRuleRow({
  role,
  idx,
  totalRoles,
  allowed,
  trackers,
  roleMembers,
  openDropdown,
  setOpenDropdown,
  onOpenEdit,
  onRoleDelete,
  onOpenAddMember,
  onRemoveMember,
  onToggleTracker,
  onSelectAllTrackers,
  onClearAllTrackers,
}: {
  role: ProjectRole
  idx: number
  totalRoles: number
  allowed: string[]
  trackers: ProjectTracker[]
  roleMembers: DisplayRoleMember[]
  openDropdown: { roleId: string; type: "tracker" | null }
  setOpenDropdown: React.Dispatch<React.SetStateAction<{ roleId: string; type: "tracker" | null }>>
  onOpenEdit: (role: ProjectRole) => void
  onRoleDelete: (id: string, code: string) => void
  onOpenAddMember: (role: ProjectRole) => void
  onRemoveMember: (employeeId: string, role: ProjectRole) => void
  onToggleTracker: (key: string) => void
  onSelectAllTrackers: () => void
  onClearAllTrackers: () => void
}) {
  const isDefaultRole = (PROJECT_ROLES as readonly string[]).includes(role.code)

  return (
    <div className="border border-border/50 rounded-xl p-4 bg-secondary/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5 shrink-0 min-w-[240px]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">{role.name}</span>
          <Badge
            variant="outline"
            className="rounded-full text-[9px] font-mono font-bold border-border bg-background"
          >
            {role.code}
          </Badge>
          <div className="flex items-center gap-1 ml-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onOpenEdit(role)
              }}
              className="size-7 rounded-full hover:bg-muted"
            >
              <Edit2 className="size-3 text-muted-foreground hover:text-foreground" />
            </Button>
            {!isDefaultRole && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  onRoleDelete(role.id, role.code)
                }}
                className="size-7 rounded-full hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 className="size-3 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        {/* Selected trackers display under role name */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {allowed.length === trackers.length ? (
            <Badge
              variant="secondary"
              className="rounded-full text-[9px] px-2 py-0.5 bg-muted text-muted-foreground border-transparent"
            >
              Cho phép tất cả
            </Badge>
          ) : allowed.length === 0 ? (
            <Badge
              variant="destructive"
              className="rounded-full text-[9px] px-2 py-0.5 border-transparent bg-red-500 text-white"
            >
              Chọn ít nhất 1 loại yêu cầu
            </Badge>
          ) : (
            allowed.map((k) => {
              const match = trackers.find((t) => t.code === k)
              const label = match ? match.name : k
              return (
                <Badge
                  key={k}
                  variant="outline"
                  className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary"
                >
                  {label}
                </Badge>
              )
            })
          )}
        </div>

        {/* Members belonging to this role */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 mr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Thành viên ({roleMembers.length}):
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onOpenAddMember(role)
              }}
              className="size-5 rounded-full hover:bg-muted text-primary cursor-pointer"
              title="Thêm/Chuyển nhân sự vào vai trò này"
            >
              <Plus className="size-3" />
            </Button>
          </div>
          {roleMembers.length === 0 ? (
            <span className="text-[10px] text-muted-foreground italic">Chưa có thành viên</span>
          ) : (
            roleMembers.map((m) => (
              <Badge
                key={m.id}
                variant="secondary"
                className="rounded-full text-[10px] px-2.5 py-0.5 bg-background text-foreground font-semibold border border-border shadow-sm flex items-center gap-1"
              >
                <span>{m.employee?.fullName || "Chưa rõ"}</span>
                {m.isTeamLeaderField && (
                  <span className="text-[8px] text-primary font-bold uppercase">Lead</span>
                )}
                {!m.isTeamLeaderField && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveMember(m.employeeId, role)
                    }}
                    className="hover:text-destructive cursor-pointer rounded-full p-0.5"
                    title="Bỏ khỏi vai trò"
                  >
                    <X className="size-2.5 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                )}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 flex-1 justify-end">
        <div className="space-y-1 w-full max-w-[320px] relative">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Các loại yêu cầu (Tracker) được phép tạo
          </span>
          <TrackerDropdown
            roleId={role.id}
            allowed={allowed}
            trackers={trackers}
            onToggle={onToggleTracker}
            onSelectAll={onSelectAllTrackers}
            onClearAll={onClearAllTrackers}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            openUpward={totalRoles > 2 && idx >= totalRoles - 2}
          />
        </div>
      </div>
    </div>
  )
}

interface ProjectPositionRulesProps {
  projectId: string
}

/**
 * RBAC and member role assignment matrix management tab for project positions.
 */
export function ProjectPositionRules({ projectId }: ProjectPositionRulesProps) {
  const {
    roles,
    trackers,
    members,
    project,
    isLoading,
    isUpdating,
    localRules,
    setLocalRules,
    openDropdown,
    setOpenDropdown,
    isModalOpen,
    setIsModalOpen,
    editingId,
    roleName,
    roleCode,
    setRoleCode,
    handleNameChange,
    handleOpenCreate,
    handleOpenEdit,
    handleRoleSubmit,
    handleRoleDelete,
    handleToggle,
    handleSave,
    isAddMemberModalOpen,
    setIsAddMemberModalOpen,
    targetRole,
    selectedEmpId,
    setSelectedEmpId,
    addMemberError,
    isSubmittingMember,
    handleOpenAddMemberToRole,
    handleRemoveMemberFromRole,
    handleAddMemberSubmit,
    getRoleMembers,
  } = useProjectPositionRules(projectId)

  return (
    <>
      <PageCard className="p-6 rounded-xl border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Giới hạn Loại công việc theo Vai trò Dự án
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cấu hình riêng cho dự án này: Chỉ định các loại công việc (Tracker) được phép tạo cho
              từng vai trò thành viên.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="rounded-full text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              Thêm vai trò mới
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isUpdating || isLoading}
              className="rounded-full text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted/30 border border-border/30 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm italic">
            Chưa có vai trò nào được cấu hình cho dự án này.
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role, idx) => {
              const allowed = localRules[role.id] ?? trackers.map((t) => t.code)
              const roleMembers = getRoleMembers(role)

              return (
                <ProjectRoleRuleRow
                  key={role.id}
                  role={role}
                  idx={idx}
                  totalRoles={roles.length}
                  allowed={allowed}
                  trackers={trackers}
                  roleMembers={roleMembers}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  onOpenEdit={handleOpenEdit}
                  onRoleDelete={handleRoleDelete}
                  onOpenAddMember={handleOpenAddMemberToRole}
                  onRemoveMember={handleRemoveMemberFromRole}
                  onToggleTracker={(key) => handleToggle(role.id, key)}
                  onSelectAllTrackers={() => {
                    setLocalRules((prev) => ({
                      ...prev,
                      [role.id]: trackers.map((t) => t.code),
                    }))
                  }}
                  onClearAllTrackers={() => {
                    setLocalRules((prev) => ({
                      ...prev,
                      [role.id]: [],
                    }))
                  }}
                />
              )
            })}
          </div>
        )}
      </PageCard>

      <ProjectRoleFormDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingId={editingId}
        roleName={roleName}
        roleCode={roleCode}
        setRoleCode={setRoleCode}
        onNameChange={handleNameChange}
        onSubmit={handleRoleSubmit}
      />

      <AssignMemberToRoleDialog
        isOpen={isAddMemberModalOpen}
        onOpenChange={setIsAddMemberModalOpen}
        targetRole={targetRole}
        selectedEmpId={selectedEmpId}
        onSelectedEmpIdChange={setSelectedEmpId}
        addMemberError={addMemberError}
        isSubmitting={isSubmittingMember}
        members={members}
        teamLeaderId={project?.teamLeaderId}
        onSubmit={handleAddMemberSubmit}
      />
    </>
  )
}
