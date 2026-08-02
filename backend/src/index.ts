import { HttpStatusCode } from "@/configs/system/http.config.ts"
import { PORT } from "@/configs/system/server.config.ts"
import { initCapacityCopilotCron } from "@/libs/capacity-copilot-cron.ts"
import { connectDB } from "@/libs/database.ts"
import { initCronJobs } from "@/libs/payroll-cron.ts"
import { initWeeklyScheduleCron } from "@/libs/weekly-schedule-cron.ts"
import { cors } from "@/middlewares/cors.middleware.ts"
import { globalErrorHandler } from "@/middlewares/error.middleware.ts"
import applicationRoutes from "@/routes/application.route.ts"
import approvalRoutes from "@/routes/approval.route.ts"
import attendanceRoutes from "@/routes/attendance.route.ts"
import auditRoutes from "@/routes/audit.route.ts"
import authRoutes from "@/routes/auth.route.ts"
import capacityCopilotRoutes from "@/routes/capacity-copilot.route.ts"
import customQueryRoutes from "@/routes/custom-query.route.ts"
import debugRoutes from "@/routes/debug.route.ts"
import employeeSalaryConfigRoutes from "@/routes/employee-salary-config.route.ts"
import employeeRoutes from "@/routes/employee.route.ts"
import employeeContractRoutes from "@/routes/employee-contract.route.ts"
import holidayRoutes from "@/routes/holiday.route.ts"
import partTimeAvailabilityRoutes from "@/routes/part-time-availability.route.ts"
import payrollRoutes from "@/routes/payroll.route.ts"
import payslipTemplateRoutes from "@/routes/payslip-template.route.ts"
import permissionRoutes from "@/routes/permission.route.ts"
import recruitmentRoutes from "@/routes/recruitment.route"
import positionRoutes from "@/routes/position.route.ts"
import profileRoutes from "@/routes/profile.route.ts"
import projectRoutes from "@/routes/project.route.ts"
import regimeCategoryRoutes from "@/routes/regime-category.route.ts"
import roleRoutes from "@/routes/role.route.ts"
import salaryComponentRoutes from "@/routes/salary-component.route.ts"
import salaryVariableRoutes from "@/routes/salary-variable.route.ts"
import scheduleRoutes from "@/routes/schedule.route.ts"
import securityRoutes from "@/routes/security.route.ts"
import shiftChangeRequestRoutes from "@/routes/shift-change-request.route.ts"
import shiftRoutes from "@/routes/shift.route.ts"
import spentTimeRoutes from "@/routes/spent-time.route.ts"
import taskRoutes from "@/routes/task.route.ts"
import taskEstimateAiRoutes from "@/routes/task-estimate-ai.route.ts"
import weeklyScheduleTemplateRoutes from "@/routes/weekly-schedule-template.route.ts"
import {
  assertNoLegacyStaticRoleReferences,
  bootstrapAdmin,
} from "@/utils/startup-assertion.util.ts"

import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express from "express"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const app = express()

// Production traffic reaches Express through the single Caddy reverse-proxy hop.
// This lets express-rate-limit derive the client IP from X-Forwarded-For safely.
app.set("trust proxy", 1)

/**
 * Middleware
 */

app.use(cookieParser())
app.use(cors)
app.use(express.json())

/**
 * Main routers
 */

// Public routes
app.get("/", async (req, res) =>
  res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" }),
)

app.get("/health", (_req, res) =>
  res.status(HttpStatusCode.OK).json({ status: "ok", service: "hrp-backend" }),
)

app.use("/api/auth", authRoutes)
app.use("/api/security", securityRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/employee-contracts", employeeContractRoutes)
app.use("/api/profile", profileRoutes)

// Attendance & Scheduling routes
app.use("/api/shifts", shiftRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/shift-change-requests", shiftChangeRequestRoutes)
app.use("/api/holidays", holidayRoutes)
app.use("/api/regime-categories", regimeCategoryRoutes)
app.use("/api/weekly-schedule-templates", weeklyScheduleTemplateRoutes)
// PT weekly availability — separate from full-time shift templates; employee declares, admin assigns.
app.use("/api/part-time-availabilities", partTimeAvailabilityRoutes)
app.use("/api/approvals", approvalRoutes)

// Recruitment routes
app.use("/api/recruitment", recruitmentRoutes)

// Payroll routes
app.use("/api/salary-components", salaryComponentRoutes)
app.use("/api/salary-variables", salaryVariableRoutes)
app.use("/api/payslip-templates", payslipTemplateRoutes)
app.use("/api/employees", employeeSalaryConfigRoutes)
app.use("/api/payrolls", payrollRoutes)

// Private routes
app.use("/api/projects", projectRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/task-estimate-ai", taskEstimateAiRoutes)
app.use("/api/capacity-copilot", capacityCopilotRoutes)
app.use("/api/permissions", permissionRoutes)
app.use("/api/roles", roleRoutes)
app.use("/api/positions", positionRoutes)
app.use("/api", auditRoutes)
app.use("/api/spent-times", spentTimeRoutes)
app.use("/api/custom-queries", customQueryRoutes)
app.use("/api/debug", debugRoutes)

// 404 handler
app.use((req, res) => {
  res.status(HttpStatusCode.NOT_FOUND).json({
    status: "error",
    message: "Route not found",
  })
})

// Global error
app.use(globalErrorHandler)

/**
 * Must connect to database successfully before start server
 */
void connectDB()
  .then(async () => {
    const skipAssert = process.env.SKIP_ADMIN_ASSERT === "true" || process.env.NODE_ENV === "test"
    assertNoLegacyStaticRoleReferences(skipAssert)

    // Ensure fail-safe administrator exists
    await bootstrapAdmin()

    app.listen(PORT, () => {
      console.log("Server start on port " + PORT)
      initCronJobs()
      initWeeklyScheduleCron()
      // Capacity Copilot refreshes weekly forecasts in the background; UI reads advisory results.
      initCapacityCopilotCron()
    })
  })
  .catch((error) => {
    console.error("Failed to start server:", error)
    process.exit(1)
  })
