import { PageCard, StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SPENT_TIME_STATUS, getSpentTimeStatusLabel } from "@/config/entities/project.config"
import {
  SPENT_TIME_FILTER,
  SPENT_TIME_UI,
  type SpentTimeFilterValue,
  buildSpentTimeFilterOptions,
  formatBulkApproveLabel,
  getSpentTimeStatusPillVariant,
} from "@/config/rules/spent-time.config"
import { usePermission } from "@/hooks/use-permission"
import { taskApi } from "@/lib/api/task.api"
import type { SpentTime } from "@/types/spent-time.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMemo, useState } from "react"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Clock, ExternalLink, X } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

interface ProjectSpentTimeTabProps {
  projectId: string
  spentTimes: SpentTime[] | undefined
  isLoading: boolean
  isLeader: boolean
}

/**
 * Project-level Spent Time queue for leads — approve/reject without opening each task.
 * PT payroll only includes approved logs; this tab is the lead's gate before payroll run.
 */
export function ProjectSpentTimeTab({
  projectId,
  spentTimes,
  isLoading,
  isLeader,
}: ProjectSpentTimeTabProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<SpentTimeFilterValue>(SPENT_TIME_FILTER.ALL)

  const { hasAnyPermission } = usePermission()
  const canApprove = isLeader || hasAnyPermission(["project.update", "project.task.approve"])

  const filteredLogs = useMemo(() => {
    const list = spentTimes ?? []
    if (statusFilter === SPENT_TIME_FILTER.ALL) return list
    return list.filter((st) => st.status === statusFilter)
  }, [spentTimes, statusFilter])

  const pendingIds = useMemo(
    () =>
      (spentTimes ?? []).filter((st) => st.status === SPENT_TIME_STATUS.PENDING).map((st) => st.id),
    [spentTimes],
  )

  const filterOptions = useMemo(() => buildSpentTimeFilterOptions(), [])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["spentTimes", "project", projectId] })
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => taskApi.approveSpentTime(id),
    onSuccess: () => {
      invalidate()
      toast.success(SPENT_TIME_UI.TOAST_APPROVED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      taskApi.rejectSpentTime(id, reason),
    onSuccess: () => {
      invalidate()
      toast.success(SPENT_TIME_UI.TOAST_REJECTED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => taskApi.approveSpentTime(id)))
    },
    onSuccess: () => {
      invalidate()
      toast.success(SPENT_TIME_UI.TOAST_BULK_APPROVED)
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  })

  return (
    <PageCard className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
          <Clock className="size-4 text-muted-foreground" />
          {SPENT_TIME_UI.TAB_TITLE}
        </h3>

        {canApprove && pendingIds.length > 0 && (
          <Button
            size="sm"
            className="rounded-full h-9"
            disabled={bulkApproveMutation.isPending}
            onClick={() => {
              bulkApproveMutation.mutate(pendingIds)
            }}
          >
            {formatBulkApproveLabel(pendingIds.length)}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={statusFilter === opt.value ? "default" : "outline"}
            className="rounded-full h-8 text-xs"
            onClick={() => {
              setStatusFilter(opt.value)
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">
          {SPENT_TIME_UI.EMPTY_PROJECT_LIST}
        </p>
      ) : (
        <div className="relative overflow-auto max-h-[calc(100vh-280px)] rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-background shadow-xs">
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className="sticky left-0 z-30 bg-background font-semibold text-xs min-w-36">
                  {SPENT_TIME_UI.TABLE_EMPLOYEE}
                </TableHead>
                <TableHead className="font-semibold text-xs">{SPENT_TIME_UI.TABLE_TASK}</TableHead>
                <TableHead className="font-semibold text-xs">{SPENT_TIME_UI.TABLE_DATE}</TableHead>
                <TableHead className="font-semibold text-xs text-center">
                  {SPENT_TIME_UI.TABLE_HOURS}
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  {SPENT_TIME_UI.TABLE_STATUS}
                </TableHead>
                {canApprove && (
                  <TableHead className="font-semibold text-xs text-right">
                    {SPENT_TIME_UI.TABLE_ACTIONS}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((st) => {
                const isPending = st.status === SPENT_TIME_STATUS.PENDING
                return (
                  <TableRow key={st.id} className="h-12 hover:bg-muted/30">
                    <TableCell className="sticky left-0 z-10 bg-background text-xs font-semibold">
                      {st.employee?.fullName ?? SPENT_TIME_UI.EMPTY_CELL}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      <Link
                        to={`/project/tasks/${st.taskId}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {st.task?.title ?? st.taskId}
                        <ExternalLink className="size-3 shrink-0" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(st.date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-xs text-center font-bold">{st.hours}</TableCell>
                    <TableCell>
                      <StatusPill
                        variant={getSpentTimeStatusPillVariant(st.status)}
                        label={getSpentTimeStatusLabel(st.status)}
                        className="text-[9px] px-2 py-0"
                      />
                    </TableCell>
                    {canApprove && (
                      <TableCell className="text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-primary hover:bg-primary/10 rounded-full size-7"
                              title={SPENT_TIME_UI.APPROVE_ACTION_TITLE}
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                approveMutation.mutate(st.id)
                              }}
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-destructive hover:bg-destructive/10 rounded-full size-7"
                              title={SPENT_TIME_UI.REJECT_ACTION_TITLE}
                              disabled={rejectMutation.isPending}
                              onClick={() => {
                                const reason = window.prompt(SPENT_TIME_UI.REJECT_REASON_PROMPT)
                                if (reason?.trim()) {
                                  rejectMutation.mutate({ id: st.id, reason: reason.trim() })
                                }
                              }}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {SPENT_TIME_UI.EMPTY_CELL}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageCard>
  )
}
