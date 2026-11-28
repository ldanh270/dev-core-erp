import { DetailPageLayout, StatusPill } from "@/components/common"
import { ProfileEditSection } from "@/components/features/profile/ProfileEditSection"
import { ProfileOverviewSection } from "@/components/features/profile/ProfileOverviewSection"
import { ProfileOverviewSidebar } from "@/components/features/profile/ProfileOverviewSidebar"
import { ProfilePasswordSection } from "@/components/features/profile/ProfilePasswordSection"
import { Button } from "@/components/ui/button"
import { EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABELS } from "@/config/entities/employee.config"
import { useProfileMaster } from "@/hooks/profile/useProfileMaster"

import { useMemo } from "react"

import { Edit2, KeyRound, User } from "lucide-react"

/**
 * Standardized Profile Page.
 * Thin declarative composition shell connecting useProfileMaster with DetailPageLayout.
 */
export default function Profile() {
  const {
    profile,
    isLoading,
    activeTab,
    isEditing,
    fileInputRef,
    handleAvatarChange,
    handleEditClick,
    handleCancelClick,
    handleTabChange,
    uploadAvatar,
    profileForm,
    onProfileSubmit,
    updateProfile,
    passwordForm,
    onPasswordSubmit,
    changePasswordMut,
    passwordSuccessMsg,
    passwordErrorMsg,
  } = useProfileMaster()

  const tabsConfig = useMemo(
    () => ({
      items: [
        { id: "profile", label: "Thông tin hồ sơ", icon: User },
        { id: "password", label: "Đổi mật khẩu", icon: KeyRound },
      ],
      activeTab,
      onTabChange: handleTabChange,
    }),
    [activeTab, handleTabChange],
  )

  if (isLoading || !profile) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const statusVariant =
    profile.status === EMPLOYEE_STATUS.ACTIVE
      ? "success"
      : profile.status === EMPLOYEE_STATUS.ON_LEAVE
        ? "warning"
        : "neutral"

  return (
    <DetailPageLayout
      title={profile.fullName}
      subtitle={profile.email}
      avatar={
        <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
          {profile.avatar?.url ? (
            <img
              src={profile.avatar.url}
              alt={profile.fullName}
              className="size-full object-cover"
            />
          ) : (
            <User className="size-8 text-primary" />
          )}
        </div>
      }
      statusBadge={
        <StatusPill
          variant={statusVariant}
          label={EMPLOYEE_STATUS_LABELS[profile.status] || profile.status}
        />
      }
      actions={
        activeTab === "profile" && !isEditing ? (
          <Button
            variant="outline"
            onClick={handleEditClick}
            className="gap-2 shadow-sm rounded-full cursor-pointer hover:bg-secondary"
          >
            <Edit2 size={14} />
            Chỉnh sửa hồ sơ
          </Button>
        ) : undefined
      }
      tabs={tabsConfig}
      sidebar={
        <ProfileOverviewSidebar
          profile={profile}
          isEditing={isEditing}
          fileInputRef={fileInputRef}
          handleAvatarChange={handleAvatarChange}
          uploadAvatarPending={uploadAvatar.isPending}
          uploadAvatarError={
            uploadAvatar.isError
              ? (uploadAvatar.error as { message?: string })?.message || "Không thể upload ảnh"
              : null
          }
        />
      }
      sidebarPosition="right"
    >
      {activeTab === "profile" ? (
        isEditing ? (
          <ProfileEditSection
            register={profileForm.register}
            errors={profileForm.formState.errors}
            watch={profileForm.watch}
            setValue={profileForm.setValue}
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            onCancel={handleCancelClick}
            isPending={updateProfile.isPending}
          />
        ) : (
          <ProfileOverviewSection profile={profile} />
        )
      ) : (
        <ProfilePasswordSection
          register={passwordForm.register}
          errors={passwordForm.formState.errors}
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          onReset={() => {
            passwordForm.reset()
            handleTabChange("password")
          }}
          isPending={changePasswordMut.isPending}
          successMsg={passwordSuccessMsg}
          errorMsg={passwordErrorMsg}
        />
      )}
    </DetailPageLayout>
  )
}
