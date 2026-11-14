import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

import { Prisma } from "@prisma/client"

export class RBACSeeder implements ISeeder {
  readonly name = "RBAC"
  readonly order = 2 // Runs right after EmployeesSeeder (order = 1) to map employees to dynamic roles

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    console.info("  Seeding AppRoles and Permissions...")

    // Define permissions list
    const permissionsData = [
      // Employee
      {
        name: "Read Employee",
        code: "employee.read",
        module: "employee",
        description: "View employee profiles",
      },
      {
        name: "Create Employee",
        code: "employee.create",
        module: "employee",
        description: "Create new employee profile",
      },
      {
        name: "Update Employee",
        code: "employee.update",
        module: "employee",
        description: "Edit existing employee profile",
      },
      {
        name: "Delete Employee",
        code: "employee.delete",
        module: "employee",
        description: "Soft delete employee profile",
      },

      // Attendance
      {
        name: "Read Attendance",
        code: "attendance.read",
        module: "attendance",
        description: "View attendance logs",
      },
      {
        name: "Create Attendance",
        code: "attendance.create",
        module: "attendance",
        description: "Log check-in/out",
      },
      {
        name: "Update Attendance",
        code: "attendance.update",
        module: "attendance",
        description: "Modify attendance logs",
      },
      {
        name: "Delete Attendance",
        code: "attendance.delete",
        module: "attendance",
        description: "Delete attendance logs",
      },
      {
        name: "Export Attendance",
        code: "attendance.export",
        module: "attendance",
        description: "Export attendance report",
      },
      {
        name: "Read Weekly Schedule",
        code: "attendance.weekly_schedule.read",
        module: "attendance",
        description: "View workforce planning templates",
      },

      // Applications
      {
        name: "Read Application",
        code: "application.read",
        module: "application",
        description: "Read leave/overtime applications",
      },
      {
        name: "Approve Application",
        code: "application.approve",
        module: "application",
        description: "Approve or reject applications",
      },

      // Security
      {
        name: "Read Security",
        code: "security.read",
        module: "security",
        description: "Read security logs and dashboard",
      },
      {
        name: "Update Security",
        code: "security.update",
        module: "security",
        description: "Unlock locked user accounts",
      },

      // Payroll
      {
        name: "Read Payroll",
        code: "payroll.read",
        module: "payroll",
        description: "View salary/payroll details",
      },
      {
        name: "Create Payroll",
        code: "payroll.create",
        module: "payroll",
        description: "Draft payrolls",
      },
      {
        name: "Update Payroll",
        code: "payroll.update",
        module: "payroll",
        description: "Edit payroll details",
      },
      {
        name: "Delete Payroll",
        code: "payroll.delete",
        module: "payroll",
        description: "Delete draft payrolls",
      },
      {
        name: "Approve Payroll",
        code: "payroll.approve",
        module: "payroll",
        description: "Approve/Reject payroll calculations",
      },
      {
        name: "Read Salary Config",
        code: "payroll.salary_config.read",
        module: "payroll",
        description: "View employee salary settings and history",
      },

      // Project
      {
        name: "Read Project",
        code: "project.read",
        module: "project",
        description: "View project details",
      },
      {
        name: "Create Project",
        code: "project.create",
        module: "project",
        description: "Create new project",
      },
      {
        name: "Update Project",
        code: "project.update",
        module: "project",
        description: "Modify project details",
      },
      {
        name: "Delete Project",
        code: "project.delete",
        module: "project",
        description: "Delete project",
      },

      // Task
      { name: "Read Task", code: "task.read", module: "task", description: "View task list" },
      {
        name: "Create Task",
        code: "task.create",
        module: "task",
        description: "Create project tasks",
      },
      {
        name: "Update Task",
        code: "task.update",
        module: "task",
        description: "Modify project tasks or track progress",
      },
      {
        name: "Delete Task",
        code: "task.delete",
        module: "task",
        description: "Delete project tasks",
      },

      // RBAC
      {
        name: "Read RBAC",
        code: "role.read",
        module: "role",
        description: "View roles and permissions",
      },
      {
        name: "Create RBAC",
        code: "role.create",
        module: "role",
        description: "Create custom roles",
      },
      {
        name: "Update RBAC",
        code: "role.update",
        module: "role",
        description: "Modify role-permission links",
      },
      {
        name: "Delete RBAC",
        code: "role.delete",
        module: "role",
        description: "Delete custom roles",
      },
      {
        name: "Read Audit Logs",
        code: "audit.read",
        module: "audit",
        description: "View authorization audit logs",
      },
      {
        name: "Read Permissions",
        code: "permission.read",
        module: "role",
        description: "View permission matrix",
      },
      {
        name: "Create Permission",
        code: "permission.create",
        module: "role",
        description: "Create new permission in system",
      },
      {
        name: "Update Permission",
        code: "permission.update",
        module: "role",
        description: "Modify permission definitions",
      },
      {
        name: "Delete Permission",
        code: "permission.delete",
        module: "role",
        description: "Delete custom permissions",
      },
      {
        name: "Read Role Permissions",
        code: "role.permission.read",
        module: "role",
        description: "View role permissions mapping",
      },
      {
        name: "Update Role Permissions",
        code: "role.permission.update",
        module: "role",
        description: "Assign permissions to roles",
      },
      {
        name: "Read Employee Roles",
        code: "employee.role.read",
        module: "role",
        description: "View employee roles mapping",
      },
      {
        name: "Update Employee Roles",
        code: "employee.role.update",
        module: "role",
        description: "Assign roles to employees",
      },
      // Recruitment
      {
        name: "Read Recruitment",
        code: "recruitment.read",
        module: "recruitment",
        description: "View recruitment requisitions and candidate pipeline",
      },
      {
        name: "Create Recruitment",
        code: "recruitment.create",
        module: "recruitment",
        description: "Create recruitment requisitions and records",
      },
      {
        name: "Update Recruitment",
        code: "recruitment.update",
        module: "recruitment",
        description: "Update recruitment requisitions and pipeline records",
      },
      {
        name: "Delete Recruitment",
        code: "recruitment.delete",
        module: "recruitment",
        description: "Delete recruitment records",
      },
      {
        name: "Approve Recruitment",
        code: "recruitment.approve",
        module: "recruitment",
        description: "Approve recruitment actions other than requisitions",
      },
      {
        name: "Approve Recruitment Requisition",
        code: "recruitment.requisition.approve",
        module: "recruitment",
        description: "Approve or reject assigned job requisitions",
      },
      {
        name: "Read Recruitment Job Descriptions",
        code: "recruitment.jd.read",
        module: "recruitment",
        description: "View recruitment job descriptions and their postings",
      },
      {
        name: "Create Recruitment Job Descriptions",
        code: "recruitment.jd.create",
        module: "recruitment",
        description: "Create job descriptions from approved requisitions",
      },
      {
        name: "Update Recruitment Job Descriptions",
        code: "recruitment.jd.update",
        module: "recruitment",
        description: "Update recruitment job description content",
      },
      {
        name: "Manage Recruitment Postings",
        code: "recruitment.posting.manage",
        module: "recruitment",
        description: "Create, publish and synchronize channel postings",
      },
      {
        name: "Manage Recruitment Intake",
        code: "recruitment.intake.manage",
        module: "recruitment",
        description: "Import and synchronize candidate applications",
      },
    ]

