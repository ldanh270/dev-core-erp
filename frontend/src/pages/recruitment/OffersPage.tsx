import { AppPagination, DataTableToolbar, PageCard, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { ViewOfferDialog } from "@/components/features/recruitment/view-offer-dialog"
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
import {
  CURRENCY,
  OFFER_RESPONSE,
  OFFER_RESPONSE_LABELS,
  OFFER_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import { ROUTES } from "@/config/routes.config"
import { useOffers, useSendOffer } from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { routerNavigate } from "@/lib/router-navigator"
import type { RecruitmentOffer } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { DollarSign, Eye, Plus, Send } from "lucide-react"

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  draft: "neutral",
  pending_review: "warning",
  sent: "info",
  viewed: "info",
  accepted: "success",
  declined: "danger",
  negotiating: "warning",
  expired: "neutral",
  rescinded: "danger",
  withdrawn: "neutral",
}

const responseVariantMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  [OFFER_RESPONSE.ACCEPT]: "success",
  [OFFER_RESPONSE.DECLINE]: "danger",
  [OFFER_RESPONSE.NEGOTIATE]: "warning",
}

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: "draft", label: "Nháp" },
  { id: "pending_review", label: "Chờ duyệt" },
  { id: "sent", label: "Đã gửi" },
  { id: "accepted", label: "Chấp nhận" },
  { id: "declined", label: "Từ chối" },
]

const formatCurrency = (amount: number, currency: string = CURRENCY.VND) => {
  if (currency === CURRENCY.VND) {
    return `${amount.toLocaleString("vi-VN")} VNĐ`
  }
  return `${amount.toLocaleString()} ${currency}`
}

export default function OffersPage() {
  const { hasPermission } = usePermission()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedOffer, setSelectedOffer] = useState<RecruitmentOffer | null>(null)
  const [viewOfferOpen, setViewOfferOpen] = useState(false)

  const handleViewDetails = (offer: RecruitmentOffer) => {
    setSelectedOffer(offer)
    setViewOfferOpen(true)
  }

  const { data, isLoading, isError, refetch } = useOffers({ page, pageSize })
  const sendOffer = useSendOffer()

  const offers = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: offers.length }
    for (const offer of offers) {
      counts[offer.status] = (counts[offer.status] || 0) + 1
    }
    return counts
  }, [offers])

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (activeTab !== "all" && offer.status !== activeTab) return false

      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      const candidateName = (offer.candidateName ?? offer.candidate?.fullName ?? "").toLowerCase()
      const jobTitle = (offer.jobTitle ?? "").toLowerCase()
      const department = (offer.department ?? "").toLowerCase()

      return (
        candidateName.includes(searchStr) ||
        jobTitle.includes(searchStr) ||
        department.includes(searchStr)
      )
    })
  }, [offers, activeTab, keyword])

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi })
    } catch {
      return dateStr
    }
  }

  const getCandidateName = (offer: RecruitmentOffer) => {
    return offer.candidateName ?? offer.candidate?.fullName ?? "N/A"
  }

  const getCandidateEmail = (offer: RecruitmentOffer) => {
    return offer.candidateEmail ?? offer.candidate?.email ?? ""
  }

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Quản lý Offer"
        description="Tạo và quản lý offer cho ứng viên"
        actions={
          <Button
            className="rounded-full"
            onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            disabled={!hasPermission("recruitment.create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo offer mới
          </Button>
        }
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <nav
          aria-label="Lọc theo trạng thái offer"
          className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id] || 0
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            )
          })}
        </nav>

        <DataTableToolbar
          searchQuery={keyword}
          onSearchChange={(val) => {
            setKeyword(val)
            setPage(1)
          }}
          searchPlaceholder="Tìm theo ứng viên, vị trí, phòng ban..."
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-64 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Ứng viên
                </TableHead>
                <TableHead className="min-w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Vị trí / Phòng ban
                </TableHead>
                <TableHead className="w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Mức lương
                </TableHead>
                <TableHead className="hidden md:table-cell w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Ngày bắt đầu
                </TableHead>
                <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Trạng thái
                </TableHead>
                <TableHead className="hidden lg:table-cell w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Phản hồi
                </TableHead>
                <TableHead className="w-28 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                  Thao tác
                </TableHead>
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
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <p className="font-medium text-destructive">Không tải được danh sách offer.</p>
                    <Button
                      variant="outline"
                      className="mt-3 rounded-full"
                      onClick={() => void refetch()}
                    >
                      Thử lại
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredOffers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {keyword || activeTab !== "all"
                      ? "Không tìm thấy offer phù hợp với bộ lọc"
                      : "Chưa có offer nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOffers.map((offer: RecruitmentOffer) => (
                  <TableRow
                    key={offer.id}
                    onClick={() => {
                      handleViewDetails(offer)
                    }}
                    className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {getCandidateName(offer).charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {getCandidateName(offer)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getCandidateEmail(offer)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">{offer.jobTitle}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{offer.department}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatCurrency(offer.offeredSalary, offer.currency)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-4 py-3 text-sm">
                      {offer.startDate ? formatDate(offer.startDate) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusPill
                        label={OFFER_STATUS_LABELS[offer.status] || offer.status}
                        variant={statusVariantMap[offer.status]}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell px-4 py-3">
                      {offer.response ? (
                        <StatusPill
                          label={OFFER_RESPONSE_LABELS[offer.response] || offer.response}
                          variant={responseVariantMap[offer.response]}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Chưa phản hồi</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {offer.status === "draft" && hasPermission("recruitment.approve") && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full hover:bg-muted"
                                onClick={() => {
                                  sendOffer.mutate(offer.id)
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Gửi offer cho ứng viên</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-muted"
                              onClick={() => {
                                handleViewDetails(offer)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xem chi tiết offer</TooltipContent>
                        </Tooltip>
                      </div>
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
          totalItems={meta?.total ?? filteredOffers.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>

      <ViewOfferDialog open={viewOfferOpen} onOpenChange={setViewOfferOpen} offer={selectedOffer} />
    </div>
  )
}
