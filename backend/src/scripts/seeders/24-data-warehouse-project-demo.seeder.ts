import {
  DEFAULT_PROJECT_TASK_STATUSES,
  PROJECT_MEMBER_WORK_MODE,
  PROJECT_ROLE,
  PROJECT_STATUS,
  SPENT_TIME_ACTIVITY,
  SPENT_TIME_STATUS,
  SPENT_TIME_WORK_TIME_TYPE,
  TASK_CREATION_POLICY,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TRACKER,
} from "@/configs/entities/project.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

const PROJECT_NAME = process.env.SEED_PROJECT_NAME ?? "Data Warehouse Integration"
const DEMO_TASK_PREFIX = "[DWH-DEMO]"
const PROJECT_START_DATE = new Date("2026-05-04T00:00:00.000Z")
const PROJECT_END_DATE = new Date("2026-08-02T00:00:00.000Z")

const roleSeeds = [
  {
    code: PROJECT_ROLE.LEADER,
    name: "Trưởng nhóm",
    allowedTaskTrackers: [
      TASK_TRACKER.FEATURE,
      TASK_TRACKER.BUG,
      TASK_TRACKER.SUPPORT,
      TASK_TRACKER.TASK,
      TASK_TRACKER.MEETING,
      TASK_TRACKER.TEST,
      TASK_TRACKER.SUBTASK,
      TASK_TRACKER.MANAGEMENT,
    ],
  },
  {
    code: PROJECT_ROLE.DEVELOPER,
    name: "Lập trình viên",
    allowedTaskTrackers: [
      TASK_TRACKER.FEATURE,
      TASK_TRACKER.TASK,
      TASK_TRACKER.SUBTASK,
      TASK_TRACKER.SUPPORT,
    ],
  },
  {
    code: PROJECT_ROLE.TESTER,
    name: "Kiểm thử viên",
    allowedTaskTrackers: [TASK_TRACKER.BUG, TASK_TRACKER.TEST, TASK_TRACKER.SUBTASK],
  },
] as const

const trackerSeeds = [
  { code: TASK_TRACKER.FEATURE, name: "Feature" },
  { code: TASK_TRACKER.TASK, name: "Task" },
  { code: TASK_TRACKER.TEST, name: "Test" },
  { code: TASK_TRACKER.SUPPORT, name: "Support" },
] as const

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

async function pickPeople() {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  })

  const admin = employees.find((employee) => employee.username === "admin")
  if (!admin) {
    throw new Error("Không tìm thấy admin user để seed project demo.")
  }

  const candidates = employees.filter((employee) => employee.id !== admin.id)
  const developer =
    candidates.find((employee) => employee.position === "Developer") ?? candidates[0]
  const tester =
    candidates.find((employee) => employee.position === "Tester") ?? candidates[1] ?? developer

  if (!developer || !tester) {
    throw new Error("Cần thêm ít nhất 2 nhân viên ngoài admin để seed project demo.")
  }

  return { admin, developer, tester }
}

async function ensureProject(adminId: string) {
  return prisma.project.upsert({
    where: { name: PROJECT_NAME },
    update: {
      description: "Set up Snowflake and ETL pipelines",
      techStack: ["Python", "Snowflake", "dbt", "Airflow"],
      status: PROJECT_STATUS.COMPLETED,
      taskCreationPolicy: TASK_CREATION_POLICY.ALL_MEMBERS,
      startDate: PROJECT_START_DATE,
      actualEndDate: PROJECT_END_DATE,
      expectedEndDate: PROJECT_END_DATE,
      teamLeaderId: adminId,
      allowedTaskTrackers: trackerSeeds.map((tracker) => tracker.code),
    },
    create: {
      name: PROJECT_NAME,
      description: "Set up Snowflake and ETL pipelines",
      techStack: ["Python", "Snowflake", "dbt", "Airflow"],
      status: PROJECT_STATUS.COMPLETED,
      taskCreationPolicy: TASK_CREATION_POLICY.ALL_MEMBERS,
      startDate: PROJECT_START_DATE,
      actualEndDate: PROJECT_END_DATE,
      expectedEndDate: PROJECT_END_DATE,
      teamLeaderId: adminId,
      createdById: adminId,
      allowedTaskTrackers: trackerSeeds.map((tracker) => tracker.code),
    },
  })
}

async function ensureStatuses(projectId: string) {
  const statuses = await Promise.all(
    DEFAULT_PROJECT_TASK_STATUSES.map((status) =>
      prisma.projectTaskStatus.upsert({
        where: {
          projectId_name: {
            projectId,
            name: status.name,
          },
        },
        update: {
          color: status.color,
          order: status.order,
          isDefault: status.isDefault,
          isCompleted: status.isCompleted,
        },
        create: {
          projectId,
          name: status.name,
          color: status.color,
          order: status.order,
          isDefault: status.isDefault,
          isCompleted: status.isCompleted,
        },
      }),
    ),
  )

  return new Map(statuses.map((status) => [status.name, status.id]))
}

