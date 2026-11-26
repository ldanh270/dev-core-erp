import { projectTrackerApi } from "@/lib/api/project-tracker.api"
import type {
  CreateProjectTrackerDto,
  UpdateProjectTrackerDto,
} from "@/types/project-tracker.types"
import { extractErrorMessage } from "@/utils/error-helper"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Hook to retrieve all trackers configured in a project.
 * @param projectId - Project ID.
 */
export function useProjectTrackers(projectId: string) {
  return useQuery({
    queryKey: ["projectTrackers", projectId],
    queryFn: () => projectTrackerApi.list(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook to create a project-scoped custom tracker.
 * @param projectId - Project ID.
 */
export function useCreateProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectTrackerDto) => projectTrackerApi.create(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      toast.success("Đã thêm loại yêu cầu mới")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

/**
 * Hook to update an existing project-scoped custom tracker.
 * @param projectId - Project ID.
 */
export function useUpdateProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTrackerDto }) =>
      projectTrackerApi.update(projectId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Đã cập nhật loại yêu cầu")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}

/**
 * Hook to delete or deactivate a project-scoped custom tracker.
 * @param projectId - Project ID.
 */
export function useDeleteProjectTracker(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectTrackerApi.delete(projectId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projectTrackers", projectId] })
      void queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Đã xóa loại yêu cầu")
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err))
    },
  })
}
