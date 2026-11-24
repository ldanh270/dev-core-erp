import { DatePicker, PageCard } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProfileFormValues } from "@/hooks/profile/useProfileMaster"

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { Edit2, Save, X } from "lucide-react"

export interface ProfileEditSectionProps {
  register: UseFormRegister<ProfileFormValues>
  errors: FieldErrors<ProfileFormValues>
  watch: UseFormWatch<ProfileFormValues>
  setValue: UseFormSetValue<ProfileFormValues>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isPending: boolean
}

/**
 * Edit form section allowing users to update their personal and contact profile details.
 */
export function ProfileEditSection({
  register,
  errors,
  watch,
  setValue,
  onSubmit,
  onCancel,
  isPending,
}: ProfileEditSectionProps) {
  return (
    <PageCard>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <Edit2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Chỉnh sửa hồ sơ cá nhân</h3>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-full cursor-pointer"
            >
              <X size={14} className="mr-1.5" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-full cursor-pointer"
            >
              {isPending ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              {...register("fullName")}
              className={errors.fullName ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="VD: 0901234567"
              className={errors.phone ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <DatePicker
              value={watch("dateOfBirth") || null}
              onChange={(val) => {
                setValue("dateOfBirth", val || "", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nationalId">CMND / CCCD</Label>
            <Input
              id="nationalId"
              {...register("nationalId")}
              className={errors.nationalId ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.nationalId && (
              <p className="text-xs text-destructive mt-1">{errors.nationalId.message}</p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address">Địa chỉ thường trú</Label>
            <Input
              id="address"
              {...register("address")}
              className={errors.address ? "border-destructive rounded-full" : "rounded-full"}
            />
            {errors.address && (
              <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
            )}
          </div>
        </div>
      </form>
    </PageCard>
  )
}
