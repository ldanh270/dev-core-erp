/**
 * Incremental seed helpers — extracted from former seed-demo.ts.
 * Used by `bun run seed -- --incremental` when DB already has admin/employees.
 */
import { prisma } from "@/libs/database.ts"
import { createEmptyContext, registry } from "./seeders/index.ts"
import type { SeedContext } from "./seeders/seed-context.ts"

type OptionalPrismaCounters = typeof prisma & {
  employeeContract?: { count: () => Promise<number> }
  recruitmentApplication?: { count: () => Promise<number> }
}

const prismaCounters = prisma as OptionalPrismaCounters

/** Load FK ids and lookup maps from DB so downstream seeders can reference existing rows. */
export async function hydrateSeedContext(context: SeedContext): Promise<SeedContext> {
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  if (!admin) {
    throw new Error("Missing admin account. Run: bun run seed:admin")
  }

  const employees = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const schedules = await prisma.shiftSchedule.findMany()
  const employeeShifts = await prisma.employeeShift.findMany({ select: { id: true } })
  const salaryComponents = await prisma.salaryComponent.findMany({ select: { id: true } })
  const payslipTemplates = await prisma.payslipTemplate.findMany({ select: { id: true } })
  const salaryConfigs = await prisma.employeeSalaryConfig.findMany()
  const payrolls = await prisma.payroll.findMany({ select: { id: true } })
  const projects = await prisma.project.findMany({ select: { id: true } })

  return {
    ...context,
    adminId: admin.id,
    employees,
    workingShiftIds: (await prisma.workingShift.findMany({ select: { id: true } })).map((s) => s.id),
    shiftScheduleMap: Object.fromEntries(schedules.map((schedule) => [schedule.employeeId, schedule.id])),
    employeeShiftIds: employeeShifts.map((shift) => shift.id),
    salaryComponentIds: salaryComponents.map((item) => item.id),
    payslipTemplateIds: payslipTemplates.map((item) => item.id),
    salaryConfigMap: Object.fromEntries(salaryConfigs.map((config) => [config.employeeId, config.id])),
    payrollIds: payrolls.map((item) => item.id),
    projectIds: projects.map((item) => item.id),
  }
}

/** Per-seeder row-count guard — safe to re-run incremental seed without duplicating data. */
async function shouldSkipSeederInternal(name: string): Promise<boolean> {
  let count = 0

  switch (name) {
    case "Positions":
      count = await prisma.position.count()
      return count > 0

    case "Employees":
      count = await prisma.employee.count()
      return count > 0

    case "RBAC":
      count = await prisma.employeeRole.count()
      return count > 0

    case "WorkingShifts":
      count = await prisma.workingShift.count()
      return count > 0

    case "SalaryComponents":
      count = await prisma.salaryComponent.count()
      return count > 0

    case "SalaryVariables":
      count = await prisma.salaryVariable.count()
      return count > 0

    case "PayslipTemplates":
      count = await prisma.payslipTemplate.count()
      return count > 0

    case "PayrollSettings":
      count = await prisma.payrollSettings.count()
      return count > 0

    case "HolidayCalendars":
      count = await prisma.holidayCalendar.count()
      return count > 0

    case "ProjectTaskStatuses":
      count = await prisma.projectTaskStatus.count()
      return count > 0

    case "ShiftSchedules": {
      const shiftScheduleCount = await prisma.shiftSchedule.count()
      const employeeCount = await prisma.employee.count()
      return shiftScheduleCount >= employeeCount
    }

    case "EmployeeShifts":
      count = await prisma.employeeShift.count()
      return count > 0

    case "AttendanceRecords":
      count = await prisma.attendanceRecord.count()
      return count > 0

    case "Projects":
      count = await prisma.project.count()
      return count > 0

    case "ProjectMembers":
      count = await prisma.projectMember.count()
      return count > 0

    case "SalaryConfigs":
      count = await prisma.employeeSalaryConfig.count()
      return count > 0

    case "EmployeeContracts":
      if (!prismaCounters.employeeContract) return true
      count = await prismaCounters.employeeContract.count()
      return count > 0

    case "Applications":
      count = await prisma.application.count()
      return count > 0

    case "Tasks":
      count = await prisma.task.count()
      return count > 0

    case "Payrolls":
      count = await prisma.payroll.count()
      return count > 0

    case "Payslips":
      count = await prisma.payslip.count()
      return count > 0

    case "ActivityLogs":
      count = await prisma.activityLog.count()
      return count > 0

    case "SpentTimes":
      count = await prisma.spentTime.count()
      return count > 0

    case "Recruitment":
      if (!prismaCounters.recruitmentApplication) return true
      count = await prismaCounters.recruitmentApplication.count()
      return count > 0

    default:
      return false
  }
}

/** Wraps skip evaluation — on DB error, fall through and attempt seed rather than abort silently. */
async function shouldSkipSeeder(name: string): Promise<boolean> {
  try {
    return await shouldSkipSeederInternal(name)
  } catch (error: unknown) {
    console.error(`Failed to evaluate skip state for ${name}:`, error)
    return true
  }
}

async function safeCount(label: string, counter: () => Promise<number>): Promise<number | string> {
  try {
    return await counter()
  } catch {
    return `${label}: unavailable`
  }
}

/**
 * Incremental seed — no DB wipe; skips seeders whose target tables already have rows.
 * Used when local DB already has admin/employees and only needs demo data filled in.
 */
export async function runIncrementalSeed(): Promise<void> {
  console.log("Seeding data incrementally (without clearing database)...")

  let context = await hydrateSeedContext(createEmptyContext())
  const seeders = registry.getSorted()

  for (const seeder of seeders) {
    if (await shouldSkipSeeder(seeder.name)) {
      console.log(`[skip] ${seeder.name} — already has data`)
      context = await hydrateSeedContext(context)
      continue
    }

    console.log(`\n[→] Running: ${seeder.name}`)
    const result = await seeder.run(context)
    context = await hydrateSeedContext({ ...context, ...result })
    console.log(`[✓] Done: ${seeder.name}`)
  }

  const summary = {
    employees: await safeCount("employees", () => prisma.employee.count()),
    employeeShifts: await safeCount("employeeShifts", () => prisma.employeeShift.count()),
    attendanceRecords: await safeCount("attendanceRecords", () => prisma.attendanceRecord.count()),
    applications: await safeCount("applications", () => prisma.application.count()),
    projects: await safeCount("projects", () => prisma.project.count()),
    tasks: await safeCount("tasks", () => prisma.task.count()),
    spentTimes: await safeCount("spentTimes", () => prisma.spentTime.count()),
    recruitmentApplications: await safeCount("recruitmentApplications", () =>
      prismaCounters.recruitmentApplication
        ? prismaCounters.recruitmentApplication.count()
        : Promise.reject(new Error("recruitmentApplication counter unavailable")),
    ),
  }

  console.log("\nIncremental seed complete:", summary)
}
