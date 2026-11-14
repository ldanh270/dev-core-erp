import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { assertCloudinaryConfigured, cloudinary } from "@/configs/system/cloudinary.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { UPLOAD_CONFIG } from "@/configs/system/upload.config.ts"
import { authorizationService } from "@/services/authorization.service.ts"
import type {
  IProfileRepository,
  IProfileService,
  ProfileDto,
  ProfileEmployeeDocument,
  ProfileEmployeeDocumentWithPassword,
  UpdatePersonalEmployeeLinkDto,
  UpdateProfileDto,
} from "@/types/profile.types.ts"
import { CloudinaryUtil } from "@/utils/cloudinary.util.ts"
import { AppError } from "@/utils/error.util.ts"
import { HashUtil } from "@/utils/hash.util.ts"

const LAYER_NAME = "ProfileService"
/**
 * Maps a Mongoose employee document to a clean ProfileDto
 * Centralizes the field-picking logic so controllers stay thin
 */
async function toProfileDto(emp: ProfileEmployeeDocument): Promise<ProfileDto> {
  const authContext = await authorizationService.getAuthorizationContext(emp.id)
  const roles = Array.from(authContext.roles)
  const linked = emp.personalEmployee
  const isLinkedActive =
    linked && linked.deletedAt == null && linked.status === EMPLOYEE_STATUS.ACTIVE

  return {
    id: emp.id,
    fullName: emp.fullName,
    username: emp.username,
    email: emp.email,
    phone: emp.phone ?? null,
    dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.toISOString().split("T")[0] : null,
    nationalId: emp.nationalId ?? null,
    address: emp.address ?? null,
    position: emp.position ?? null,
    positionId: emp.positionId ?? null,
    roles,
    employeeType: emp.employeeType,
    workScheduleType: emp.workScheduleType, // drives PT nav/features on profile
    status: emp.status,
    startDate: emp.startDate ? emp.startDate.toISOString().split("T")[0] : null,
    avatar: {
      url: emp.avatarUrl ?? null,
      id: emp.avatarId ?? null,
    },
    personalEmployeeId: isLinkedActive ? emp.personalEmployeeId : null,
    personalEmployee: isLinkedActive
      ? { id: linked.id, fullName: linked.fullName, email: linked.email }
      : null,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  }
}

/**
 * ProfileService implements business logic for profile read, update, and avatar upload
 * Depends on IProfileRepository abstraction (Dependency Injection)
 */
export class ProfileService implements IProfileService {
  constructor(private repo: IProfileRepository) {}

  /**
   * Retrieves the authenticated user's own profile
   */
  async getMyProfile(empId: string): Promise<ProfileDto> {
    const employee = await this.repo.findById(empId)

    if (!employee) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    return await toProfileDto(employee)
  }

  /**
   * Updates editable profile fields for the authenticated user
   */
  async updateMyProfile(empId: string, data: UpdateProfileDto): Promise<ProfileDto> {
    const updated = await this.repo.updateProfile(empId, data)

    if (!updated) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    return await toProfileDto(updated)
  }

  /**
   * Uploads a new avatar image to Cloudinary and saves the result to the employee record
   * Old Cloudinary image is deleted if a previous public_id exists
   */
  async uploadAvatar(empId: string, fileBuffer: Buffer, mimeType: string): Promise<ProfileDto> {
    // Check if Cloudinary is configured
    try {
      assertCloudinaryConfigured()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Cloudinary is not configured"
      throw new AppError(message, HttpStatusCode.BAD_REQUEST, LAYER_NAME)
    }

    // Fetch current profile to get old avatar id for cleanup
    const current = await this.repo.findById(empId)

    if (!current) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    // Delete old Cloudinary asset if it exists
    if (current.avatarId) {
      await cloudinary.uploader.destroy(current.avatarId).catch(() => {
        console.warn(`[ProfileService] Could not delete old avatar: ${current.avatarId}`)
      })
    }

    // Upload new image
    const { url, id } = await CloudinaryUtil.uploadStream(fileBuffer, {
      folder: UPLOAD_CONFIG.CLOUDINARY_FOLDERS.AVATARS,
      resource_type: "image",
      public_id: `avatar_${Date.now()}_${empId}`,
      overwrite: true,
      format: "webp",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    })

    // Persist updated avatar reference
    const updated = await this.repo.updateAvatar(empId, { url, id })

    if (!updated) {
      throw new AppError("Failed to save avatar", HttpStatusCode.INTERNAL_SERVER_ERROR, LAYER_NAME)
    }

    return await toProfileDto(updated)
  }

  /**
   * Updates the password for the authenticated user after verifying the current (old) password
   */
  async changePassword(empId: string, oldPass: string, newPass: string): Promise<void> {
    const employee = await this.repo.findAuthById(empId)

    if (!employee) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, "ProfileService")
    }

    // Verify current password
    const isMatch = await HashUtil.compare(oldPass, employee.passwordHash)
    if (!isMatch) {
      throw new AppError(
        "Mật khẩu hiện tại không chính xác",
        HttpStatusCode.BAD_REQUEST,
        LAYER_NAME,
        "INVALID_CURRENT_PASSWORD",
      )
    }

    // Hash and save new password via repository
    await this.repo.updatePassword(empId, await HashUtil.hash(newPass))
  }

  /**
   * Performs operations for updatePersonalEmployeeLink.
   */
  async updatePersonalEmployeeLink(
    empId: string,
    data: UpdatePersonalEmployeeLinkDto,
  ): Promise<ProfileDto> {
    const account = await this.repo.findById(empId)
    if (!account) {
      throw new AppError("Profile not found", HttpStatusCode.NOT_FOUND, LAYER_NAME)
    }

    const authContext = await authorizationService.getAuthorizationContext(empId)
    const isManager = authContext.isDynamicAdmin || authContext.permissions.has("employee.update")

    if (!isManager) {
      throw new AppError(
        "Chỉ tài khoản quản trị mới được liên kết hồ sơ chấm công",
        HttpStatusCode.FORBIDDEN,
        LAYER_NAME,
      )
    }

    let personalEmployeeId = data.personalEmployeeId ?? null
    if (personalEmployeeId === empId) {
      personalEmployeeId = null
    }

    if (personalEmployeeId) {
      const linked = await this.repo.findById(personalEmployeeId)
      if (!linked || linked.status !== EMPLOYEE_STATUS.ACTIVE) {
        throw new AppError(
          "Hồ sơ nhân viên liên kết không hợp lệ",
          HttpStatusCode.BAD_REQUEST,
          LAYER_NAME,
        )
      }
    }

    const updated = await this.repo.updatePersonalEmployeeLink(empId, personalEmployeeId)
    if (!updated) {
      throw new AppError(
        "Không thể cập nhật liên kết hồ sơ chấm công",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        LAYER_NAME,
      )
    }

    return await toProfileDto(updated)
  }
}