    // Create permissions
    const createdPermissions: Record<string, string> = {}
    for (const p of permissionsData) {
      const existingPermission = await prisma.permission.findFirst({
        where: { code: p.code, deletedAt: null },
        select: { id: true },
      })
      const dbPermission = existingPermission
        ? await prisma.permission.update({
            where: { id: existingPermission.id },
            data: { name: p.name, module: p.module, description: p.description, isSystem: true },
          })
        : await prisma.permission.create({
            data: { ...p, isSystem: true },
          })
      createdPermissions[p.code] = dbPermission.id
    }
    console.info(`    [✓] Upserted ${permissionsData.length} permissions.`)

    // Define AppRoles mapping
    const rolesData = [
      {
        name: "admin",
        description: "Full system administration access",
        isSystem: true,
        isAdministrative: true,
        isDefault: false,
      },
      {
        name: "hr_manager",
        description: "Human Resource and Payroll management access",
        isSystem: true,
        isAdministrative: true,
        isDefault: false,
      },
      {
        name: "general_manager",
        description: "Executive reporting and approval access",
        isSystem: true,
        isAdministrative: true,
        isDefault: false,
      },
      {
        name: "team_leader",
        description: "Project management and team coordination access",
        isSystem: true,
        isDefault: false,
      },
      {
        name: "employee",
        description: "Regular employee portal access",
        isSystem: true,
        isDefault: true,
      },
    ]

