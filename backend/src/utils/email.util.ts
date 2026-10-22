import { ENVIRONMENT, ENV_ENVIRONMENT } from "@/configs/system/server.config.ts"

import { Resend } from "resend"

/**
 * EmailUtil provides functionality for sending emails using Resend SDK.
 * Adheres to the requirement of being a simple reusable utility.
 */
export class EmailUtil {
  /**
   * Sends a password reset email to the specified user using Resend.
   * Returns the Resend response for debugging purposes.
   */
  static async sendResetPasswordEmail(to: string, token: string): Promise<any> {
    const apiKey = process.env.RESEND_API_KEY
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    const from = process.env.EMAIL_FROM || "noreply@smartpcstore.id.vn"

    const resetUrl = `${clientUrl}/reset-password?token=${token}`

    if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
      console.log(`[DEBUG] Email to: ${to}`)
      console.log(`[DEBUG] Generated Token: ${token}`)
      console.log(`[DEBUG] Reset URL: ${resetUrl}`)
    }

    // Fallback: If Resend API key is missing, log reset link to console for development
    if (!apiKey) {
      const mockResult = {
        mocked: true,
        to,
        token,
        resetUrl,
        message: "RESEND_API_KEY missing, email was mocked to console.",
      }
      console.log("--- EMAIL MOCK (RESEND_API_KEY MISSING) ---")
      console.log(JSON.stringify(mockResult, null, 2))
      console.log("-----------------------------------------")
      return mockResult
    }

    try {
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from: `DevCore ERP <${from}>`,
        to,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset for your <b>DevCore ERP</b> account.</p>
            <p>Please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in <strong>15 minutes</strong>.</p>
            <p style="color: #777; font-size: 14px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Alternatively, copy and paste this link into your browser:</p>
            <p style="color: #999; font-size: 12px; word-break: break-all;">${resetUrl}</p>
          </div>
        `,
      })

      if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
        console.log("Resend response:", JSON.stringify(result, null, 2))
      }

      return result
    } catch (error) {
      console.error("Failed to send email via Resend:", error)
      throw error // Re-throw to be caught in Service layer
    }
  }

  /**
   * Sends an account locked notification email.
   */
  static async sendAccountLockedEmail(
    to: string,
    data: {
      fullName: string
      lockedUntil: Date
      failedAttempts: number
    },
  ): Promise<any> {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM || "noreply@smartpcstore.id.vn"

    const lockTimeStr = data.lockedUntil.toLocaleTimeString()
    const lockExpiryStr = data.lockedUntil.toLocaleString()

    if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
      console.log(`[DEBUG] Account Locked Email to: ${to}`)
      console.log(`[DEBUG] Locked Until: ${lockExpiryStr}`)
    }

    if (!apiKey) {
      console.log("--- EMAIL MOCK (ACCOUNT LOCKED) ---")
      console.log(`To: ${to}, Locked Until: ${lockExpiryStr}`)
      return { mocked: true }
    }

    try {
      const resend = new Resend(apiKey)

      return await resend.emails.send({
        from: `DevCore Security <${from}>`,
        to,
        subject: "Security Alert: Account Temporarily Locked",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ffcccc; border-radius: 10px;">
            <h2 style="color: #d9534f;">Security Alert</h2>
            <p>Hello <strong>${data.fullName}</strong>,</p>
            <p>Your account has been temporarily locked due to <strong>${data.failedAttempts}</strong> consecutive failed login attempts.</p>
            <p>For your security, you will not be able to log in until:</p>
            <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; font-size: 18px; font-weight: bold; color: #333;">
              ${lockExpiryStr}
            </div>
            <p>If you did not attempt these logins, please contact your system administrator immediately.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated security notification from <b>DevCore ERP</b>.</p>
          </div>
        `,
      })
    } catch (error) {
      console.error("Failed to send account locked email:", error)
      throw error
    }
  }

  /**
   * Sends new account credentials email to the specified user using Resend.
   */
  static async sendNewEmployeeCredentialsEmail(
    to: string,
    username: string,
    password: string,
  ): Promise<any> {
    const apiKey = process.env.RESEND_API_KEY
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
    const from = process.env.EMAIL_FROM || "noreply@smartpcstore.id.vn"

    if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
      console.log(`[DEBUG] Email to: ${to}`)
      console.log(`[DEBUG] Generated Username: ${username}`)
      console.log(`[DEBUG] Generated Password: ${password}`)
    }

    if (!apiKey) {
      const mockResult = {
        mocked: true,
        to,
        username,
        password,
        message: "RESEND_API_KEY missing, email was mocked to console.",
      }
      console.log("--- EMAIL MOCK (NEW EMPLOYEE CREDENTIALS) ---")
      console.log(JSON.stringify(mockResult, null, 2))
      console.log("---------------------------------------------")
      return mockResult
    }

    try {
      const resend = new Resend(apiKey)

      const result = await resend.emails.send({
        from: `DevCore ERP <${from}>`,
        to,
        subject: "Welcome to DevCore ERP - Your Account Credentials",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #333;">Welcome to DevCore ERP</h2>
            <p>Hello,</p>
            <p>Your account has been successfully created. Below are your login credentials to access the system:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 16px;">
              <p style="margin: 5px 0;"><strong>Username:</strong> ${username}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            </div>
            <p>For security reasons, we recommend changing your password after your first login.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${clientUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to DevCore ERP</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated notification from <b>DevCore ERP</b>.</p>
          </div>
        `,
      })

      if (ENV_ENVIRONMENT !== ENVIRONMENT.PRODUCTION) {
        console.log("Resend response:", JSON.stringify(result, null, 2))
      }

      return result
    } catch (error) {
      console.error("Failed to send credentials email via Resend:", error)
      throw error
    }
  }
}
