-- Database Hardening:
-- Soft delete column on EmployeeContract + partial unique active contract invariant
-- Partial unique indexes (WHERE "deletedAt" IS NULL) on soft-deletable models
-- SQL CHECK constraints on WorkingShift and EmployeeLeaveBalance

-- EmployeeContract soft delete support
ALTER TABLE "EmployeeContract"
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "EmployeeContract_deletedAt_idx"
  ON "EmployeeContract"("deletedAt");

DROP INDEX IF EXISTS "EmployeeContract_contractNumber_key";

CREATE UNIQUE INDEX "EmployeeContract_contractNumber_active_key"
  ON "EmployeeContract"("contractNumber")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "EmployeeContract_one_active_per_employee_key"
  ON "EmployeeContract"("employeeId")
  WHERE "deletedAt" IS NULL AND "status" IN ('active', 'pending_signature');

-- Employee partial unique indexes (allow re-creating after soft delete)
DROP INDEX IF EXISTS "Employee_username_key";
DROP INDEX IF EXISTS "Employee_email_key";

CREATE INDEX IF NOT EXISTS "Employee_username_idx" ON "Employee"("username");
CREATE INDEX IF NOT EXISTS "Employee_email_idx" ON "Employee"("email");

CREATE UNIQUE INDEX "Employee_username_active_key"
  ON "Employee"("username")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "Employee_email_active_key"
  ON "Employee"("email")
  WHERE "deletedAt" IS NULL;

-- AppRole partial unique index
DROP INDEX IF EXISTS "roles_name_key";

CREATE UNIQUE INDEX "roles_name_active_key"
  ON "roles"("name")
  WHERE "deletedAt" IS NULL;

-- Permission partial unique index
DROP INDEX IF EXISTS "permissions_code_key";

CREATE INDEX IF NOT EXISTS "permissions_code_idx" ON "permissions"("code");

CREATE UNIQUE INDEX "permissions_code_active_key"
  ON "permissions"("code")
  WHERE "deletedAt" IS NULL;

-- Position partial unique indexes
DROP INDEX IF EXISTS "positions_name_key";
DROP INDEX IF EXISTS "positions_code_key";

CREATE INDEX IF NOT EXISTS "positions_name_idx" ON "positions"("name");
CREATE INDEX IF NOT EXISTS "positions_code_idx" ON "positions"("code");
CREATE INDEX IF NOT EXISTS "positions_deletedAt_idx" ON "positions"("deletedAt");

CREATE UNIQUE INDEX "positions_name_active_key"
  ON "positions"("name")
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX "positions_code_active_key"
  ON "positions"("code")
  WHERE "deletedAt" IS NULL;

-- WorkingShift domain integrity checks (mirrors shift.schema.ts)
ALTER TABLE "WorkingShift"
  ADD CONSTRAINT "WorkingShift_startTime_range_check"
    CHECK ("startTime" >= 0 AND "startTime" < 1440),
  ADD CONSTRAINT "WorkingShift_endTime_range_check"
    CHECK ("endTime" >= 0 AND "endTime" <= 1440),
  ADD CONSTRAINT "WorkingShift_break_window_check"
    CHECK (
      ("breakStartTime" IS NULL AND "breakEndTime" IS NULL)
      OR (
        "breakStartTime" IS NOT NULL
        AND "breakEndTime" IS NOT NULL
        AND "startTime" < "breakStartTime"
        AND "breakStartTime" < "breakEndTime"
        AND "breakEndTime" < "endTime"
      )
    ),
  ADD CONSTRAINT "WorkingShift_gracePeriodMinutes_check"
    CHECK ("gracePeriodMinutes" >= 0 AND "gracePeriodMinutes" <= 120),
  ADD CONSTRAINT "WorkingShift_gpsRadiusMeters_check"
    CHECK ("gpsRadiusMeters" > 0);

-- EmployeeLeaveBalance domain integrity checks
ALTER TABLE "EmployeeLeaveBalance"
  ADD CONSTRAINT "EmployeeLeaveBalance_year_check"
    CHECK ("year" >= 2000 AND "year" <= 2100),
  ADD CONSTRAINT "EmployeeLeaveBalance_days_bounds_check"
    CHECK ("totalDays" >= 0 AND "usedDays" >= 0 AND "usedDays" <= "totalDays");

