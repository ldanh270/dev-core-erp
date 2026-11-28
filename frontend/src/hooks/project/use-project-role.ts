import { projectRoleApi } from "@/lib/api/project-role.api"
import type { CreateProjectRoleDto, UpdateProjectRoleDto } from "@/types/project-role.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Hook to retrieve all roles in a project.
 * @param projectId - Project ID.
 */
export function useProjectRoles(projectId: string) {
  return useQuery({
    queryKey: ["projectRoles", projectId],
    queryFn: () => projectRoleApi.list(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to create a project-scoped custom role.
 * @param projectId - Project ID.
 */
export function useCreateProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectRoleDto) => projectRoleApi.create(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      toast.success("Đã thêm vai trò dự án mới")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

/**
 * Hook to update a project-scoped custom role.
 * @param projectId - Project ID.
 */
export function useUpdateProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRoleDto }) =>
      projectRoleApi.update(projectId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] })
      toast.success("Đã cập nhật vai trò dự án")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

/**
 * Hook to delete a project-scoped custom role.
 * @param projectId - Project ID.
 */
export function useDeleteProjectRole(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectRoleApi.delete(projectId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectRoles", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] })
      toast.success("Đã xóa vai trò dự án")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}
