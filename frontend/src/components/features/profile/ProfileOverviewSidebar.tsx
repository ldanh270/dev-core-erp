import { PageCard, SectionHeader } from "@/components/common"
import { PersonalEmployeeLinkSection } from "@/components/features/profile/personal-employee-link-section"
import type { ProfileDto } from "@/types/profile.types"

import type { ChangeEvent, RefObject } from "react"
import { Camera } from "lucide-react"

export interface ProfileOverviewSidebarProps {
  profile: ProfileDto
  isEditing: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  handleAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void
  uploadAvatarPending: boolean
  uploadAvatarError?: string | null
}

/**
 * Sidebar presenter rendering the profile avatar uploader and account identifier cards.
 */
export function ProfileOverviewSidebar({
  profile,
  isEditing,
  fileInputRef,
  handleAvatarChange,
  uploadAvatarPending,
  uploadAvatarError,
}: ProfileOverviewSidebarProps) {
  return (
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatarPending}
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

        {uploadAvatarPending && (
          <p className="text-xs text-primary font-medium mt-3 animate-pulse">
            Đang tải ảnh đại diện lên...
          </p>
        )}

        {uploadAvatarError && (
          <p className="text-xs text-destructive font-medium mt-3 px-3 py-1.5 bg-destructive/10 rounded-lg">
            {uploadAvatarError}
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
  )
}
