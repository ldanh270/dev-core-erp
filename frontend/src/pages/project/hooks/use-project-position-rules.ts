import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useConfirm } from "@/components/common"
import { PROJECT_ROLE } from "@/config/entities/project.config"
import { projectApi } from "@/lib/api/project.api"
import type { ProjectRole } from "@/types/project-role.types"
import type { Project, ProjectMember } from "@/types/project.types"

import {
  useCreateProjectRole,
  useDeleteProjectRole,
  useProjectRoles,
  useUpdateProjectRole,
} from "./use-project-role"
import { useProjectTrackers } from "./use-project-tracker"

export const SELECT_NONE_VALUE = "none"

export interface DisplayRoleMember {
  id: string
  employeeId: string
  employee?: {
    fullName: string
    email?: string
  }
  isTeamLeaderField?: boolean
}

/**
 * Converts Vietnamese unicode or plain strings into standardized lower_snake_case codes.
 */
export const toSnakeCase = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
}

/**
 * Hook managing project roles, tracker permission matrices, and member role assignments.
 * @param projectId - Active project ID.
 */
export function useProjectPositionRules(projectId: string) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useProjectRoles(projectId)
  const { data: trackers = [] } = useProjectTrackers(projectId)

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ["members", projectId],
    queryFn: () => projectApi.getMembers(projectId),
    enabled: !!projectId,
  })

  const { data: project } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getOne(projectId),
    enabled: !!projectId,
  })

  const createRoleMutation = useCreateProjectRole(projectId)
  const updateRoleMutation = useUpdateProjectRole(projectId)
  const deleteRoleMutation = useDeleteProjectRole(projectId)

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [targetRole, setTargetRole] = useState<ProjectRole | null>(null)
  const [selectedEmpId, setSelectedEmpId] = useState(SELECT_NONE_VALUE)
  const [addMemberError, setAddMemberError] = useState<string | null>(null)
  const [isSubmittingMember, setIsSubmittingMember] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [roleName, setRoleName] = useState("")
  const [roleCode, setRoleCode] = useState("")

  const [openDropdown, setOpenDropdown] = useState<{ roleId: string; type: "tracker" | null }>({
    roleId: "",
    type: null,
  })

  const [localRules, setLocalRules] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (roles.length > 0 && trackers.length > 0) {
      const initialTrackers: Record<string, string[]> = {}
      roles.forEach((r) => {
        initialTrackers[r.id] =
          r.allowedTaskTrackers && r.allowedTaskTrackers.length > 0
            ? r.allowedTaskTrackers
            : trackers.map((t) => t.code)
      })
      setLocalRules(initialTrackers)
    }
  }, [roles, trackers])

  const getRoleMembers = (role: ProjectRole): DisplayRoleMember[] => {
    const assignedMembers: DisplayRoleMember[] = members
      .filter((m) => m.roleId === role.id)
      .map((m) => ({
        id: m.id,
        employeeId: m.employeeId,
        employee: m.employee
          ? { fullName: m.employee.fullName, email: m.employee.email }
          : undefined,
        isTeamLeaderField: false,
      }))

    const teamLeader = project?.teamLeader
    if (role.code === PROJECT_ROLE.LEADER && teamLeader) {
      const isAlreadyIncluded = assignedMembers.some((m) => m.employeeId === teamLeader.id)
      if (!isAlreadyIncluded) {
        const leaderMember: DisplayRoleMember = {
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

  const handleOpenAddMemberToRole = (role: ProjectRole) => {
    setTargetRole(role)
    setSelectedEmpId(SELECT_NONE_VALUE)
    setAddMemberError(null)
    setIsAddMemberModalOpen(true)
  }

  const handleRemoveMemberFromRole = async (employeeId: string, role: ProjectRole) => {
    const memberName =
      members.find((m) => m.employeeId === employeeId)?.employee?.fullName || "nhân sự này"
    const ok = await confirm({
      title: "Bỏ thành viên khỏi vai trò",
      description: `Bạn có chắc chắn muốn bỏ ${memberName} ra khỏi vai trò ${role.name}?`,
      variant: "destructive",
    })
    if (!ok) return

    try {
      await projectApi.updateMember(projectId, employeeId, { roleId: null })
      toast.success("Đã xóa nhân sự khỏi vai trò")
      await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể bỏ nhân sự khỏi vai trò"
      toast.error(message)
    }
  }

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRole) return
    if (selectedEmpId === SELECT_NONE_VALUE) {
      setAddMemberError("Vui lòng chọn nhân sự")
      return
    }

    const existingMember = members.find((m) => m.employeeId === selectedEmpId)
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
      toast.success(
        `Đã chuyển vai trò của ${existingMember.employee?.fullName || "thành viên"} sang ${targetRole.name}`,
      )
      await queryClient.invalidateQueries({ queryKey: ["members", projectId] })
      setIsAddMemberModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Thao tác thất bại"
      setAddMemberError(message)
    } finally {
      setIsSubmittingMember(false)
    }
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

  const handleOpenEdit = (role: ProjectRole) => {
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
      allowedTaskTrackers: editingId ? undefined : trackers.map((t) => t.code),
    }

    try {
      if (editingId) {
        await updateRoleMutation.mutateAsync({ id: editingId, data: payload })
      } else {
        await createRoleMutation.mutateAsync(payload)
      }
      setIsModalOpen(false)
      refetchRoles()
    } catch {
      /* Mutation error handled by query client toast */
    }
  }

  const handleRoleDelete = async (id: string, code: string) => {
    if (code === PROJECT_ROLE.LEADER) {
      toast.error("Không thể xóa vai trò Trưởng nhóm mặc định")
      return
    }
    const targetName = roles.find((r) => r.id === id)?.name || "vai trò này"
    const ok = await confirm({
      title: "Xác nhận xóa vai trò",
      description: `Bạn có chắc chắn muốn xóa vai trò "${targetName}"? Thành viên của vai trò này sẽ được chuyển sang Lập trình viên.`,
      variant: "destructive",
    })
    if (!ok) return

    try {
      await deleteRoleMutation.mutateAsync(id)
      refetchRoles()
    } catch {
      /* Mutation error handled by query client toast */
    }
  }

  const handleToggle = (roleId: string, trackerKey: string) => {
    setLocalRules((prev) => {
      const current = new Map(Object.entries(prev)).get(roleId) ?? []
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
    const invalidRole = Object.entries(localRules).find(
      ([, allowedTaskTrackers]) => allowedTaskTrackers.length === 0,
    )
    if (invalidRole) {
      const invalidRoleId = invalidRole.at(0)
      const roleObj = roles.find((r) => r.id === invalidRoleId)
      toast.error(
        `Vai trò "${roleObj?.name || "Không xác định"}" chưa chọn loại yêu cầu nào. Vui lòng chọn ít nhất 1 loại yêu cầu.`,
      )
      return
    }

    try {
      const promises = Object.entries(localRules).map(([id, allowedTaskTrackers]) => {
        return updateRoleMutation.mutateAsync({ id, data: { allowedTaskTrackers } })
      })
      await Promise.all(promises)
      toast.success("Lưu cấu hình phân quyền thành công")
      refetchRoles()
    } catch {
      toast.error("Lưu cấu hình thất bại")
    }
  }

  return {
    roles,
    trackers,
    members,
    project,
    isLoading: isLoadingRoles,
    isUpdating: updateRoleMutation.isPending,
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
  }
}
