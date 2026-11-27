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
import { Textarea } from "@/components/ui/textarea"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Role } from "@/types/security.types"
import { useEffect, useState } from "react"
import { toast } from "sonner"

/**
 * Props for RoleFormDialog component.
 */
export interface RoleFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  role?: Role | null
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description: string; isDefault: boolean }) => Promise<void>
  isPending: boolean
}

/**
 * Modal dialog for creating a new custom role or editing an existing role's metadata.
 */
export function RoleFormDialog({
  open,
  mode,
  role,
  onOpenChange,
  onSubmit,
  isPending,
}: RoleFormDialogProps) {
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  const isEdit = mode === "edit"

  useEffect(() => {
    if (open) {
      if (isEdit && role) {
        setRoleName(role.name)
        setRoleDesc(role.description || "")
        setIsDefault(role.isDefault)
      } else {
        setRoleName("")
        setRoleDesc("")
        setIsDefault(false)
      }
    }
  }, [open, isEdit, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      toast.error("Vui lòng nhập tên vai trò")
      return
    }
    await onSubmit({
      name: roleName,
      description: roleDesc,
      isDefault,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className={cn(TYPOGRAPHY.MODAL_TITLE)}>
              {isEdit ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            </DialogTitle>
            <DialogDescription className={cn(TYPOGRAPHY.MODAL_DESCRIPTION)}>
              {isEdit
                ? "Cập nhật thông tin vai trò truy cập hệ thống."
                : "Nhập các thông tin cơ bản để tạo vai trò truy cập mới."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-form-name" className={cn(TYPOGRAPHY.FORM_LABEL)}>
                {isEdit
                  ? "Tên vai trò"
                  : "Tên vai trò (bằng tiếng Anh, viết liền hoặc dùng dấu gạch dưới)"}
              </Label>
              <Input
                id="role-form-name"
                placeholder={isEdit ? undefined : "e.g. hr_assistant, project_viewer"}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="rounded-full text-xs"
                required
                disabled={isEdit && role?.name === "admin"}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-form-desc" className={cn(TYPOGRAPHY.FORM_LABEL)}>
                Mô tả
              </Label>
              <Textarea
                id="role-form-desc"
                placeholder="Nhập mô tả chi tiết chức năng của vai trò này..."
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                className="text-xs min-h-[80px] rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="role-form-is-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <Label
                htmlFor="role-form-is-default"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Đặt làm vai trò mặc định cho nhân sự mới
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full text-xs font-semibold"
            >
              {isPending
                ? isEdit
                  ? "Đang lưu..."
                  : "Đang tạo..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
