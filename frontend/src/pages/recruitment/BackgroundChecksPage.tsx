import {
  DataTablePage,
  StatusPill,
  type DataTableColumn,
} from "@/components/common"
import { ViewBackgroundCheckDialog } from "@/components/features/recruitment/view-background-check-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BGC_GROUP_LABELS,
  BGC_STATUS,
  BGC_STATUS_LABELS,
} from "@/config/entities/recruitment.config"
import {
  useBackgroundChecks,
  useCompleteBackgroundCheck,
  useStartBackgroundCheck,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { BackgroundCheck } from "@/types/recruitment.types"

import { useMemo, useState } from "react"

import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { CheckCircle, Eye, Play, ShieldAlert, XCircle } from "lucide-react"

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  [BGC_STATUS.PENDING]: "warning",
  [BGC_STATUS.IN_PROGRESS]: "info",
  [BGC_STATUS.COMPLETED]: "info",
  [BGC_STATUS.PASSED]: "success",
  [BGC_STATUS.FAILED]: "danger",
}

const TAB_DEFINITIONS = [
  { id: "all", label: "Tất cả" },
  { id: BGC_STATUS.PENDING, label: BGC_STATUS_LABELS[BGC_STATUS.PENDING] || "Chờ xử lý" },
  { id: BGC_STATUS.IN_PROGRESS, label: BGC_STATUS_LABELS[BGC_STATUS.IN_PROGRESS] || "Đang kiểm tra" },
  { id: BGC_STATUS.PASSED, label: BGC_STATUS_LABELS[BGC_STATUS.PASSED] || "Đạt" },
  { id: BGC_STATUS.FAILED, label: BGC_STATUS_LABELS[BGC_STATUS.FAILED] || "Không đạt" },
]

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi })
  } catch {
    return dateStr
  }
}

