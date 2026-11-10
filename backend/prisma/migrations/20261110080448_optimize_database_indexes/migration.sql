/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Application_assignedToId_idx";

-- DropIndex
DROP INDEX "ApplicationNote_applicationId_idx";

-- DropIndex
DROP INDEX "Employee_deletedAt_idx";

-- DropIndex
DROP INDEX "Employee_email_idx";

-- DropIndex
DROP INDEX "Employee_username_idx";

-- DropIndex
DROP INDEX "InterviewRound_applicationId_idx";

-- DropIndex
DROP INDEX "Payroll_status_idx";

-- DropIndex
DROP INDEX "RecruitmentApplication_requisitionId_idx";

-- DropIndex
DROP INDEX "RecruitmentApplication_status_idx";

-- DropIndex
DROP INDEX "RecruitmentOffer_applicationId_idx";

-- DropIndex
DROP INDEX "SpentTime_employeeId_idx";

-- DropIndex
DROP INDEX "SpentTime_taskId_idx";

-- DropIndex
DROP INDEX "authorization_audit_logs_action_idx";

-- DropIndex
DROP INDEX "authorization_audit_logs_createdAt_idx";

-- CreateIndex
CREATE INDEX "Application_employeeId_createdAt_idx" ON "Application"("employeeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Application_status_createdAt_idx" ON "Application"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Application_partnerApprovedById_idx" ON "Application"("partnerApprovedById");

-- CreateIndex
CREATE INDEX "Application_assignedToId_status_createdAt_idx" ON "Application"("assignedToId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApplicationForgotCardDetail_employeeShiftId_idx" ON "ApplicationForgotCardDetail"("employeeShiftId");

-- CreateIndex
CREATE INDEX "ApplicationNote_applicationId_createdAt_idx" ON "ApplicationNote"("applicationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApplicationWorkFromHomeDetail_employeeShiftId_idx" ON "ApplicationWorkFromHomeDetail"("employeeShiftId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_status_idx" ON "AttendanceRecord"("date" DESC, "status");

-- CreateIndex
CREATE INDEX "BackgroundCheck_checkedById_idx" ON "BackgroundCheck"("checkedById");

-- CreateIndex
CREATE INDEX "CustomQuery_projectId_idx" ON "CustomQuery"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_deletedAt_createdAt_idx" ON "Employee"("deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Employee_deletedAt_status_workScheduleType_idx" ON "Employee"("deletedAt", "status", "workScheduleType");

-- CreateIndex
CREATE INDEX "Employee_positionId_idx" ON "Employee"("positionId");

-- CreateIndex
CREATE INDEX "Employee_personalEmployeeId_idx" ON "Employee"("personalEmployeeId");

-- CreateIndex
CREATE INDEX "EmployeeContract_createdById_idx" ON "EmployeeContract"("createdById");

-- CreateIndex
CREATE INDEX "EmployeeContract_updatedById_idx" ON "EmployeeContract"("updatedById");

-- CreateIndex
CREATE INDEX "EmployeeContract_renewedFromId_idx" ON "EmployeeContract"("renewedFromId");

-- CreateIndex
CREATE INDEX "EmployeeShift_employeeId_assignedDate_isOverride_idx" ON "EmployeeShift"("employeeId", "assignedDate", "isOverride");

-- CreateIndex
CREATE INDEX "EmployeeShift_assignedDate_status_idx" ON "EmployeeShift"("assignedDate", "status");

-- CreateIndex
CREATE INDEX "InterviewRound_applicationId_roundNumber_idx" ON "InterviewRound"("applicationId", "roundNumber" ASC);

-- CreateIndex
CREATE INDEX "JobRequisition_approvedById_idx" ON "JobRequisition"("approvedById");

-- CreateIndex
CREATE INDEX "Payroll_status_periodYear_periodMonth_idx" ON "Payroll"("status", "periodYear" DESC, "periodMonth" DESC);

-- CreateIndex
CREATE INDEX "Payslip_employeeId_createdAt_idx" ON "Payslip"("employeeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ProjectMember_roleId_idx" ON "ProjectMember"("roleId");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_requisitionId_createdAt_idx" ON "RecruitmentApplication"("requisitionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecruitmentApplication_status_createdAt_idx" ON "RecruitmentApplication"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecruitmentOffer_applicationId_createdAt_idx" ON "RecruitmentOffer"("applicationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecruitmentOffer_createdById_idx" ON "RecruitmentOffer"("createdById");

-- CreateIndex
CREATE INDEX "SpentTime_taskId_status_idx" ON "SpentTime"("taskId", "status");

-- CreateIndex
CREATE INDEX "SpentTime_employeeId_date_idx" ON "SpentTime"("employeeId", "date" DESC);

-- CreateIndex
CREATE INDEX "SpentTime_employeeId_status_date_idx" ON "SpentTime"("employeeId", "status", "date" DESC);

-- CreateIndex
CREATE INDEX "SpentTime_approvedById_idx" ON "SpentTime"("approvedById");

-- CreateIndex
CREATE INDEX "Task_projectId_createdAt_idx" ON "Task"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Task_statusId_idx" ON "Task"("statusId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_dueDate_idx" ON "Task"("assigneeId", "dueDate" ASC);

-- CreateIndex
CREATE INDEX "Task_assigneeId_createdAt_idx" ON "Task"("assigneeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "authorization_audit_logs_createdAt_idx" ON "authorization_audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "authorization_audit_logs_action_createdAt_idx" ON "authorization_audit_logs"("action", "createdAt" DESC);