    // Create AppRoles
    const createdRoles: Record<string, string> = {}
    for (const r of rolesData) {
      const existingRole = await prisma.appRole.findFirst({
        where: { name: r.name, deletedAt: null },
        select: { id: true },
      })
      const dbRole = existingRole
        ? await prisma.appRole.update({
            where: { id: existingRole.id },
            data: {
              description: r.description,
              isSystem: r.isSystem,
              isAdministrative: r.isAdministrative,
              isDefault: r.isDefault,
            },
          })
        : await prisma.appRole.create({ data: r })
      createdRoles[r.name] = dbRole.id
    }
    console.info(`    [✓] Upserted ${rolesData.length} core AppRoles.`)

    // Define role-permission linkages
    const rolePermissionsLink: Record<string, string[]> = {
      admin: permissionsData.map((p) => p.code), // Admin gets everything
      hr_manager: [
        "employee.read",
        "employee.create",
        "employee.update",
        "employee.delete",
        "employee.role.read",
        "employee.role.update",
        "attendance.read",
        "attendance.create",
        "attendance.update",
        "attendance.delete",
        "attendance.export",
        "attendance.weekly_schedule.read",
        "application.read",
        "application.approve",
        "payroll.read",
        "payroll.create",
        "payroll.update",
        "payroll.delete",
        "payroll.salary_config.read",
        "role.read",
        "audit.read",
        // Recruitment
        "recruitment.read",
        "recruitment.create",
        "recruitment.update",
        "recruitment.delete",
        "recruitment.approve",
        "recruitment.requisition.approve",
        "recruitment.jd.read",
        "recruitment.jd.create",
        "recruitment.jd.update",
        "recruitment.posting.manage",
        "recruitment.intake.manage",
      ],
      general_manager: [
        "employee.read",
        "attendance.read",
        "application.read",
        "application.approve",
        "payroll.read",
        "payroll.approve",
        "project.read",
        "task.read",
        "role.read",
      ],
      team_leader: [
        "employee.read",
        "attendance.read",
        "project.read",
        "project.update",
        "task.read",
        "task.create",
        "task.update",
      ],
      employee: ["employee.read", "attendance.read", "project.read", "task.read", "task.update"],
    }

    // Create RolePermissions using createMany for maximum speed
    const rolePermissionsData: Prisma.RolePermissionCreateManyInput[] = []
    for (const [roleName, permissionCodes] of Object.entries(rolePermissionsLink)) {
      const roleId = createdRoles[roleName]
      if (!roleId) continue

      for (const code of permissionCodes) {
        const permissionId = createdPermissions[code]
        if (!permissionId) continue

        rolePermissionsData.push({ roleId, permissionId })
      }
    }

    if (rolePermissionsData.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermissionsData,
        skipDuplicates: true,
      })
    }
    console.info(`    [✓] Linked ${rolePermissionsData.length} role-permission mappings.`)

    // Map existing seeded employees to dynamic AppRoles
    if (context.employees && context.employees.length > 0) {
      const employeeRolesData: Prisma.EmployeeRoleCreateManyInput[] = []
      for (const emp of context.employees) {
        let targetRoleName = "employee"
        if (emp.username === "admin") targetRoleName = "admin"
        else if (emp.username === "hr_manager") targetRoleName = "hr_manager"
        else if (emp.username === "general_manager") targetRoleName = "general_manager"
        else if (emp.position === "Team Leader" || emp.username === "team_leader")
          targetRoleName = "team_leader"

        const roleId = createdRoles[targetRoleName]
        if (!roleId) continue

        employeeRolesData.push({ employeeId: emp.id, roleId })
      }

      if (employeeRolesData.length > 0) {
        await prisma.employeeRole.createMany({
          data: employeeRolesData,
        })
      }
      console.info(
        `    [✓] Assigned dynamic roles to ${employeeRolesData.length} seeded employees.`,
      )
    }

    return {}
  }
}

registry.register(new RBACSeeder())

// Standalone execution
if (import.meta.main) {
  const seeder = new RBACSeeder()
  await seeder.run(createEmptyContext())
  await prisma.$disconnect()
}
