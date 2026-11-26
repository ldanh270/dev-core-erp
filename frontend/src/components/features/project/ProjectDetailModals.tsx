import React from "react"
import { AddMemberModal } from '@/components/features/project/AddMemberModal'
import { EditMemberModal } from '@/components/features/project/EditMemberModal'
import { EditProjectModal } from "@/components/features/project/EditProjectModal"
import { ProjectTaskGeneratorModal } from '@/components/features/project/ProjectTaskGeneratorModal'
import type { Project, ProjectMember } from "@/types/project.types"
import type { Employee } from "@/types/employee.types"

export interface ProjectDetailModalsProps {
  projectId: string
  project: Project
  projectMembers: ProjectMember[]
  allEmployees: Employee[]
  isOpenMemberModal: boolean
  onOpenMemberModalChange: (open: boolean) => void
  editingMember: ProjectMember | null
  onEditingMemberChange: (member: ProjectMember | null) => void
  isOpenEditProjectModal: boolean
  onOpenEditProjectModalChange: (open: boolean) => void
  isAiDecomposeOpen: boolean
  onAiDecomposeOpenChange: (open: boolean) => void
}

/**
 * Presenter component that encapsulates all modals for the Project Detail page.
 */
export const ProjectDetailModals: React.FC<ProjectDetailModalsProps> = ({
  projectId,
  project,
  projectMembers,
  allEmployees,
  isOpenMemberModal,
  onOpenMemberModalChange,
  editingMember,
  onEditingMemberChange,
  isOpenEditProjectModal,
  onOpenEditProjectModalChange,
  isAiDecomposeOpen,
  onAiDecomposeOpenChange,
}) => {
  return (
    <>
      <AddMemberModal
        isOpen={isOpenMemberModal}
        onOpenChange={onOpenMemberModalChange}
        projectId={projectId}
        members={projectMembers}
        allEmployees={allEmployees}
        teamLeaderId={project.teamLeaderId}
      />

      <EditMemberModal
        isOpen={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open) onEditingMemberChange(null)
        }}
        projectId={projectId}
        member={editingMember}
        allEmployees={allEmployees}
      />

      <EditProjectModal
        isOpen={isOpenEditProjectModal}
        onOpenChange={onOpenEditProjectModalChange}
        projectId={projectId}
        project={project}
        allEmployees={allEmployees}
      />

      <ProjectTaskGeneratorModal
        projectId={projectId}
        isOpen={isAiDecomposeOpen}
        onOpenChange={onAiDecomposeOpenChange}
      />
    </>
  )
}


