/**
 * Idempotent employee fixture used by the Capacity Copilot demo seed.
 * Re-running it restores Lan instead of creating duplicate employee/auth records.
 */
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_POSITION_CODE,
  EMPLOYEE_TYPE,
  WORK_SCHEDULE_TYPE,
} from "@/configs/entities/employee.config.ts"

import { PrismaClient } from "@prisma/client"

/** Stable fixture identity used across demo seed, forecast history, and E2E checks. */
export const CAPACITY_DEMO_TESTER = {
  fullName: "Lan",
  username: "lan",
  email: "lan@gmail.com",
  phone: "0900000027",
  address: "Capacity Copilot Demo",
  position: "Tester",
  employeeType: EMPLOYEE_TYPE.INTERN,
  workScheduleType: WORK_SCHEDULE_TYPE.PART_TIME,
  status: EMPLOYEE_STATUS.ACTIVE,
} as const

type CapacityDemoEmployeeClient = Pick<PrismaClient, "employee" | "position">

/** Restores the deterministic part-time tester used by Capacity Copilot demos. */
export async function ensureCapacityDemoTester(
  client: CapacityDemoEmployeeClient,
  passwordHash: string,
) {
  const testerPosition = await client.position.findFirst({
    where: { code: EMPLOYEE_POSITION_CODE.TESTER, deletedAt: null },
  })
  const existing = await client.employee.findFirst({
    where: {
      OR: [
        { username: CAPACITY_DEMO_TESTER.username },
        { email: CAPACITY_DEMO_TESTER.email },
      ],
    },
  })

  const data = {
    ...CAPACITY_DEMO_TESTER,
    passwordHash,
    positionId: testerPosition?.id,
    deletedAt: null,
  }

  if (existing) {
    return client.employee.update({ where: { id: existing.id }, data })
  }

  return client.employee.create({ data })
}
