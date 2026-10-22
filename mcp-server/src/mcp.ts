import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { registerApplicationTools } from "./tools/application.tools.js"
import { registerApprovalTools } from "./tools/approval.tools.js"
import { registerAttendanceTools } from "./tools/attendance.tools.js"
import { registerAuthTools } from "./tools/auth.tools.js"
import { registerEmployeeTools } from "./tools/employee.tools.js"
import { registerHolidayTools } from "./tools/holiday.tools.js"
import { registerPayrollTools } from "./tools/payroll.tools.js"
import { registerProfileTools } from "./tools/profile.tools.js"
import { registerProjectTools } from "./tools/project.tools.js"
import { registerScheduleTools } from "./tools/schedule.tools.js"
import { registerShiftChangeRequestTools } from "./tools/shift-change-request.tools.js"
import { registerShiftTools } from "./tools/shift.tools.js"
import { registerWeeklyTemplateTools } from "./tools/weekly-template.tools.js"
import { registerRegimeCategoryTools } from "./tools/regime-category.tools.js"
import { registerWorkforceTools } from "./tools/workforce.tools.js"

// Initialize MCP Server
export const mcpServer = new McpServer({
  name: "DevCore-MCP-Server",
  version: "1.0.0",
})

// Function to register all tools
export const registerTools = () => {
  registerAuthTools()
  registerAttendanceTools()
  registerProjectTools()
  registerPayrollTools()
  registerApplicationTools()
  registerEmployeeTools()
  registerProfileTools()
  registerShiftTools()
  registerScheduleTools()
  registerWeeklyTemplateTools()
  registerHolidayTools()
  registerShiftChangeRequestTools()
  registerApprovalTools()
  registerRegimeCategoryTools()
  registerWorkforceTools()
}
