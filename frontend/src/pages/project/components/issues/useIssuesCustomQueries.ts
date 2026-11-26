import { customQueryApi } from "@/lib/api/custom-query.api"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { extractErrorMessage } from "@/utils/error-helper"

import { useEffect, useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { ALL_FILTER_VALUE } from "./issue-columns.config"

const DEFAULT_COLUMNS = ["id", "tracker", "title", "assignee", "status", "priority", "progress"]

interface UseIssuesCustomQueriesProps {
  projectId: string
  user: { id: string } | null
  statusFilter: string
  trackerFilter: string
  priorityFilter: string
  assigneeFilter: string
  createdByIdFilter: string
  setStatusFilter: (val: string) => void
  setTrackerFilter: (val: string) => void
  setPriorityFilter: (val: string) => void
  setAssigneeFilter: (val: string) => void
  setCreatedByIdFilter: (val: string) => void
  setDisplayColumns: (cols: string[]) => void
  onSaveSuccess: () => void
}

/** Custom hook coordinating custom query lifecycle, execution, and mutations for issues. */
export function useIssuesCustomQueries({
  projectId,
  user,
  statusFilter,
  trackerFilter,
  priorityFilter,
  assigneeFilter,
  createdByIdFilter,
  setStatusFilter,
  setTrackerFilter,
  setPriorityFilter,
  setAssigneeFilter,
  setCreatedByIdFilter,
  setDisplayColumns,
  onSaveSuccess,
}: UseIssuesCustomQueriesProps) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedUrlQueryId, setAppliedUrlQueryId] = useState<string | null>(null)

  const { data: savedQueries = [] } = useQuery({
    queryKey: ["customQueries", projectId, "issues"],
    queryFn: () => customQueryApi.list(projectId, "issues"),
    enabled: !!projectId,
  })

  const urlQueryId = searchParams.get("queryId")

  useEffect(() => {
    if (urlQueryId && savedQueries.length > 0 && urlQueryId !== appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          if (data.defaultColumns) {
            setDisplayColumns(DEFAULT_COLUMNS)
          } else if (Array.isArray(data.selectedColumns)) {
            setDisplayColumns(data.selectedColumns)
          }

          if (data.filters) {
            setStatusFilter(data.filters.status?.enabled ? data.filters.status.value : ALL_FILTER_VALUE)
            setTrackerFilter(data.filters.tracker?.enabled ? data.filters.tracker.value : ALL_FILTER_VALUE)
            setPriorityFilter(data.filters.priority?.enabled ? data.filters.priority.value : ALL_FILTER_VALUE)
            setAssigneeFilter(
              data.filters.assignee?.enabled
                ? data.filters.assignee.value === "me"
                  ? user?.id || ALL_FILTER_VALUE
                  : data.filters.assignee.value
                : ALL_FILTER_VALUE,
            )
            setCreatedByIdFilter(
              data.filters.createdBy?.enabled
                ? data.filters.createdBy.value === "me"
                  ? user?.id || ALL_FILTER_VALUE
                  : data.filters.createdBy.value
                : ALL_FILTER_VALUE,
            )
          }
          setAppliedUrlQueryId(urlQueryId)
          toast.success(`Đã tự động áp dụng truy vấn: ${matched.name}`)
        } catch (e) {
          console.error("Error parsing URL query data", e)
        }
      }
    }
  }, [
    urlQueryId,
    savedQueries,
    appliedUrlQueryId,
    user,
    setAssigneeFilter,
    setCreatedByIdFilter,
    setDisplayColumns,
    setPriorityFilter,
    setStatusFilter,
    setTrackerFilter,
  ])

  useEffect(() => {
    if (urlQueryId && appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          const matchStatus = data.filters?.status?.enabled ? data.filters.status.value : ALL_FILTER_VALUE
          const matchTracker = data.filters?.tracker?.enabled ? data.filters.tracker.value : ALL_FILTER_VALUE
          const matchPriority = data.filters?.priority?.enabled ? data.filters.priority.value : ALL_FILTER_VALUE
          const matchAssignee = data.filters?.assignee?.enabled
            ? data.filters.assignee.value === "me"
              ? user?.id || ALL_FILTER_VALUE
              : data.filters.assignee.value
            : ALL_FILTER_VALUE
          const matchCreatedBy = data.filters?.createdBy?.enabled
            ? data.filters.createdBy.value === "me"
              ? user?.id || ALL_FILTER_VALUE
              : data.filters.createdBy.value
            : ALL_FILTER_VALUE

          if (
            statusFilter !== matchStatus ||
            trackerFilter !== matchTracker ||
            priorityFilter !== matchPriority ||
            assigneeFilter !== matchAssignee ||
            createdByIdFilter !== matchCreatedBy
          ) {
            const newParams = new URLSearchParams(searchParams)
            newParams.delete("queryId")
            setSearchParams(newParams)
            setAppliedUrlQueryId(null)
          }
        } catch {

        }
      }
    }
  }, [
    statusFilter,
    trackerFilter,
    priorityFilter,
    assigneeFilter,
    createdByIdFilter,
    urlQueryId,
    appliedUrlQueryId,
    savedQueries,
    user,
    searchParams,
    setSearchParams,
  ])

  const saveQueryMutation = useMutation({
    mutationFn: async (data: { name: string; projectId: string | null; queryData: string }) => {
      return customQueryApi.create({
        name: data.name,
        type: "issues",
        projectId: data.projectId,
        queryData: data.queryData,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customQueries", projectId, "issues"] })
      toast.success("Đã lưu truy vấn thành công")
      onSaveSuccess()
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      return customQueryApi.delete(id)
    },
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ["customQueries", projectId, "issues"] })
      if (urlQueryId === deletedId) {
        const newParams = new URLSearchParams(searchParams)
        newParams.delete("queryId")
        setSearchParams(newParams)
        setAppliedUrlQueryId(null)
      }
      toast.success("Đã xóa truy vấn thành công")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })

  const applySavedQuery = (q: CustomQuery) => {
    try {
      const data = JSON.parse(q.queryData)
      if (data.defaultColumns) {
        setDisplayColumns(DEFAULT_COLUMNS)
      } else if (Array.isArray(data.selectedColumns)) {
        setDisplayColumns(data.selectedColumns)
      }

      if (data.filters) {
        setStatusFilter(data.filters.status?.enabled ? data.filters.status.value : ALL_FILTER_VALUE)
        setTrackerFilter(data.filters.tracker?.enabled ? data.filters.tracker.value : ALL_FILTER_VALUE)
        setPriorityFilter(data.filters.priority?.enabled ? data.filters.priority.value : ALL_FILTER_VALUE)
        setAssigneeFilter(
          data.filters.assignee?.enabled
            ? data.filters.assignee.value === "me"
              ? user?.id || ALL_FILTER_VALUE
              : data.filters.assignee.value
            : ALL_FILTER_VALUE,
        )
        setCreatedByIdFilter(
          data.filters.createdBy?.enabled
            ? data.filters.createdBy.value === "me"
              ? user?.id || ALL_FILTER_VALUE
              : data.filters.createdBy.value
            : ALL_FILTER_VALUE,
        )
      }

      setAppliedUrlQueryId(q.id)
      const newParams = new URLSearchParams(searchParams)
      newParams.set("queryId", q.id)
      setSearchParams(newParams)
      toast.success(`Đã áp dụng truy vấn: ${q.name}`)
    } catch {
      toast.error("Không thể đọc dữ liệu truy vấn đã lưu")
    }
  }

  return {
    savedQueries,
    saveQueryMutation,
    deleteQueryMutation,
    applySavedQuery,
  }
}