async function ensureRoles(projectId: string) {
  const roles = await Promise.all(
    roleSeeds.map((role) =>
      prisma.projectRole.upsert({
        where: {
          projectId_code: {
            projectId,
            code: role.code,
          },
        },
        update: {
          name: role.name,
          allowedTaskTrackers: [...role.allowedTaskTrackers],
        },
        create: {
          projectId,
          code: role.code,
          name: role.name,
          allowedTaskTrackers: [...role.allowedTaskTrackers],
        },
      }),
    ),
  )

  return new Map(roles.map((role) => [role.code, role.id]))
}

async function ensureTrackers(projectId: string) {
  await Promise.all(
    trackerSeeds.map((tracker) =>
      prisma.projectTracker.upsert({
        where: {
          projectId_code: {
            projectId,
            code: tracker.code,
          },
        },
        update: {
          name: tracker.name,
          isActive: true,
        },
        create: {
          projectId,
          code: tracker.code,
          name: tracker.name,
          isActive: true,
        },
      }),
    ),
  )
}

async function ensureMembers(
  projectId: string,
  people: Awaited<ReturnType<typeof pickPeople>>,
  roleByCode: Map<string, string>,
) {
  await Promise.all([
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId, employeeId: people.admin.id } },
      update: {
        roleId: roleByCode.get(PROJECT_ROLE.LEADER),
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        removedAt: null,
      },
      create: {
        projectId,
        employeeId: people.admin.id,
        roleId: roleByCode.get(PROJECT_ROLE.LEADER),
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
      },
    }),
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId, employeeId: people.developer.id } },
      update: {
        roleId: roleByCode.get(PROJECT_ROLE.DEVELOPER),
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        removedAt: null,
      },
      create: {
        projectId,
        employeeId: people.developer.id,
        roleId: roleByCode.get(PROJECT_ROLE.DEVELOPER),
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
      },
    }),
    prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId, employeeId: people.tester.id } },
      update: {
        roleId: roleByCode.get(PROJECT_ROLE.TESTER),
        hourlyRate: 50000,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
        removedAt: null,
      },
      create: {
        projectId,
        employeeId: people.tester.id,
        roleId: roleByCode.get(PROJECT_ROLE.TESTER),
        hourlyRate: 50000,
        workMode: PROJECT_MEMBER_WORK_MODE.REMOTE,
      },
    }),
  ])
}

