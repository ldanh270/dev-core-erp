import { DataTablePage } from "@/components/common"
import { getCandidatesColumns } from "@/components/features/recruitment/candidates-columns"
import { ViewCandidateDialog } from "@/components/features/recruitment/view-candidate-dialog"
import { ROUTES } from "@/config/routes.config"
import { useCandidatesManagement } from "@/hooks/recruitment/use-candidates-management"
import { routerNavigate } from "@/lib/router-navigator"
import type { Candidate } from "@/types/recruitment.types"

import { useMemo } from "react"

import { Plus, UserX } from "lucide-react"

/**
 * Tier 2 Page Orchestrator for Candidates directory.
 * Connects useCandidatesManagement hook with DataTablePage and ViewCandidateDialog.
 */
export default function CandidatesPage() {
  const {
    page,
    setPage,
    pageSize,
    handlePageSizeChange,
    keyword,
    handleSearch,
    candidates,
    isLoading,
    totalItems,
    totalPages,
    selectedCandidate,
    viewCandidateOpen,
    setViewCandidateOpen,
    hasPermission,
    handleViewDetails,
  } = useCandidatesManagement()

  const columns = useMemo(
    () => getCandidatesColumns({ onViewDetails: handleViewDetails }),
    [handleViewDetails],
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
          onSearch: handleSearch,
          placeholder: "Tìm kiếm theo tên, email...",
        }}
        primaryAction={
          hasPermission("recruitment.intake.manage")
            ? {
                label: "Tiếp nhận ứng viên",
                icon: Plus,
                onClick: () => {
                  routerNavigate(ROUTES.RECRUITMENT.APPLICANT_INTAKE)
                },
              }
            : undefined
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
          totalPages,
          totalItems,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: handlePageSizeChange,
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
