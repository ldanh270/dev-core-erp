import { STATUS_KEYWORD_MAP, TASK_STATUS } from "@/configs/entities/project.config.ts"

import { TaskStatus } from "@prisma/client"

/**
 * Maps a dynamic custom status name and completed flag back to the closest
 * matching Prisma TaskStatus enum.
 *
 * Keyword matching is driven by STATUS_KEYWORD_MAP in project.config.ts —
 * no hardcoded strings live here.  Extend the map there when adding locales.
 *
 * Fallback: isCompleted=true → DONE, otherwise → TODO.
 */
export function mapStatusNameToEnum(name: string, isCompleted: boolean): TaskStatus {
  const norm = name.toLowerCase().trim()

  for (const keyword of STATUS_KEYWORD_MAP.TODO) {
    if (norm.includes(keyword)) return TASK_STATUS.TODO
  }
  for (const keyword of STATUS_KEYWORD_MAP.IN_PROGRESS) {
    if (norm.includes(keyword)) return TASK_STATUS.IN_PROGRESS
  }
  for (const keyword of STATUS_KEYWORD_MAP.IN_REVIEW) {
    if (norm.includes(keyword)) return TASK_STATUS.IN_REVIEW
  }
  for (const keyword of STATUS_KEYWORD_MAP.DONE) {
    if (norm.includes(keyword)) return TASK_STATUS.DONE
  }
  for (const keyword of STATUS_KEYWORD_MAP.CANCELLED) {
    if (norm.includes(keyword)) return TASK_STATUS.CANCELLED
  }
  for (const keyword of STATUS_KEYWORD_MAP.REOPENED) {
    if (norm.includes(keyword)) return TASK_STATUS.REOPENED
  }

  return isCompleted ? TASK_STATUS.DONE : TASK_STATUS.TODO
}
