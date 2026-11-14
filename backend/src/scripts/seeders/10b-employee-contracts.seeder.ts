import {
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  CONTRACT_TYPES,
} from "@/configs/entities/employee-contract.config.ts"
import { prisma } from "@/libs/database.ts"
import { SeedContext, createEmptyContext } from "@/scripts/seeders/seed-context.ts"
import { ISeeder } from "@/scripts/seeders/seeder.interface.ts"
import { registry } from "@/scripts/seeders/seeder.registry.ts"

const DEMO_CONTRACT_START_DATE = new Date(2025, 0, 1)
const DEMO_CONTRACT_END_DATE = new Date(2026, 11, 31)
const DEMO_CONTRACT_NUMBER_PREFIX = "HD-DEMO-2025"
const INSURANCE_NUMBER_PREFIX = "079"
const INSURANCE_SALARY = 15_000_000
const DEMO_IDENTIFIER_LIMIT = 1_000_000_000

const CONTRACT_STATUSES = [
  CONTRACT_STATUS.ACTIVE,
  CONTRACT_STATUS.PENDING_SIGNATURE,
  CONTRACT_STATUS.EXPIRED,
  CONTRACT_STATUS.TERMINATED,
] as const

function createDemoInsuranceNumber(username: string): string {
  const suffix = [...username].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % DEMO_IDENTIFIER_LIMIT,
    0,
  )

  return `${INSURANCE_NUMBER_PREFIX}${String(suffix).padStart(9, "0")}`
}

/**
 * Creates stable contract records for the existing employee demo accounts.
 * The same pass also fills missing national IDs, which power the current
 * insurance page's insurance-number display without replacing user data.
 */
export class EmployeeContractsSeeder implements ISeeder {
  readonly name = "EmployeeContracts"
  readonly order = 10.5

  async run(context: SeedContext): Promise<Partial<SeedContext>> {
    if (!context.adminId || context.employees.length === 0) {
      throw new Error("Missing required context (admin or employees).")
    }

    console.log("  Seeding employee contracts and insurance demo identifiers...")

    const employees = [...context.employees].sort((left, right) =>
      left.username.localeCompare(right.username),
    )

    const contracts = await prisma.$transaction(
      async (transaction) => {
        await Promise.all(
          employees.map((employee) =>
            transaction.employee.updateMany({
              where: { id: employee.id, nationalId: null },
              data: {
                nationalId: createDemoInsuranceNumber(employee.username),
              },
            }),
          ),
        )

        return Promise.all(
          employees.map(async (employee, index) => {
            const contractType = CONTRACT_TYPES[index % CONTRACT_TYPES.length]
            const status = CONTRACT_STATUSES[index % CONTRACT_STATUSES.length]
            const contractNumber = `${DEMO_CONTRACT_NUMBER_PREFIX}-${employee.username.toUpperCase()}`
            const isTerminated = status === CONTRACT_STATUS.TERMINATED

            const existing = await transaction.employeeContract.findFirst({
              where: { contractNumber, deletedAt: null },
              select: { id: true },
            })

            if (existing) {
              return transaction.employeeContract.update({
                where: { id: existing.id },
                data: {
                  employeeId: employee.id,
                  contractType,
                  status,
                  updatedById: context.adminId,
                },
              })
            }

            return transaction.employeeContract.create({
              data: {
                employeeId: employee.id,
                contractType,
                contractNumber,
                title: "Hợp đồng lao động demo",
                signedDate: DEMO_CONTRACT_START_DATE,
                startDate: DEMO_CONTRACT_START_DATE,
                endDate: contractType === CONTRACT_TYPE.INDEFINITE ? null : DEMO_CONTRACT_END_DATE,
                salary: INSURANCE_SALARY + index * 1_000_000,
                allowances: { meal: 700_000, transport: 500_000 },
                attachments: [],
                status,
                terminationReason: isTerminated ? "Kết thúc hợp đồng demo" : null,
                terminationDate: isTerminated ? DEMO_CONTRACT_END_DATE : null,
                createdById: context.adminId,
                updatedById: context.adminId,
                note: "Dữ liệu demo liên kết với hồ sơ nhân sự.",
              },
            })
          }),
        )
      },
      { timeout: 120_000 },
    )

    console.log(`  Seeded ${contracts.length} employee contracts.`)
    return {}
  }
}

registry.register(new EmployeeContractsSeeder())

if (import.meta.main) {
  const admin = await prisma.employee.findFirst({ where: { username: "admin" } })
  const employees = await prisma.employee.findMany({
    select: { id: true, position: true, username: true },
  })
  const context = createEmptyContext()
  context.adminId = admin?.id ?? ""
  context.employees = employees

  await new EmployeeContractsSeeder().run(context)
  await prisma.$disconnect()
}
