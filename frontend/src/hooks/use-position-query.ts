import { positionApi } from "@/lib/api/position.api"
import type { ProjectPositionRuleDto, UpdatePositionDto } from "@/lib/api/position.api"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Key definitions for caching position queries.
 */
const positionKeys = {
  all: ["positions"] as const,
  lists: () => [...positionKeys.all, "list"] as const,
  details: () => [...positionKeys.all, "detail"] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
  projectRulesAll: () => [...positionKeys.all, "project-rules"] as const,
  projectRules: (projectId: string) => [...positionKeys.projectRulesAll(), projectId] as const,
}

/**
 * Hook to retrieve all positions list.
 */
export function usePositions() {
  return useQuery({
    queryKey: positionKeys.lists(),
    queryFn: positionApi.list,
  })
}

/**
 * Hook to retrieve a single position details.
 * @param id - Position ID.
 */
export function usePosition(id: string) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => positionApi.getOne(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new position.
 */
export function useCreatePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: positionApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing position.
 */
export function useUpdatePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePositionDto }) =>
      positionApi.update(id, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: positionKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete a position.
 */
export function useDeletePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: positionApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

/**
 * Hook to fetch allowed task trackers rules for all positions in a project.
 * @param projectId - Project ID.
 */
export function useProjectPositionRules(projectId: string) {
  return useQuery({
    queryKey: positionKeys.projectRules(projectId),
    queryFn: () => positionApi.listProjectRules(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to batch save position allowed task trackers project rules.
 */
export function useSaveProjectPositionRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, rules }: { projectId: string; rules: ProjectPositionRuleDto[] }) =>
      positionApi.saveProjectRules(projectId, rules),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: positionKeys.projectRules(variables.projectId),
      })
    },
  })
}
