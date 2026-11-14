import { ErrorCode, ErrorMessage } from "@/configs/system/error-code.config.ts"
import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { AuthRequest } from "@/middlewares/auth.middleware.ts"
import {
  changePasswordSchema,
  updatePersonalEmployeeLinkSchema,
  updateProfileSchema,
} from "@/schemas/profile.schema.ts"
import type { IProfileService } from "@/types/profile.types.ts"

import { Response } from "express"

/**
 * ProfileController handles HTTP requests for profile management
 * Acts as an HTTP adapter — delegates all business logic to IProfileService
 */
export class ProfileController {
  constructor(private service: IProfileService) {}

  /**
   * GET /api/profile/me
   * Returns the authenticated user's full profile
   */
  getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      const profile = await this.service.getMyProfile(req.user.empId)

      return res.status(HttpStatusCode.OK).json({
        status: "success",
        data: profile,
      })
    } catch (error: any) {
      return res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || "Failed to fetch profile",
      })
    }
  }

  /**
   * PATCH /api/profile/me
   * Updates editable fields on the authenticated user's profile
   */
  updateMyProfile = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      // Validate request body with Zod
      const validatedData = updateProfileSchema.parse(req.body)

      const profile = await this.service.updateMyProfile(req.user.empId, validatedData)

      return res.status(HttpStatusCode.OK).json({
        status: "success",
        data: profile,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      return res.status(statusCode).json({
        status: "error",
        message: error.message || "Failed to update profile",
        errors: error.errors,
      })
    }
  }

  /**
   * POST /api/profile/me/avatar
   * Uploads a new avatar image via multipart/form-data
   * Expects multer to have attached the file to req.file
   */
  uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      const file = (req as any).file as Express.Multer.File | undefined

      if (!file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          status: "error",
          message: "No image file provided. Use field name: avatar",
        })
      }

      const profile = await this.service.uploadAvatar(req.user.empId, file.buffer, file.mimetype)

      return res.status(HttpStatusCode.OK).json({
        status: "success",
        data: profile,
      })
    } catch (error: any) {
      return res.status(error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || "Avatar upload failed",
      })
    }
  }

  /**
   * POST /api/profile/me/change-password
   * Changes the password of the authenticated user
   */
  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      // Validate request body
      const validatedData = changePasswordSchema.parse(req.body)

      await this.service.changePassword(
        req.user.empId,
        validatedData.oldPassword,
        validatedData.newPassword,
      )

      return res.status(HttpStatusCode.OK).json({
        status: "success",
        message: "Thay đổi mật khẩu thành công",
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      return res.status(statusCode).json({
        status: "error",
        message: error.message || "Failed to change password",
        type:
          error.errorCode ||
          (error.name === "ZodError" ? ErrorCode.VALIDATION_ERROR : ErrorCode.INTERNAL_ERROR),
        errors: error.errors,
      })
    }
  }

  updatePersonalEmployeeLink = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          status: "error",
          message: ErrorMessage.UNAUTHORIZED,
        })
      }

      const validatedData = updatePersonalEmployeeLinkSchema.parse(req.body)
      const profile = await this.service.updatePersonalEmployeeLink(req.user.empId, validatedData)

      return res.status(HttpStatusCode.OK).json({
        status: "success",
        data: profile,
      })
    } catch (error: any) {
      const statusCode =
        error.name === "ZodError"
          ? HttpStatusCode.BAD_REQUEST
          : error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR

      return res.status(statusCode).json({
        status: "error",
        message: error.message || "Failed to update personal employee link",
        errors: error.errors,
      })
    }
  }
}