export default function BackgroundChecksPage() {
  const { hasPermission } = usePermission()
  const [activeTab, setActiveTab] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedBgc, setSelectedBgc] = useState<BackgroundCheck | null>(null)
  const [viewBgcOpen, setViewBgcOpen] = useState(false)

  const handleViewDetails = (bgc: BackgroundCheck) => {
    setSelectedBgc(bgc)
    setViewBgcOpen(true)
  }

  const { data, isLoading } = useBackgroundChecks({
    status: activeTab !== "all" ? activeTab : undefined,
    page,
    pageSize,
  })
  const startBgc = useStartBackgroundCheck()
  const completeBgc = useCompleteBackgroundCheck()

  const backgroundChecks = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const tabCounts = useMemo(() => {
    const counts: Record<string, number | undefined> = { all: backgroundChecks.length }
    for (const item of backgroundChecks) {
      counts[item.status] = (counts[item.status] || 0) + 1
    }
    return counts
  }, [backgroundChecks])

  const filteredChecks = useMemo(() => {
    return backgroundChecks.filter((bgc) => {
      const searchStr = keyword.toLowerCase().trim()
      if (!searchStr) return true

      const name = (bgc.candidateName ?? "").toLowerCase()
      const email = (bgc.candidateEmail ?? "").toLowerCase()

      return name.includes(searchStr) || email.includes(searchStr)
    })
  }, [backgroundChecks, keyword])

  const canStart = hasPermission("recruitment.start_bgc")
  const canComplete = hasPermission("recruitment.complete_bgc")

  const handleStart = (id: string) => {
    startBgc.mutate(id)
  }

  const handleComplete = (id: string, passed: boolean) => {
    completeBgc.mutate({
      id,
      data: {
        passed,
        failReason: passed ? undefined : "Không đạt kiểm tra background",
      },
    })
  }

  const columns: DataTableColumn<BackgroundCheck>[] = useMemo(
    () => [
      {
        id: "candidate",
        header: "Ứng viên",
        minWidth: "240px",
        sticky: true,
        cell: (bgc) => (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { handleViewDetails(bgc); }}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-semibold text-primary">
                {bgc.candidateName?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm group-hover:text-primary group-hover:underline transition-colors truncate">
                {bgc.candidateName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-48">
                {bgc.candidateEmail}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "group",
        header: "Nhóm kiểm tra",
        minWidth: "140px",
        cell: (bgc) => (
          <Badge variant="outline" className="rounded-full text-[11px] font-normal">
            {BGC_GROUP_LABELS[bgc.group] || bgc.group}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        minWidth: "130px",
        cell: (bgc) => (
          <StatusPill
            label={BGC_STATUS_LABELS[bgc.status] || bgc.status}
            variant={statusVariantMap[bgc.status]}
          />
        ),
      },
      {
        id: "checks",
        header: "Hạng mục xác minh",
        minWidth: "240px",
        cell: (bgc) => {
          const hasIdVerification = bgc.idVerified !== null && bgc.idVerified !== undefined
          const hasAddressVerification =
            bgc.addressVerified !== null && bgc.addressVerified !== undefined
          const hasCriminalCheck =
            bgc.criminalRecordCheck !== null && bgc.criminalRecordCheck !== undefined

          return (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                {hasIdVerification ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
                <span className="text-xs text-muted-foreground">CCCD</span>
              </div>
              <div className="flex items-center gap-1">
                {hasAddressVerification ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
                <span className="text-xs text-muted-foreground">Địa chỉ</span>
              </div>
              <div className="flex items-center gap-1">
                {hasCriminalCheck ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                )}
                <span className="text-xs text-muted-foreground">LLTP</span>
              </div>
            </div>
          )
        },
      },
      {
        id: "startedAt",
        header: "Bắt đầu",
        minWidth: "120px",
        hideBelow: "md",
        cell: (bgc) => (
          <span className="text-sm text-muted-foreground">{formatDate(bgc.startedAt)}</span>
        ),
      },
      {
        id: "completedAt",
        header: "Hoàn tất",
        minWidth: "120px",
        hideBelow: "md",
        cell: (bgc) => (
          <span className="text-sm text-muted-foreground">{formatDate(bgc.completedAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: "120px",
        align: "right",
        cell: (bgc) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(e) => { e.stopPropagation(); }}
          >
            {bgc.status === BGC_STATUS.PENDING && canStart && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted h-8 w-8"
                    onClick={() => { handleStart(bgc.id); }}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bắt đầu kiểm tra</TooltipContent>
              </Tooltip>
            )}
            {bgc.status === BGC_STATUS.IN_PROGRESS && canComplete && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-muted h-8 w-8"
                      onClick={() => { handleComplete(bgc.id, true); }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xác nhận Đạt</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-muted h-8 w-8"
                      onClick={() => { handleComplete(bgc.id, false); }}
                    >
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xác nhận Không đạt</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted h-8 w-8"
                  onClick={() => { handleViewDetails(bgc); }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết kiểm tra</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [canStart, canComplete, startBgc, completeBgc],
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
      <DataTablePage<BackgroundCheck>
        title="Kiểm tra Background"
        description="Kiểm tra được tạo tự động sau khi ứng viên chấp nhận offer. Tại đây chỉ theo dõi và xử lý kiểm tra."
        variant="viewport"
        data={filteredChecks}
        columns={columns}
        isLoading={isLoading}
        tabs={tabsConfig}
        keyExtractor={(bgc) => bgc.id}
        search={{
          value: keyword,
          onSearch: (val: string) => {
            setKeyword(val)
            setPage(1)
          },
          placeholder: "Tìm theo tên ứng viên, email...",
        }}
        emptyState={{
          icon: ShieldAlert,
          title: "Chưa có hồ sơ kiểm tra",
          description: "Hiện tại không có hồ sơ kiểm tra background nào phù hợp với bộ lọc.",
        }}
        pagination={{
          currentPage: page,
          totalPages: meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1,
          totalItems: meta?.total ?? filteredChecks.length,
          itemsPerPage: pageSize,
          onPageChange: setPage,
          onItemsPerPageChange: (val) => {
            setPageSize(val)
            setPage(1)
          },
        }}
      />

      <ViewBackgroundCheckDialog
        open={viewBgcOpen}
        onOpenChange={setViewBgcOpen}
        backgroundCheck={selectedBgc}
      />
    </>
  )
}
