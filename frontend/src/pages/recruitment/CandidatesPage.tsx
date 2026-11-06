import {
  DataTablePage,
  type DataTableColumn,
} from "@/components/common"
import { ViewCandidateDialog } from "@/components/features/recruitment/view-candidate-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import { ROUTES } from "@/config/routes.config"
import { useCandidates } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { useDebounce } from "@/hooks/use-debounce"
import { routerNavigate } from "@/lib/router-navigator"
import type { Candidate } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { Eye, Mail, Phone, Plus, UserX } from "lucide-react"

export default function CandidatesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const debouncedKeyword = useDebounce(keyword, 400)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [viewCandidateOpen, setViewCandidateOpen] = useState(false)
  const { hasPermission } = usePermission()

  const { data, isLoading } = useCandidates({
    keyword: debouncedKeyword || undefined,
    page,
    pageSize,
  })

  const candidates = data?.data ?? []
  const meta = data?.meta

  const handleViewDetails = (candidate: Candidate) => {
    const appId = (candidate as { applications?: Array<{ id: string }> }).applications?.[0]?.id
    if (appId) {
      routerNavigate(`/recruitment/applications/${appId}`)
    } else {
      setSelectedCandidate(candidate)
      setViewCandidateOpen(true)
    }
  }

  const columns: DataTableColumn<Candidate>[] = useMemo(
    () => [
      {
        id: "candidate",
        header: "Ứng viên",
        minWidth: "240px",
        sticky: true,
        cell: (candidate) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { handleViewDetails(candidate); }}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-semibold text-primary">
                {candidate.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-medium text-foreground group-hover:text-primary group-hover:underline text-sm transition-colors block truncate">
                {candidate.fullName}
              </span>
              {candidate.currentPosition && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
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
        minWidth: "180px",
        cell: (candidate) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">{candidate.email}</span>
          </div>
        ),
      },
      {
        id: "phone",
        header: "Điện thoại",
        minWidth: "140px",
        hideBelow: "md",
        cell: (candidate) =>
          candidate.phone ? (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>{candidate.phone}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        id: "source",
        header: "Nguồn",
        minWidth: "130px",
        cell: (candidate) => (
          <Badge variant="outline" className="rounded-full text-[11px] font-normal">
            {RECRUITMENT_SOURCE_LABELS[candidate.source] || candidate.source}
          </Badge>
        ),
      },
      {
        id: "experience",
        header: "Kinh nghiệm",
        minWidth: "120px",
        hideBelow: "lg",
        cell: (candidate) => (
          <span className="text-sm text-foreground">
            {candidate.yearsOfExperience ? `${candidate.yearsOfExperience} năm` : "—"}
          </span>
        ),
      },
      {
        id: "skills",
        header: "Kỹ năng",
        minWidth: "180px",
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
        width: "60px",
        align: "center",
        cell: (candidate) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted h-8 w-8"
                onClick={() => { handleViewDetails(candidate); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết ứng viên</TooltipContent>
          </Tooltip>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <DataTablePage<Candidate>
        title="Ứng viên"
        description="Quản lý danh sách ứng viên và hồ sơ"
        variant="viewport"
        data={candidates}
        columns={columns}
        isLoading={isLoading}
        keyExtractor={(candidate) => candidate.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm kiếm theo tên, email...",
        }}
        primaryAction={
          hasPermission("recruitment.intake.manage") ? (
            <Button
              className="rounded-full font-semibold gap-1.5"
              onClick={() => { routerNavigate(ROUTES.RECRUITMENT.APPLICANT_INTAKE); }}
            >
              <Plus className="h-4 w-4" />
              Tiếp nhận ứng viên
            </Button>
          ) : undefined
        }
        emptyState={{
          icon: UserX,
          title: keyword ? "Không tìm thấy ứng viên phù hợp" : "Chưa có ứng viên nào",
          description: keyword
            ? "Không có hồ sơ ứng viên nào khớp với từ khóa tìm kiếm."
            : "Hiện tại chưa có hồ sơ ứng viên nào được tiếp nhận vào hệ thống.",
        }}
        pagination={{
          currentPage: page,
          totalPages: meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1,
          totalItems: meta?.total ?? candidates.length,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (val) => {
            setPageSize(val)
            setPage(1)
          },
        }}
      />

      <ViewCandidateDialog
        open={viewCandidateOpen}
        onOpenChange={setViewCandidateOpen}
        candidate={selectedCandidate}
      />
    </>
  )
}
