import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { ViewOfferDialog } from "@/components/features/recruitment/view-offer-dialog"
import { Button } from "@/components/ui/button"
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

  const { data, isLoading } = useOffers({ page, pageSize })
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

  const getCandidateName = (offer: RecruitmentOffer) => {
    return offer.candidateName ?? offer.candidate?.fullName ?? "N/A"
  }

  const getCandidateEmail = (offer: RecruitmentOffer) => {
    return offer.candidateEmail ?? offer.candidate?.email ?? ""
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi })
    } catch {
      return dateStr
    }
  }

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      if (activeTab !== "all" && offer.status !== activeTab) return false

      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      const candidateName = getCandidateName(offer).toLowerCase()
      const jobTitle = (offer.jobTitle ?? "").toLowerCase()
      const department = (offer.department ?? "").toLowerCase()

      return (
        candidateName.includes(searchStr) ||
        jobTitle.includes(searchStr) ||
        department.includes(searchStr)
      )
    })
  }, [offers, activeTab, keyword])

  const columns: DataTableColumn<RecruitmentOffer>[] = useMemo(
    () => [
      {
        id: "candidate",
        header: "Ứng viên",
        minWidth: "240px",
        sticky: true,
        cell: (offer) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleViewDetails(offer)}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-semibold text-primary">
                {getCandidateName(offer).charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm group-hover:text-primary group-hover:underline transition-colors truncate">
                {getCandidateName(offer)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
                {getCandidateEmail(offer)}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "position",
        header: "Vị trí / Phòng ban",
        minWidth: "180px",
        cell: (offer) => (
          <div>
            <p className="font-medium text-foreground text-sm">{offer.jobTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{offer.department}</p>
          </div>
        ),
      },
      {
        id: "salary",
        header: "Mức lương",
        minWidth: "160px",
        cell: (offer) => (
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatCurrency(offer.offeredSalary, offer.currency)}</span>
          </div>
        ),
      },
      {
        id: "startDate",
        header: "Ngày bắt đầu",
        minWidth: "130px",
        hideBelow: "md",
        cell: (offer) => (
          <span className="text-sm text-foreground">
            {offer.startDate ? formatDate(offer.startDate) : "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        minWidth: "130px",
        cell: (offer) => (
          <StatusPill
            label={OFFER_STATUS_LABELS[offer.status] || offer.status}
            variant={statusVariantMap[offer.status]}
          />
        ),
      },
      {
        id: "response",
        header: "Phản hồi",
        minWidth: "140px",
        hideBelow: "lg",
        cell: (offer) =>
          offer.response ? (
            <StatusPill
              label={OFFER_RESPONSE_LABELS[offer.response] || offer.response}
              variant={responseVariantMap[offer.response]}
            />
          ) : (
            <span className="text-xs text-muted-foreground">Chưa phản hồi</span>
          ),
      },
      {
        id: "actions",
        header: "",
        width: "80px",
        align: "right",
        cell: (offer) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {offer.status === "draft" && hasPermission("recruitment.approve") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted h-8 w-8"
                    onClick={() => {
                      sendOffer.mutate(offer.id)
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
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
                  className="rounded-full hover:bg-muted h-8 w-8"
                  onClick={() => handleViewDetails(offer)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết offer</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [hasPermission, sendOffer],
  )

  const tabsConfig = useMemo(
    () => ({
      items: TAB_DEFINITIONS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tabCounts[tab.id] ?? 0,
      })),
      activeTab,
      onTabChange: (id: string) => {
        setActiveTab(id)
        setPage(1)
      },
    }),
    [activeTab, tabCounts],
  )

  return (
    <>
      <DataTablePage<RecruitmentOffer>
        title="Quản lý Offer"
        description="Tạo và quản lý offer cho ứng viên"
        variant="viewport"
        data={filteredOffers}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(offer) => offer.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm theo ứng viên, vị trí, phòng ban...",
        }}
        primaryAction={
          <Button
            className="rounded-full font-semibold"
            onClick={() => routerNavigate(ROUTES.RECRUITMENT.REQUISITIONS)}
            disabled={!hasPermission("recruitment.create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo offer mới
          </Button>
        }
        emptyState={{
          title:
            keyword || activeTab !== "all"
              ? "Không tìm thấy offer phù hợp với bộ lọc"
              : "Chưa có offer nào",
          description: "Hiện tại chưa có lời mời nhận việc nào trong trạng thái này.",
        }}
        pagination={{
          currentPage: page,
          totalPages: meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1,
          totalItems: meta?.total ?? filteredOffers.length,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (val) => {
            setPageSize(val)
            setPage(1)
          },
        }}
      />

      <ViewOfferDialog
        open={viewOfferOpen}
        onOpenChange={setViewOfferOpen}
        offer={selectedOffer}
      />
    </>
  )
}
