import { DatePicker, IconBox, PageCard, SectionHeader, StatusPill } from "@/components/common/index.ts"
import { PersonalEmployeeLinkSection } from "@/components/features/profile/personal-employee-link-section"
import { Button } from "@/components/ui/button.tsx"
import { Input } from "@/components/ui/input.tsx"
import { Label } from "@/components/ui/label.tsx"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx"
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  getWorkScheduleTypeLabel,
  ROLE_LABELS,
} from "@/config/entities/employee.config"
import { useProfileMaster } from "@/hooks/profile/useProfileMaster"

import {
  Briefcase,
  Calendar,
  Camera,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react"

export default function Profile() {
  const {
    profile,
    isLoading,
    isError,
    activeTab,
    isEditing,
    fileInputRef,
    passwordSuccessMsg,
    passwordErrorMsg,
    profileForm,
    passwordForm,
    handleEditClick,
    handleCancelClick,
    onProfileSubmit,
    onPasswordSubmit,
    handleAvatarChange,
    handleTabChange,
    updateProfile,
    uploadAvatar,
    changePasswordMut,
  } = useProfileMaster()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = profileForm

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = passwordForm

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-muted rounded-xl w-full"></div>
            <div className="h-48 bg-muted rounded-xl w-full"></div>
          </div>
          <div className="h-72 bg-muted rounded-xl w-full"></div>
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-xl">
          Lỗi: Không thể tải dữ liệu hồ sơ nhân sự
        </div>
      </div>
    )
  }

  const roleLabels =
    profile.roles.length > 0
      ? profile.roles.map((role) => ROLE_LABELS[role] || role).join(", ")
      : "Chưa cập nhật"

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Nhân sự</span>
          <span className="opacity-50">/</span>
          <span>Thông tin cá nhân</span>
          <span className="opacity-50">/</span>
          <span className="text-foreground font-medium">Hồ sơ nhân sự</span>
        </div>
        <div className="flex items-center justify-between mt-1 border-b border-border/40 pb-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ nhân sự</h1>
          {activeTab === "profile" && !isEditing && (
            <Button
              variant="outline"
              onClick={handleEditClick}
              className="gap-2 shadow-sm rounded-full cursor-pointer hover:bg-secondary"
            >
              <Edit2 size={14} />
              Chỉnh sửa hồ sơ
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Hồ sơ cá nhân</TabsTrigger>
          <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "profile" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Information details or edit form (Col-span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              <PageCard>
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3.5 mb-4">
                    <div className="flex items-center gap-2">
                      <Edit2 size={16} className="text-primary" />
                      <h3 className="text-sm font-bold text-foreground">Chỉnh sửa hồ sơ cá nhân</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancelClick}
                        disabled={updateProfile.isPending}
                        className="rounded-full cursor-pointer"
                      >
                        <X size={14} className="mr-1.5" />
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="rounded-full cursor-pointer"
                      >
                        {updateProfile.isPending ? (
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
                        {...registerProfile("fullName")}
                        className={
                          profileErrors.fullName
                            ? "border-destructive rounded-full"
                            : "rounded-full"
                        }
                      />
                      {profileErrors.fullName && (
                        <p className="text-xs text-destructive mt-1">
                          {profileErrors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        {...registerProfile("phone")}
                        placeholder="VD: 0901234567"
                        className={
                          profileErrors.phone ? "border-destructive rounded-full" : "rounded-full"
                        }
                      />
                      {profileErrors.phone && (
                        <p className="text-xs text-destructive mt-1">
                          {profileErrors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                      <DatePicker
                        value={profileForm.watch("dateOfBirth") || null}
                        onChange={(val) => {
                          profileForm.setValue("dateOfBirth", val || "", { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                      {profileErrors.dateOfBirth && (
                        <p className="text-xs text-destructive mt-1">
                          {profileErrors.dateOfBirth.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="nationalId">CMND / CCCD</Label>
                      <Input
                        id="nationalId"
                        {...registerProfile("nationalId")}
                        className={
                          profileErrors.nationalId
                            ? "border-destructive rounded-full"
                            : "rounded-full"
                        }
                      />
                      {profileErrors.nationalId && (
                        <p className="text-xs text-destructive mt-1">
                          {profileErrors.nationalId.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="address">Địa chỉ thường trú</Label>
                      <Input
                        id="address"
                        {...registerProfile("address")}
                        className={
                          profileErrors.address ? "border-destructive rounded-full" : "rounded-full"
                        }
                      />
                      {profileErrors.address && (
                        <p className="text-xs text-destructive mt-1">
                          {profileErrors.address.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </PageCard>
            ) : (
              <>
                {/* Card 1: Personal Info */}
                <PageCard>
                  <SectionHeader title="Thông tin cá nhân" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 mt-2">
                    <div className="flex items-center gap-3 py-1 border-b border-border/20 md:border-none">
                      <IconBox icon={User} colorClass="bg-primary/10 text-primary" size="sm" />
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                          Họ và tên
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {profile.fullName}
                        </p>
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

                {/* Card 2: Contact Info */}
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
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {profile.email}
                        </p>
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

                {/* Card 3: Job Info */}
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
                        <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">
                          {roleLabels}
                        </p>
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
                          {EMPLOYEE_TYPE_LABELS[profile.employeeType] || profile.employeeType}
                        </p>
                      </div>
                    </div>

                    {/* workScheduleType: whether employee uses shift templates or PT availability. */}
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
                            variant={
                              profile.status === EMPLOYEE_STATUS.ACTIVE
                                ? "success"
                                : profile.status === EMPLOYEE_STATUS.ON_LEAVE
                                  ? "warning"
                                  : "neutral"
                            }
                            label={EMPLOYEE_STATUS_LABELS[profile.status] || profile.status}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PageCard>
              </>
            )}
          </div>

          {/* Right Column: Avatar and system settings */}
          <div className="space-y-6">
            {/* Avatar Card */}
            <PageCard className="flex flex-col items-center py-6 text-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md">
                  {profile.avatar?.url ? (
                    <img
                      src={profile.avatar.url}
                      alt={profile.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-muted-foreground">
                      {profile.fullName.charAt(0)}
                    </span>
                  )}
                </div>

                {isEditing && (
                  <button
                    onClick={() => {
                      fileInputRef.current?.click()
                    }}
                    disabled={uploadAvatar.isPending}
                    className="absolute bottom-0 right-0 p-2.5 bg-primary text-primary-foreground rounded-full shadow-md border border-background hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
                    aria-label="Thay đổi ảnh đại diện"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={16} />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
              </div>

              <h2 className="text-lg font-bold text-foreground mt-4">{profile.fullName}</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {profile.position || "Chưa cập nhật chức vụ"}
              </p>

              {uploadAvatar.isPending && (
                <p className="text-xs text-primary font-medium mt-3 animate-pulse">
                  Đang tải ảnh đại diện lên...
                </p>
              )}

              {uploadAvatar.isError && (
                <p className="text-xs text-destructive font-medium mt-3 px-3 py-1.5 bg-destructive/10 rounded-lg">
                  {(uploadAvatar.error as { message?: string })?.message ||
                    "Không thể upload ảnh đại diện"}
                </p>
              )}
            </PageCard>

            {/* Account Settings Card */}
            <PageCard>
              <SectionHeader title="Tài khoản hệ thống" />
              <div className="space-y-3.5">
                <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                  <span className="text-xs text-muted-foreground font-medium">Tên đăng nhập</span>
                  <span className="text-sm font-semibold text-foreground">{profile.username}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground font-medium">Mã nhân viên</span>
                  <span className="text-sm font-semibold text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-lg">
                    {profile.id.substring(profile.id.length - 6).toUpperCase()}
                  </span>
                </div>
              </div>
            </PageCard>

            <PersonalEmployeeLinkSection profile={profile} />
          </div>
        </div>
      ) : (
        /* Change Password Tab Content */
        <div className="max-w-xl mx-auto">
          <PageCard>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <div className="border-b border-border/40 pb-3 mb-1">
                <h3 className="text-sm font-bold text-foreground">Đổi mật khẩu tài khoản</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vui lòng điền mật khẩu hiện tại và thiết lập mật khẩu mới.
                </p>
              </div>

              {passwordSuccessMsg && (
                <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold">
                  {passwordSuccessMsg}
                </div>
              )}

              {passwordErrorMsg && (
                <div className="bg-rose-500/10 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold">
                  {passwordErrorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="oldPassword">
                  Mật khẩu hiện tại <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="oldPassword"
                  type="password"
                  autoComplete="current-password"
                  {...registerPassword("oldPassword")}
                  className={
                    passwordErrors.oldPassword ? "border-destructive rounded-full" : "rounded-full"
                  }
                />
                {passwordErrors.oldPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordErrors.oldPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword">
                  Mật khẩu mới <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword("newPassword")}
                  className={
                    passwordErrors.newPassword ? "border-destructive rounded-full" : "rounded-full"
                  }
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  Nhập lại mật khẩu mới <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerPassword("confirmPassword")}
                  className={
                    passwordErrors.confirmPassword
                      ? "border-destructive rounded-full"
                      : "rounded-full"
                  }
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    passwordForm.reset()
                    handleTabChange("password")
                  }}
                  disabled={changePasswordMut.isPending}
                  className="rounded-full cursor-pointer"
                >
                  Xóa nhập liệu
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMut.isPending}
                  className="rounded-full cursor-pointer"
                >
                  {changePasswordMut.isPending ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </Button>
              </div>
            </form>
          </PageCard>
        </div>
      )}
    </div>
  )
}
