import { AppPagination, DataTableToolbar, EmptyState, PageCard, PageHeader } from "@/components/common"
import { ViewCandidateDialog } from "@/components/features/recruitment/view-candidate-dialog"
import { Badge } from "@/components/ui/badge"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RECRUITMENT_SOURCE_LABELS } from "@/config/entities/recruitment.config"
import { ROUTES } from "@/config/routes.config"
import { useCandidates } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import type { Candidate } from "@/types/recruitment.types"
import { Eye, Mail, Phone, Plus, UserX } from "lucide-react"
import { useState } from "react"

export default function CandidatesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [viewCandidateOpen, setViewCandidateOpen] = useState(false)
  const { hasPermission } = usePermission()

  const { data, isLoading } = useCandidates({
    keyword: keyword || undefined,
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

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Ứng viên"
        description="Quản lý danh sách ứng viên và hồ sơ"
        actions={hasPermission("recruitment.intake.manage") ? (
          <Button className="rounded-full font-semibold gap-1.5" onClick={() => routerNavigate(ROUTES.RECRUITMENT.APPLICANT_INTAKE)}>
            <Plus className="h-4 w-4" />
            Tiếp nhận ứng viên
          </Button>
        ) : undefined}
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(val) => {
            setKeyword(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm kiếm theo tên, email..."
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-64 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Ứng viên</TableHead>
                <TableHead className="w-56 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Email</TableHead>
                <TableHead className="hidden md:table-cell w-40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Điện thoại</TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Nguồn</TableHead>
                <TableHead className="hidden lg:table-cell w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kinh nghiệm</TableHead>
                <TableHead className="hidden lg:table-cell min-w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Kỹ năng</TableHead>
                <TableHead className="w-28 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8">
                    <EmptyState
                      icon={UserX}
                      title={keyword ? "Không tìm thấy ứng viên phù hợp" : "Chưa có ứng viên nào"}
                      description={
                        keyword
                          ? "Không có hồ sơ ứng viên nào khớp với từ khóa tìm kiếm."
                          : "Hiện tại chưa có hồ sơ ứng viên nào được tiếp nhận vào hệ thống."
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate: Candidate) => (
                  <TableRow
                    key={candidate.id}
                    onClick={() => { handleViewDetails(candidate); }}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-muted/30"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                          <span className="text-xs font-semibold text-primary">
                            {candidate.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span
                            className="font-medium text-foreground group-hover:text-primary group-hover:underline text-left text-sm transition-colors"
                          >
                            {candidate.fullName}
                          </span>
                          {candidate.currentPosition && (
                            <p className="text-xs text-muted-foreground mt-0.5">{candidate.currentPosition}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{candidate.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3">
                      {candidate.phone ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{candidate.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {RECRUITMENT_SOURCE_LABELS[candidate.source] || candidate.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">
                      {candidate.yearsOfExperience
                        ? `${candidate.yearsOfExperience} năm`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3">
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
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-muted"
                            onClick={() => { handleViewDetails(candidate); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem chi tiết ứng viên</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AppPagination
          currentPage={page}
          totalPages={meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1}
          onPageChange={setPage}
          totalItems={meta?.total ?? candidates.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>

      <ViewCandidateDialog
        open={viewCandidateOpen}
        onOpenChange={setViewCandidateOpen}
        candidate={selectedCandidate}
      />
    </div>
  )
}
