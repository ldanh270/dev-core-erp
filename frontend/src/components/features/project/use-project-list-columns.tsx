import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import {
  getProjectStatusLabel,
  getProjectStatusVariant,
} from "@/config/entities/project.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project.types"

import { useMemo } from "react"

/**
 * Generates table column definitions for the projects directory table.
 */
export function useProjectListColumns() {
  return useMemo<DataTableColumn<Project>[]>(
    () => [
      {
        id: "name",
        header: "Tên dự án",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        sticky: true,
        cell: (project) => (
          <div className="flex flex-col">
            <span
              className={cn(
                TYPOGRAPHY.CELL_PRIMARY,
                "font-medium hover:text-primary transition-colors",
              )}
            >
              {project.name}
            </span>
            {project.description && (
              <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "truncate max-w-xs")}>
                {project.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "teamLeader",
        header: "Trưởng nhóm (Lead)",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: `${TABLE_COL_WIDTH.EMPLOYEE}px`,
        cell: (project) => (
          <span className={TYPOGRAPHY.CELL_PRIMARY}>
            {project.teamLeader?.fullName || "Chưa gán"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (project) => (
          <StatusPill
            label={getProjectStatusLabel(project.status)}
            variant={getProjectStatusVariant(project.status)}
          />
        ),
      },
      {
        id: "techStack",
        header: "Công nghệ",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (project) => (
          <div className="flex flex-wrap gap-1 items-center">
            {project.techStack && project.techStack.length > 0 ? (
              project.techStack.map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="text-[10px] uppercase font-bold tracking-wider py-0 px-1.5 rounded-full bg-background"
                >
                  {tech}
                </Badge>
              ))
            ) : (
              <span className={TYPOGRAPHY.CELL_SECONDARY}>Chưa có</span>
            )}
          </div>
        ),
      },
    ],
    [],
  )
}
