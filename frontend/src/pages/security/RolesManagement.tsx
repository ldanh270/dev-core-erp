import { AppDrawer, PageCard, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EMPLOYEE_STATUS_VARIANTS, ROLE_LABELS } from "@/config/entities/employee.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/hooks/security/queries/use-security-query"
import { useConfirm } from "@/components/common"
import { useState } from "react"
import type { Role } from "@/types/security.types"
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  User,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FolderLock,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

/**
 * RolesManagement Component.
 * Provides features to view, create, edit, and delete system roles.
 * Displays employee assignments inside a drawer and updates role properties lazily.
 */
export default function RolesManagement() {
  const confirm = useConfirm()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [drawerPage, setDrawerPage] = useState(1)
  
  // Dialog states for Create/Edit Role
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  // Queries
  const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles, refetch: refetchRoles } = useRoles()

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  // Fetch users of the selected role inside the drawer
  const {
    data: roleUsers,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
    isPlaceholderData,
  } = useEmployees(
    {
      roleId: selectedRole?.id || undefined,
      page: drawerPage,
      limit: 8,
    },
    {
      enabled: !!selectedRole?.id,
    }
  )

  const handleOpenRoleDetail = (role: Role) => {
    setSelectedRole(role)
    setDrawerPage(1)
  }

  const handleCloseDrawer = () => {
    setSelectedRole(null)
  }

  // Create Role handlers
  const handleOpenCreate = () => {
    setRoleName("")
    setRoleDesc("")
    setIsDefault(false)
    setIsCreateOpen(true)
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      toast.error("Vui lòng nhập tên vai trò")
      return
    }
    try {
      await createRoleMutation.mutateAsync({
        name: roleName.trim().toLowerCase().replace(/\s+/g, "_"),
        description: roleDesc.trim(),
        isDefault,
      })
      toast.success("Tạo vai trò mới thành công")
      setIsCreateOpen(false)
    } catch {
      toast.error("Không thể tạo vai trò")
    }
  }

  // Edit Role handlers
  const handleOpenEdit = (role: Role) => {
    setEditingRole(role)
    setRoleName(role.name)
    setRoleDesc(role.description || "")
    setIsDefault(role.isDefault)
    setIsEditOpen(true)
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRole) return
    if (!roleName.trim()) {
      toast.error("Vui lòng nhập tên vai trò")
      return
    }
    try {
      await updateRoleMutation.mutateAsync({
        id: editingRole.id,
        data: {
          name: roleName.trim().toLowerCase().replace(/\s+/g, "_"),
          description: roleDesc.trim(),
          isDefault,
        },
      })
      toast.success("Cập nhật vai trò thành công")
      setIsEditOpen(false)
      // Update selected role state if currently open in drawer
      if (selectedRole?.id === editingRole.id) {
        setSelectedRole({ ...selectedRole, name: roleName, description: roleDesc, isDefault })
      }
    } catch {
      toast.error("Không thể cập nhật vai trò")
    }
  }

  // Delete Role handler
  const handleDeleteRole = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa vai trò",
      description: "Bạn có chắc chắn muốn xóa vai trò này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa vai trò",
      variant: "destructive",
    })
    if (!isConfirmed) {
      return
    }
    try {
      await deleteRoleMutation.mutateAsync(id)
      toast.success("Xóa vai trò thành công")
      if (selectedRole?.id === id) {
        setSelectedRole(null)
      }
    } catch {
      toast.error("Không thể xóa vai trò")
    }
  }

  // Derive pagination for drawer
  const totalPages = roleUsers?.meta.totalPages ?? 0

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Quản lý Vai trò
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Xem, tạo mới và quản lý các vai trò trong hệ thống.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 h-8 px-3 text-xs"
        >
          <Plus size={13} strokeWidth={2.5} />
          Thêm vai trò
        </Button>
      </div>

      {isLoadingRoles ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-4">Đang tải danh sách vai trò...</p>
        </div>
      ) : isErrorRoles ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold text-destructive">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Không thể tải thông tin vai trò. Vui lòng thử lại sau.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { refetchRoles(); }}>
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rolesData?.data?.map((role: Role) => {
            const count = role.employeesCount ?? 0
            const isSystem = role.isSystem
            
            // Map icons based on role name
            let IconComponent = Shield
            if (role.name === "admin") IconComponent = ShieldAlert
            else if (role.name === "general_manager") IconComponent = ShieldCheck
            else if (role.name === "hr_manager") IconComponent = Shield
            else if (role.name === "team_leader") IconComponent = Users
            else if (role.name === "employee") IconComponent = User

            return (
              <PageCard key={role.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <IconComponent size={20} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {role.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h3 className="text-sm font-bold text-foreground mb-1">
                        {ROLE_LABELS[role.name] || role.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {role.isDefault && (
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-px rounded">
                            Mặc định
                          </span>
                        )}
                        {isSystem && (
                          <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-px rounded">
                            Hệ thống
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 mt-1">
                      {role.description || "Chưa có mô tả cho vai trò này."}
                    </p>
                  </div>

                  <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Nhân sự
                      </span>
                      <span className="text-lg font-extrabold text-foreground">{count}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            handleOpenEdit(role)
                          }}
                          aria-label={`Chỉnh sửa vai trò ${ROLE_LABELS[role.name] || role.name}`}
                        >
                          <Edit2 size={13} />
                        </Button>
                      )}
                      {!isSystem && role.name !== "admin" && !role.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            handleDeleteRole(role.id)
                          }}
                          aria-label={`Xóa vai trò ${ROLE_LABELS[role.name] || role.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 px-2.5 text-xs text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => {
                          handleOpenRoleDetail(role)
                        }}
                      >
                        Xem chi tiết
                        <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              </PageCard>
            )
          })}
        </div>
      )}

      {/* AppDrawer for Role Details & Permissions */}
      <AppDrawer isOpen={!!selectedRole} onClose={handleCloseDrawer} widthClassName="w-full sm:max-w-[32rem]">
        <div className="p-6 h-full flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="mb-6 pt-6">
              <div className="flex items-center gap-2 mb-1">
                <FolderLock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  Nhân sự: {selectedRole ? ROLE_LABELS[selectedRole.name] || selectedRole.name : ""}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                {selectedRole?.description || "Không có mô tả."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 focus-visible:outline-none">
              {isLoadingUsers || isPlaceholderData ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <RefreshCw className="h-7 w-7 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-3">Đang tải danh sách nhân sự...</p>
                </div>
              ) : isErrorUsers ? (
                <div className="py-12 text-center bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-5">
                  <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">Không thể tải dữ liệu</h4>
                  <p className="text-xs text-muted-foreground mt-1">Đã có lỗi xảy ra khi truy xuất thông tin.</p>
                  <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={() => { refetchUsers(); }}>
                    Thử lại
                  </Button>
                </div>
              ) : roleUsers?.data.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border rounded-xl p-6">
                  <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-foreground">Trống</h4>
                  <p className="text-xs text-muted-foreground mt-1">Không có nhân sự nào giữ vai trò này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roleUsers?.data.map((employee) => (
                    <div
                      key={employee.id}
                      className="p-3.5 border border-border/80 rounded-xl bg-muted/5 flex items-center justify-between hover:bg-muted/15 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden shrink-0 border border-border">
                          {employee.avatar?.url ? (
                            <img src={employee.avatar.url} alt={employee.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={15} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground leading-snug">{employee.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono leading-none">{employee.username}</span>
                        </div>
                      </div>

                      <StatusPill
                        label={
                          employee.status === "active"
                            ? "Đang làm việc"
                            : employee.status === "inactive"
                            ? "Tạm nghỉ"
                            : employee.status === "on_leave"
                            ? "Nghỉ phép"
                            : "Đã nghỉ"
                        }
                        variant={EMPLOYEE_STATUS_VARIANTS[employee.status] ?? "neutral"}
                        className="text-[10px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Pagination (only for users tab) */}
          {totalPages > 1 && (
            <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Trang <span className="text-foreground font-semibold">{drawerPage}</span> / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  disabled={drawerPage === 1}
                  onClick={() => { setDrawerPage((prev) => Math.max(1, prev - 1)) }}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px]"
                  disabled={drawerPage === totalPages}
                  onClick={() => { setDrawerPage((prev) => Math.min(totalPages, prev + 1)) }}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppDrawer>

      {/* Dialog for Creating Role */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateRole}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Thêm vai trò mới</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Nhập các thông tin cơ bản để tạo vai trò truy cập mới.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name" className="text-xs font-semibold">Tên vai trò (bằng tiếng Anh, viết liền hoặc dùng dấu gạch dưới)</Label>
                <Input
                  id="create-name"
                  placeholder="e.g. hr_assistant, project_viewer"
                  value={roleName}
                  onChange={(e) => { setRoleName(e.target.value); }}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-desc" className="text-xs font-semibold">Mô tả</Label>
                <Textarea
                  id="create-desc"
                  placeholder="Nhập mô tả chi tiết chức năng của vai trò này..."
                  value={roleDesc}
                  onChange={(e) => { setRoleDesc(e.target.value); }}
                  className="text-xs min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create-is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="create-is-default" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Đặt làm vai trò mặc định cho nhân sự mới
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); }} className="h-9 text-xs">
                Hủy
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending} className="h-9 text-xs">
                {createRoleMutation.isPending ? "Đang tạo..." : "Tạo vai trò"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Editing Role */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateRole}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Chỉnh sửa vai trò</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cập nhật thông tin vai trò truy cập hệ thống.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-xs font-semibold">Tên vai trò</Label>
                <Input
                  id="edit-name"
                  value={roleName}
                  onChange={(e) => { setRoleName(e.target.value); }}
                  className="h-9 text-xs"
                  required
                  disabled={editingRole?.name === "admin"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc" className="text-xs font-semibold">Mô tả</Label>
                <Textarea
                  id="edit-desc"
                  value={roleDesc}
                  onChange={(e) => { setRoleDesc(e.target.value); }}
                  className="text-xs min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="edit-is-default" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Đặt làm vai trò mặc định cho nhân sự mới
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); }} className="h-9 text-xs">
                Hủy
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending} className="h-9 text-xs">
                {updateRoleMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
