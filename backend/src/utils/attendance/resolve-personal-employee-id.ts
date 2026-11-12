import { EMPLOYEE_STATUS } from "@/configs/entities/employee.config.ts"
import { prisma } from "@/libs/database.ts"

/**
 * Resolved link between an authenticated account profile and their corresponding HR employee record.
 */
export interface PersonalEmployeeLink {
  personalEmployeeId: string | null
  personalEmployee: {
    id: string
    fullName: string
    email: string
  } | null
}

/**
 * Resolves the underlying physical employee ID for a given user account ID.
 * If the account references a personalEmployeeId pointing to an active employee record, returns that ID;
 * otherwise defaults to the provided account ID.
 *
 * @param accountId - The primary key ID of the authenticated user/account
 * @returns Resolved employee ID string
 */
export async function resolvePersonalEmployeeId(accountId: string): Promise<string> {
  // Auth account may be a phantom profile linked to the real HR employee row.
  const account = await prisma.employee.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { personalEmployeeId: true },
  })

  if (!account?.personalEmployeeId) {
    return accountId
  }

  const linked = await prisma.employee.findFirst({
    where: {
      id: account.personalEmployeeId,
      deletedAt: null,
      status: EMPLOYEE_STATUS.ACTIVE,
    },
    select: { id: true },
  })

  // Inactive/missing HR link → keep auth account id so availability APIs do not hard-fail.
  return linked?.id ?? accountId
}

/**
 * Retrieves the full personal employee link data for an authenticated account.
 * Filters out deleted or non-active linked HR profiles to prevent stale identity usage.
 *
 * @param accountId - The primary key ID of the user account
 * @returns Object containing personalEmployeeId and basic profile details, or nulls if unlinked
 */
export async function getPersonalEmployeeLink(accountId: string): Promise<PersonalEmployeeLink> {
  const account = await prisma.employee.findFirst({
    where: { id: accountId, deletedAt: null },
    select: {
      personalEmployeeId: true,
      personalEmployee: {
        select: { id: true, fullName: true, email: true, status: true, deletedAt: true },
      },
    },
  })

  if (!account) {
    return { personalEmployeeId: null, personalEmployee: null }
  }

  const linked = account.personalEmployee
  // Hide terminated/deleted HR links — personal UI must not act on stale employee identity.
  const isLinkedActive =
    linked && linked.deletedAt == null && linked.status === EMPLOYEE_STATUS.ACTIVE

  return {
    personalEmployeeId: isLinkedActive ? account.personalEmployeeId : null,
    personalEmployee: isLinkedActive
      ? { id: linked.id, fullName: linked.fullName, email: linked.email }
      : null,
  }
}