async function seedTasks(
  projectId: string,
  people: Awaited<ReturnType<typeof pickPeople>>,
  statusByName: Map<string, string>,
) {
  await prisma.task.deleteMany({
    where: {
      projectId,
      title: { startsWith: DEMO_TASK_PREFIX },
    },
  })

  const doneStatusId = statusByName.get("Done")
  const inProgressStatusId = statusByName.get("In Progress")
  const reviewStatusId = statusByName.get("In Review")
  const todoStatusId = statusByName.get("To Do")

  const ingestionFeature = await prisma.task.create({
    data: {
      projectId,
      title: `${DEMO_TASK_PREFIX} Feature: Xây dựng pipeline ingest dữ liệu`,
      description: "Thiết kế luồng ingest dữ liệu từ hệ thống giao dịch vào staging.",
      tracker: TASK_TRACKER.FEATURE,
      priority: TASK_PRIORITY.HIGH,
      status: TASK_STATUS.DONE,
      statusId: doneStatusId,
      assigneeId: people.developer.id,
      createdById: people.admin.id,
      startDate: PROJECT_START_DATE,
      dueDate: addDays(PROJECT_START_DATE, 18),
      completedAt: addDays(PROJECT_START_DATE, 17),
      estimatedTime: 40,
      progress: 100,
    },
  })

  const transformFeature = await prisma.task.create({
    data: {
      projectId,
      title: `${DEMO_TASK_PREFIX} Feature: Chuẩn hóa mô hình dữ liệu dbt`,
      description: "Xây dựng mart doanh thu, nhân sự và vận hành trên Snowflake.",
      tracker: TASK_TRACKER.FEATURE,
      priority: TASK_PRIORITY.HIGH,
      status: TASK_STATUS.DONE,
      statusId: doneStatusId,
      assigneeId: people.developer.id,
      createdById: people.admin.id,
      startDate: addDays(PROJECT_START_DATE, 19),
      dueDate: addDays(PROJECT_START_DATE, 45),
      completedAt: addDays(PROJECT_START_DATE, 44),
      estimatedTime: 56,
      progress: 100,
    },
  })

  await prisma.task.createMany({
    data: [
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Task: Cấu hình Airflow DAG hằng ngày`,
        description: "Chạy incremental load và gửi alert khi pipeline lỗi.",
        tracker: TASK_TRACKER.TASK,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.DONE,
        statusId: doneStatusId,
        assigneeId: people.developer.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 1),
        dueDate: addDays(PROJECT_START_DATE, 7),
        completedAt: addDays(PROJECT_START_DATE, 6),
        estimatedTime: 16,
        progress: 100,
        parentTaskId: ingestionFeature.id,
      },
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Test: Kiểm thử quality rule`,
        description: "Kiểm tra null, duplicate key và schema drift.",
        tracker: TASK_TRACKER.TEST,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.DONE,
        statusId: doneStatusId,
        assigneeId: people.tester.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 8),
        dueDate: addDays(PROJECT_START_DATE, 14),
        completedAt: addDays(PROJECT_START_DATE, 13),
        estimatedTime: 14,
        progress: 100,
        parentTaskId: ingestionFeature.id,
      },
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Task: Build mart doanh thu`,
        description: "Tạo fact revenue và dimension customer phục vụ dashboard.",
        tracker: TASK_TRACKER.TASK,
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.DONE,
        statusId: doneStatusId,
        assigneeId: people.developer.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 20),
        dueDate: addDays(PROJECT_START_DATE, 34),
        completedAt: addDays(PROJECT_START_DATE, 33),
        estimatedTime: 24,
        progress: 100,
        parentTaskId: transformFeature.id,
      },
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Test: Đối soát số liệu dashboard`,
        description: "So sánh số liệu warehouse với report legacy.",
        tracker: TASK_TRACKER.TEST,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.IN_REVIEW,
        statusId: reviewStatusId,
        assigneeId: people.tester.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 35),
        dueDate: addDays(PROJECT_START_DATE, 49),
        estimatedTime: 20,
        progress: 90,
        parentTaskId: transformFeature.id,
      },
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Support: Viết runbook bàn giao vận hành`,
        description: "Tài liệu xử lý sự cố pipeline và checklist deploy.",
        tracker: TASK_TRACKER.SUPPORT,
        priority: TASK_PRIORITY.LOW,
        status: TASK_STATUS.IN_PROGRESS,
        statusId: inProgressStatusId,
        assigneeId: people.admin.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 50),
        dueDate: addDays(PROJECT_START_DATE, 60),
        estimatedTime: 10,
        progress: 70,
      },
      {
        projectId,
        title: `${DEMO_TASK_PREFIX} Task: Archive bảng staging cũ`,
        description: "Dọn staging table sau khi nghiệm thu production.",
        tracker: TASK_TRACKER.TASK,
        priority: TASK_PRIORITY.LOW,
        status: TASK_STATUS.TODO,
        statusId: todoStatusId,
        assigneeId: people.developer.id,
        createdById: people.admin.id,
        startDate: addDays(PROJECT_START_DATE, 61),
        dueDate: addDays(PROJECT_START_DATE, 65),
        estimatedTime: 6,
        progress: 0,
      },
    ],
  })

  const approvedTasks = await prisma.task.findMany({
    where: {
      projectId,
      title: { startsWith: DEMO_TASK_PREFIX },
      status: TASK_STATUS.DONE,
    },
    select: { id: true, assigneeId: true },
  })

  await prisma.spentTime.createMany({
    data: approvedTasks
      .filter((task) => task.assigneeId)
      .map((task, index) => ({
        taskId: task.id,
        employeeId: task.assigneeId as string,
        date: addDays(PROJECT_START_DATE, index * 5),
        hours: index % 2 === 0 ? 8 : 6,
        comment: "Demo spent time cho dự án Data Warehouse.",
        activity: index % 2 === 0 ? SPENT_TIME_ACTIVITY.DEVELOP : SPENT_TIME_ACTIVITY.TEST,
        workTimeType: SPENT_TIME_WORK_TIME_TYPE.WORKING_DAY,
        status: SPENT_TIME_STATUS.APPROVED,
        approvedById: people.admin.id,
        approvedAt: addDays(PROJECT_START_DATE, index * 5 + 1),
      })),
  })
}

export class DataWarehouseProjectDemoSeeder implements ISeeder {
  readonly name = "DataWarehouseProjectDemo"
  readonly order = 18.3

  async run(_context: SeedContext): Promise<Partial<SeedContext>> {
    await seedDataWarehouseProjectDemo()
    return {}
  }
}

async function seedDataWarehouseProjectDemo() {
  console.log(`Seeding demo data for project: ${PROJECT_NAME}`)

  const people = await pickPeople()
  const project = await ensureProject(people.admin.id)
  const statusByName = await ensureStatuses(project.id)
  const roleByCode = await ensureRoles(project.id)
  await ensureTrackers(project.id)
  await ensureMembers(project.id, people, roleByCode)
  await seedTasks(project.id, people, statusByName)

  const [memberCount, taskCount, spentTimeCount] = await Promise.all([
    prisma.projectMember.count({ where: { projectId: project.id, removedAt: null } }),
    prisma.task.count({ where: { projectId: project.id } }),
    prisma.spentTime.count({ where: { task: { projectId: project.id } } }),
  ])

  console.log(
    `Seeded ${PROJECT_NAME}: ${memberCount} members, ${taskCount} tasks, ${spentTimeCount} spent-time rows.`,
  )
}

registry.register(new DataWarehouseProjectDemoSeeder())

if (import.meta.main) {
  try {
    await seedDataWarehouseProjectDemo()
  } finally {
    await prisma.$disconnect()
  }
}
