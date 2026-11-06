/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useProjectRoles, useCreateProjectRole, useUpdateProjectRole, useDeleteProjectRole } from "../hooks/use-project-role"
import { useProjectTrackers } from "../hooks/use-project-tracker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageCard, useConfirm } from "@/components/common"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { projectApi } from "@/lib/api/project.api"
import { PROJECT_ROLE, PROJECT_ROLES } from "@/config/entities/project.config"
import { TrackerDropdown } from "./tracker-dropdown"

const SELECT_NONE_VALUE = "none"

interface ProjectPositionRulesProps {
  projectId: string
}

export function ProjectPositionRules({ projectId }: ProjectPositionRulesProps) {
  const { data: roles = [], isLoading: isLoadingRoles, refetch: refetchRoles } = useProjectRoles(projectId)
  const { data: trackers = [] } = useProjectTrackers(projectId)
  const confirm = useConfirm()

  // Fetch project members currently assigned to the project
  const { data: members = [] } = useQuery({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  // Fetch project details (for teamLeader mapping)
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  const createRoleMutation = useCreateProjectRole(projectId)
  const updateRoleMutation = useUpdateProjectRole(projectId)
  const deleteRoleMutation = useDeleteProjectRole(projectId)

  const queryClient = useQueryClient()

  // Dialog state for adding member directly to a role
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [targetRole, setTargetRole] = useState<any | null>(null)
  const [selectedEmpId, setSelectedEmpId] = useState(SELECT_NONE_VALUE)
  const [addMemberError, setAddMemberError] = useState<string | null>(null)
  const [isSubmittingMember, setIsSubmittingMember] = useState(false)

  /**
   * Opens the role assignment modal for a specific target role.
   * Reset form selection and errors upon opening.
   */
  const handleOpenAddMemberToRole = (role: any) => {
    setTargetRole(role)
    setSelectedEmpId(SELECT_NONE_VALUE)
    setAddMemberError(null)
    setIsAddMemberModalOpen(true)
  }

  /**
   * Unassigns a project member's role (sets roleId to null).
   * Prompts the user with a unified custom confirmation dialog before performing the unassignment.
   */
  const handleRemoveMemberFromRole = async (employeeId: string, role: any) => {
    const memberName = members.find((m) => m.employeeId === employeeId)?.employee?.fullName || "nhân sự này"
    const ok = await confirm({
      title: "Bỏ thành viên khỏi vai trò",
      description: `Bạn có chắc chắn muốn bỏ ${memberName} ra khỏi vai trò ${role.name}?`,
      variant: "destructive",
    })
    if (!ok) return

    try {
      await projectApi.updateMember(projectId, employeeId, {
        roleId: null,
      })
      toast.success("Đã xóa nhân sự khỏi vai trò")
      await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || "Không thể bỏ nhân sự khỏi vai trò")
    }
  }

  // Form state for managing roles
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [roleName, setRoleName] = useState("")
  const [roleCode, setRoleCode] = useState("")

  // State to track open dropdown for each role
  const [openDropdown, setOpenDropdown] = useState<{ roleId: string; type: "tracker" | null }>({ roleId: "", type: null })

  const getRoleMembers = (role: any): any[] => {
    const assignedMembers = members.filter((m) => m.roleId === role.id)
    const teamLeader = project?.teamLeader
    if (role.code === PROJECT_ROLE.LEADER && teamLeader) {
      const isAlreadyIncluded = assignedMembers.some(
        (m) => m.employeeId === teamLeader.id
      )
      if (!isAlreadyIncluded) {
        const leaderMember = {
          id: `leader_${teamLeader.id}`,
          employeeId: teamLeader.id,
          employee: {
            fullName: teamLeader.fullName,
            email: teamLeader.email,
          },
          isTeamLeaderField: true,
        }
        return [leaderMember, ...assignedMembers]
      }
    }
    return assignedMembers
  }

  const toSnakeCase = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s_]/g, "")
      .trim()
      .replace(/\s+/g, "_")
  }

  const handleNameChange = (val: string) => {
    setRoleName(val)
    if (!editingId) {
      setRoleCode(toSnakeCase(val))
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setRoleName("")
    setRoleCode("")
    setIsModalOpen(true)
  }

  const handleOpenEdit = (role: any) => {
    setEditingId(role.id)
    setRoleName(role.name)
    setRoleCode(role.code)
    setIsModalOpen(true)
  }

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim() || !roleCode.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin vai trò")
      return
    }

    const payload = {
      name: roleName.trim(),
      allowedTaskTrackers: editingId ? undefined : trackers.map(t => t.code) // Default to all trackers on creation
    }

    try {
      if (editingId) {
        await updateRoleMutation.mutateAsync({ id: editingId, data: payload })
      } else {
        await createRoleMutation.mutateAsync(payload)
      }
      setIsModalOpen(false)
      refetchRoles()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      // Handled by react query error toast
    }
  }

  /**
   * Deletes a custom project role.
   * Warns the user using the global custom confirm dialog that members of this role will fall back to Developer.
   * Blocks deleting system-defined 'leader' role.
   */
  const handleRoleDelete = async (id: string, code: string) => {
    if (code === PROJECT_ROLE.LEADER) {
      toast.error("Không thể xóa vai trò Trưởng nhóm mặc định")
      return
    }
    const roleName = roles.find((r) => r.id === id)?.name || "vai trò này"
    const ok = await confirm({
      title: "Xác nhận xóa vai trò",
      description: `Bạn có chắc chắn muốn xóa vai trò "${roleName}"? Thành viên của vai trò này sẽ được chuyển sang Lập trình viên.`,
      variant: "destructive",
    })
    if (!ok) return

    try {
      await deleteRoleMutation.mutateAsync(id)
      refetchRoles()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      // Handled by react query error toast
    }
  }

  /**
   * Directly updates a member's project role.
   * This handles reassignment of roles for existing project members directly on the rules tab page.
   */
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEmpId === SELECT_NONE_VALUE) {
      setAddMemberError("Vui lòng chọn nhân sự")
      return
    }

    const existingMember = members.find(m => m.employeeId === selectedEmpId)
    if (!existingMember) {
      setAddMemberError("Nhân sự không hợp lệ")
      return
    }

    setIsSubmittingMember(true)
    setAddMemberError(null)

    try {
      await projectApi.updateMember(projectId, selectedEmpId, {
        roleId: targetRole.id,
      })
      toast.success(`Đã chuyển vai trò của ${existingMember.employee?.fullName || "thành viên"} sang ${targetRole.name}`)

      // Invalidate queries to reload members
      await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      setIsAddMemberModalOpen(false)
    } catch (err: any) {
      setAddMemberError(err.response?.data?.error?.message || err.message || "Thao tác thất bại")
    } finally {
      setIsSubmittingMember(false)
    }
  }

  // Local state: map of roleId -> array of allowed trackers
  const [localRules, setLocalRules] = useState<Record<string, string[]>>({})

  // Initialize local rules state when data loads
  useEffect(() => {
    if (roles.length > 0 && trackers.length > 0) {
      const initialTrackers: Record<string, string[]> = {}
      roles.forEach((r) => {
        initialTrackers[r.id] = r.allowedTaskTrackers && r.allowedTaskTrackers.length > 0
          ? r.allowedTaskTrackers
          : trackers.map((t) => t.code)
      })
 
      setLocalRules(initialTrackers)
    }
  }, [roles, trackers])

  const handleToggle = (roleId: string, trackerKey: string) => {
    setLocalRules((prev) => {
      const current = prev[roleId] || []
      const updated = current.includes(trackerKey)
        ? current.filter((k) => k !== trackerKey)
        : [...current, trackerKey]
      return {
        ...prev,
        [roleId]: updated,
      }
    })
  }

  const handleSave = async () => {
 
    const invalidRole = Object.entries(localRules).find(([_, allowedTaskTrackers]) => allowedTaskTrackers.length === 0)
    if (invalidRole) {
      const roleObj = roles.find(r => r.id === invalidRole[0])
      toast.error(`Vai trò "${roleObj?.name || 'Không xác định'}" chưa chọn loại yêu cầu nào. Vui lòng chọn ít nhất 1 loại yêu cầu.`)
      return
    }

    try {
      const promises = Object.entries(localRules).map(([id, allowedTaskTrackers]) => {
        return updateRoleMutation.mutateAsync({ id, data: { allowedTaskTrackers } })
      })
      await Promise.all(promises)
      toast.success("Lưu cấu hình phân quyền thành công")
      refetchRoles()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Lưu cấu hình thất bại")
    }
  }

  const isLoading = isLoadingRoles

  return (
    <>
      <PageCard className="p-6 rounded-xl border border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Giới hạn Loại công việc theo Vai trò Dự án</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cấu hình riêng cho dự án này: Chỉ định các loại công việc (Tracker) được phép tạo cho từng vai trò thành viên.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenCreate}
              className="rounded-full flex items-center gap-1.5 h-10 text-xs px-4 cursor-pointer hover:bg-muted"
            >
              <Plus className="size-3.5" />
              Thêm vai trò mới
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateRoleMutation.isPending}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 h-10 text-xs px-4 self-start sm:self-auto cursor-pointer"
            >
              {updateRoleMutation.isPending ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Lưu cấu hình
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-muted rounded-xl" />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            Không tìm thấy vai trò nào. Hãy tạo vai trò mới bằng nút "Thêm vai trò mới".
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role, idx) => {
              const allowed = localRules[role.id] || []
              const isDefaultRole = (PROJECT_ROLES as readonly string[]).includes(role.code)

              return (
                <div key={role.id} className="border border-border/50 rounded-xl p-4 bg-secondary/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 shrink-0 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{role.name}</span>
                      <Badge variant="outline" className="rounded-full text-[9px] font-mono font-bold border-border bg-background">
                        {role.code}
                      </Badge>
                      <div className="flex items-center gap-1 ml-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => { handleOpenEdit(role); }}
                          className="size-7 rounded-full hover:bg-muted"
                        >
                          <Edit2 className="size-3 text-muted-foreground hover:text-foreground" />
                        </Button>
                        {!isDefaultRole && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRoleDelete(role.id, role.code)}
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
                        <Badge variant="secondary" className="rounded-full text-[9px] px-2 py-0.5 bg-muted text-muted-foreground border-transparent">
                          Cho phép tất cả
                        </Badge>
                      ) : allowed.length === 0 ? (
                        <Badge variant="destructive" className="rounded-full text-[9px] px-2 py-0.5 border-transparent bg-red-500 text-white">
                          Chọn ít nhất 1 loại yêu cầu
                        </Badge>
                      ) : (
                        allowed.map((k) => {
                          const match = trackers.find((t) => t.code === k)
                          const label = match ? match.name : k
                          return (
                            <Badge key={k} variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                              {label}
                            </Badge>
                          )
                        })
                      )}
                    </div>

                    {/* Members belonging to this role */}
                    {(() => {
                      const roleMembers = getRoleMembers(role)
                      return (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1 mr-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Thành viên ({roleMembers.length}):
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => { handleOpenAddMemberToRole(role); }}
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
                                    onClick={() => handleRemoveMemberFromRole(m.employeeId, role)}
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
                      )
                    })()}
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
                        onToggle={(key) => { handleToggle(role.id, key); }}
                        onSelectAll={() => {
                          setLocalRules((prev) => ({
                            ...prev,
                            [role.id]: trackers.map((t) => t.code),
                          }))
                        }}
                        onClearAll={() => {
                          setLocalRules((prev) => ({
                            ...prev,
                            [role.id]: [],
                          }))
                        }}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                        openUpward={roles.length > 2 && idx >= roles.length - 2}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingId ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập tên vai trò dự án mới. Vai trò này có hiệu lực riêng biệt trong dự án này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRoleSubmit} className="space-y-6 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="role_name" className="text-xs font-bold">Tên vai trò *</Label>
              <Input
                id="role_name"
                value={roleName}
                onChange={(e) => { handleNameChange(e.target.value); }}
                placeholder="Ví dụ: Designer"
                className="rounded-full h-10 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role_code" className="text-xs font-bold">Mã vai trò (Tự động sinh) *</Label>
              <Input
                id="role_code"
                value={roleCode}
                onChange={(e) => { setRoleCode(e.target.value); }}
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
                onClick={() => { setIsModalOpen(false); }}
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

      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className="max-w-md rounded-xl bg-background border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Gán thành viên vào vai trò: {targetRole?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Chọn thành viên hiện tại trong dự án để chuyển sang vai trò này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="space-y-4 pt-3">
            {addMemberError && (
              <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive font-medium border border-destructive/20">
                {addMemberError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="directMemberEmp" className="text-xs font-semibold text-muted-foreground">
                Chọn thành viên
              </Label>
              <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                <SelectTrigger id="directMemberEmp" className="w-full h-10 border-border rounded-full px-4 bg-background">
                  <SelectValue placeholder="Chọn thành viên" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value={SELECT_NONE_VALUE} className="rounded-lg">Chọn thành viên</SelectItem>
                  {members
                    .filter((m) => m.employeeId !== project?.teamLeaderId && m.roleId !== targetRole?.id)
                    .map((m) => (
                      <SelectItem key={m.employeeId} value={m.employeeId} className="rounded-lg">
                        {m.employee?.fullName || "Chưa rõ"} (Vai trò hiện tại: {m.role?.name || "Chưa gán"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsAddMemberModalOpen(false); }}
                className="rounded-full text-xs h-9"
                disabled={isSubmittingMember}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-full text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95"
                disabled={isSubmittingMember}
              >
                {isSubmittingMember ? "Đang gán..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}


