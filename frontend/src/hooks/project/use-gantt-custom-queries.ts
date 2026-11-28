import { CUSTOM_QUERY_TYPE } from "@/config/entities/project.config"
import { PROJECT_QUERY_KEY } from "@/constants/gantt.constants"
import { customQueryApi } from "@/lib/api/custom-query.api"
import type { CustomQuery } from "@/lib/api/custom-query.api"
import { extractErrorMessage } from "@/utils/error-helper"

import { useEffect, useState } from "react"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

interface UseGanttCustomQueriesProps {
  projectId: string
  setActiveFilterKeys: (keys: string[]) => void
  setFilterStates: (
    states: Record<string, { enabled: boolean; operator: string; value: string }>,
  ) => void
  setAppliedFilterKeys: (keys: string[]) => void
  setAppliedFilterStates: (
    states: Record<string, { enabled: boolean; operator: string; value: string }>,
  ) => void
  setShowEstTime: (val: boolean) => void
  setShowAssignee: (val: boolean) => void
  setShowProgress: (val: boolean) => void
}

/**
 * Hook to manage saved Gantt custom queries, loading query state from URL, and persisting updates.
 */
export function useGanttCustomQueries({
  projectId,
  setActiveFilterKeys,
  setFilterStates,
  setAppliedFilterKeys,
  setAppliedFilterStates,
  setShowEstTime,
  setShowAssignee,
  setShowProgress,
}: UseGanttCustomQueriesProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [appliedUrlQueryId, setAppliedUrlQueryId] = useState<string | null>(null)

  const { data: savedQueries = [], refetch: refetchSavedQueries } = useQuery({
    queryKey: [PROJECT_QUERY_KEY.CUSTOM_QUERIES, projectId],
    queryFn: () => customQueryApi.list(projectId),
    enabled: !!projectId,
  })

  const urlQueryId = searchParams.get("queryId")

  useEffect(() => {
    if (urlQueryId && savedQueries.length > 0 && urlQueryId !== appliedUrlQueryId) {
      const matched = savedQueries.find((q) => q.id === urlQueryId)
      if (matched) {
        try {
          const data = JSON.parse(matched.queryData)
          if (data && Array.isArray(data.activeFilterKeys) && data.filterStates) {
            setActiveFilterKeys(data.activeFilterKeys)
            setFilterStates(data.filterStates)
            setAppliedFilterKeys(data.activeFilterKeys)
            setAppliedFilterStates(data.filterStates)

            if (data.options) {
              if (data.options.showEstTime !== undefined) setShowEstTime(data.options.showEstTime)
              if (data.options.showAssignee !== undefined)
                setShowAssignee(data.options.showAssignee)
              if (data.options.showProgress !== undefined)
                setShowProgress(data.options.showProgress)
            }
            setAppliedUrlQueryId(urlQueryId)
            toast.success(`Đã tự động áp dụng truy vấn: ${matched.name}`)
          }
        } catch (e) {
          console.error("Error parsing URL query data", e)
        }
      }
    }
  }, [
    urlQueryId,
    savedQueries,
    appliedUrlQueryId,
    setActiveFilterKeys,
    setFilterStates,
    setAppliedFilterKeys,
    setAppliedFilterStates,
    setShowEstTime,
    setShowAssignee,
    setShowProgress,
  ])

  const saveQueryMutation = useMutation({
    mutationFn: async (data: { name: string; projectId?: string | null; queryData: string }) => {
      return customQueryApi.create({
        name: data.name,
        type: CUSTOM_QUERY_TYPE.GANTT,
        projectId: data.projectId !== undefined ? data.projectId : projectId,
        queryData: data.queryData,
      })
    },
    onSuccess: () => {
      void refetchSavedQueries()
      toast.success("Đã lưu truy vấn thành công")
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
      void refetchSavedQueries()
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

  const applySavedQuery = (savedQuery: CustomQuery) => {
    try {
      const data = JSON.parse(savedQuery.queryData)
      if (data && Array.isArray(data.activeFilterKeys) && data.filterStates) {
        setActiveFilterKeys(data.activeFilterKeys)
        setFilterStates(data.filterStates)
        setAppliedFilterKeys(data.activeFilterKeys)
        setAppliedFilterStates(data.filterStates)

        if (data.options) {
          if (data.options.showEstTime !== undefined) setShowEstTime(data.options.showEstTime)
          if (data.options.showAssignee !== undefined) setShowAssignee(data.options.showAssignee)
          if (data.options.showProgress !== undefined) setShowProgress(data.options.showProgress)
        }

        setAppliedUrlQueryId(savedQuery.id)
        const newParams = new URLSearchParams(searchParams)
        newParams.set("queryId", savedQuery.id)
        setSearchParams(newParams)

        toast.success(`Đã áp dụng truy vấn: ${savedQuery.name}`)
      } else {
        toast.error("Dữ liệu truy vấn không hợp lệ")
      }
    } catch {
      toast.error("Không thể đọc dữ liệu truy vấn đã lưu")
    }
  }

  const handleSaveQuery = (data: {
    name: string
    projectId?: string | null
    queryData: string
  }) => {
    saveQueryMutation.mutate(data)
  }

  const clearUrlQueryId = () => {
    if (urlQueryId) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("queryId")
      setSearchParams(newParams)
      setAppliedUrlQueryId(null)
    }
  }

  return {
    savedQueries,
    saveQueryMutation,
    deleteQueryMutation,
    applySavedQuery,
    handleSaveQuery,
    clearUrlQueryId,
  }
}
