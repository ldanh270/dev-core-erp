import apiClient from "@/lib/api-client.ts"
import type { ApiResponse, ProfileDto, UpdateProfileDto } from "@/types/profile.types.ts"

/**
 * Fetches the authenticated user's profile.
 *
 * @returns Authenticated employee profile details
 * @throws {Error} When profile fetch request fails
 */
export const getMyProfile = async (): Promise<ProfileDto> => {
  const response = await apiClient.get<ApiResponse<ProfileDto>>("/profile/me")
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to fetch profile")
  }
  return response.data.data
}

/**
 * Updates the authenticated user's profile.
 *
 * @param data - Updated profile payload fields
 * @returns Updated profile details
 * @throws {Error} When update request fails
 */
export const updateMyProfile = async (data: UpdateProfileDto): Promise<ProfileDto> => {
  const response = await apiClient.patch<ApiResponse<ProfileDto>>("/profile/me", data)
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to update profile")
  }
  return response.data.data
}

/**
 * Uploads a new avatar image for the authenticated user.
 *
 * @param file - Image file to upload
 * @returns Updated profile containing new avatar URL
 * @throws {Error} When upload request fails
 */
export const uploadAvatar = async (file: File): Promise<ProfileDto> => {
  const formData = new FormData()
  formData.append("avatar", file)

  const response = await apiClient.post<ApiResponse<ProfileDto>>("/profile/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to upload avatar")
  }
  return response.data.data
}

/**
 * Changes the authenticated user's account password.
 *
 * @param oldPassword - Existing account password
 * @param newPassword - New password to set
 * @returns Resolves when password change succeeds
 * @throws {Error} When password verification or change fails
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>("/profile/me/change-password", {
    oldPassword,
    newPassword,
  })
  if (response.data.status === "error") {
    throw new Error(response.data.message || "Failed to change password")
  }
}

/**
 * Updates the personal attendance employee link for administrative users.
 *
 * @param personalEmployeeId - Target employee ID to link, or null to unlink
 * @returns Updated profile details
 * @throws {Error} When linking operation fails
 */
export const updatePersonalEmployeeLink = async (
  personalEmployeeId: string | null,
): Promise<ProfileDto> => {
  const response = await apiClient.patch<ApiResponse<ProfileDto>>("/profile/me/personal-employee", {
    personalEmployeeId,
  })
  if (response.data.status === "error" || !response.data.data) {
    throw new Error(response.data.message || "Failed to update personal employee link")
  }
  return response.data.data
}
