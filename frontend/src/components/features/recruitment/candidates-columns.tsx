import type { DataTableColumn } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { Candidate } from "@/types/recruitment.types"
import { Eye, Mail, Phone } from "lucide-react"

export interface CandidatesColumnsOptions {
  onViewDetails: (candidate: Candidate) => void
}

/**
 * Factory function defining data table column schema for candidates.
 */
export function getCandidatesColumns({
  onViewDetails,
}: CandidatesColumnsOptions): DataTableColumn<Candidate>[] {
  return [
      {
        id: "candidate",
        header: "Ứng viên",
        width: getTableColWidthPx("EMPLOYEE"),
        minWidth: getTableColWidthPx("EMPLOYEE"),
        sticky: true,
        cell: (candidate) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              onViewDetails(candidate)
            }}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-semibold text-primary">
                {candidate.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <span
                className={cn(
                  TYPOGRAPHY.CELL_PRIMARY,
                  "group-hover:text-primary group-hover:underline transition-colors block truncate",
                )}
              >
                {candidate.fullName}
              </span>
              {candidate.currentPosition && (
                <p className={cn(TYPOGRAPHY.CELL_SECONDARY, "mt-0.5 truncate max-w-48")}>
                  {candidate.currentPosition}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "email",
        header: "Email",
        width: getTableColWidthPx("CONTACT"),
        minWidth: getTableColWidthPx("SCHEDULE"),
        cell: (candidate) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-normal truncate")}>
              {candidate.email}
            </span>
          </div>
        ),
      },
      {
        id: "phone",
        header: "Điện thoại",
        width: getTableColWidthPx("STATUS"),
        minWidth: getTableColWidthPx("STATUS"),
        hideBelow: "md",
        cell: (candidate) =>
          candidate.phone ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-normal")}>{candidate.phone}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        id: "source",
        header: "Nguồn",
        width: getTableColWidthPx("TYPE"),
        minWidth: getTableColWidthPx("DATE"),
        cell: (candidate) => (
          <Badge variant="outline" className="rounded-full text-[11px] font-normal">
            {RECRUITMENT_SOURCE_LABELS[candidate.source] || candidate.source}
          </Badge>
        ),
      },
      {
        id: "experience",
        header: "Kinh nghiệm",
        width: getTableColWidthPx("TIME"),
        minWidth: getTableColWidthPx("TIME"),
        hideBelow: "lg",
        cell: (candidate) => (
          <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-normal")}>
            {candidate.yearsOfExperience ? `${candidate.yearsOfExperience} năm` : "—"}
          </span>
        ),
      },
      {
        id: "skills",
        header: "Kỹ năng",
        width: getTableColWidthPx("TITLE"),
        minWidth: getTableColWidthPx("SCHEDULE"),
        hideBelow: "lg",
        cell: (candidate) => (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(candidate.skills || []).slice(0, 3).map((skill, i) => (
              <Badge key={i} variant="secondary" className="rounded-full text-[10px]">
                {skill}
              </Badge>
            ))}
            {(candidate.skills || []).length > 3 && (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                +{(candidate.skills || []).length - 3}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: getTableColWidthPx("ACTIONS"),
        align: "right",
        cell: (candidate) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted h-8 w-8"
                onClick={() => {
                  onViewDetails(candidate)
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết ứng viên</TooltipContent>
          </Tooltip>
        ),
      },
    ]
}
