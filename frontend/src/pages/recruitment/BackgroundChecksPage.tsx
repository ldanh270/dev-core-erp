import { useMemo, useState } from "react"
import { AppPagination, DataTableToolbar, PageCard, PageContainer, PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { ViewBackgroundCheckDialog } from "@/components/features/recruitment/view-background-check-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useBackgroundChecks,
  useStartBackgroundCheck,
  useCompleteBackgroundCheck,
} from "@/hooks/recruitment/use-recruitment-queries"
import {
  BGC_STATUS_LABELS,
  BGC_GROUP_LABELS,
  BGC_STATUS,
} from "@/config/entities/recruitment.config"
import type { BackgroundCheck } from "@/types/recruitment.types"
import {
  CheckCircle,
  XCircle,
  Eye,
  Play,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { usePermission } from "@/hooks/use-permission"

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

interface BackgroundCheckRowProps {
  bgc: BackgroundCheck
  onStart: () => void
  onComplete: (passed: boolean) => void
  onViewDetails: (bgc: BackgroundCheck) => void
  canStart: boolean
  canComplete: boolean
}

function BackgroundCheckRow({ bgc, onStart, onComplete, onViewDetails, canStart, canComplete }: BackgroundCheckRowProps) {
  const hasIdVerification = bgc.idVerified !== null && bgc.idVerified !== undefined
  const hasAddressVerification = bgc.addressVerified !== null && bgc.addressVerified !== undefined
  const hasCriminalCheck = bgc.criminalRecordCheck !== null && bgc.criminalRecordCheck !== undefined

  return (
    <TableRow className="transition-colors duration-100 hover:bg-muted/25">
      <TableCell className="h-[60px] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {bgc.candidateName?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{bgc.candidateName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{bgc.candidateEmail}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3">
        <Badge variant="outline" className="rounded-full text-[11px]">{BGC_GROUP_LABELS[bgc.group] || bgc.group}</Badge>
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3">
        <StatusPill
          label={BGC_STATUS_LABELS[bgc.status] || bgc.status}
          variant={statusVariantMap[bgc.status]}
        />
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            {hasIdVerification ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">CCCD</span>
          </div>
          <div className="flex items-center gap-1">
            {hasAddressVerification ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">Địa chỉ</span>
          </div>
          <div className="flex items-center gap-1">
            {hasCriminalCheck ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
            )}
            <span className="text-xs">LLHP</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="h-[60px] hidden md:table-cell px-4 py-3 text-sm">{formatDate(bgc.startedAt)}</TableCell>
      <TableCell className="h-[60px] hidden md:table-cell px-4 py-3 text-sm">{formatDate(bgc.completedAt)}</TableCell>
      <TableCell className="hidden lg:table-cell px-4 py-3">
        {bgc.failReason ? (
          <p className="text-xs text-destructive max-w-[150px] truncate" title={bgc.failReason}>
            {bgc.failReason}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="h-[60px] px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {bgc.status === BGC_STATUS.PENDING && canStart && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted"
                  onClick={onStart}
                >
                  <Play className="h-4 w-4" />
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
                    className="rounded-full hover:bg-muted"
                    onClick={() => { onComplete(true); }}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Xác nhận Đạt</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted"
                    onClick={() => { onComplete(false); }}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
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
                className="rounded-full hover:bg-muted"
                onClick={() => { onViewDetails(bgc); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết kiểm tra</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
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

  const { data, isLoading, isError, refetch } = useBackgroundChecks({
    status: activeTab !== "all" ? activeTab : undefined,
    page,
    pageSize,
  })
  const startBgc = useStartBackgroundCheck()
  const completeBgc = useCompleteBackgroundCheck()

  const backgroundChecks = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: backgroundChecks.length }
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

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Kiểm tra Background"
        description="Kiểm tra được tạo tự động sau khi ứng viên chấp nhận offer. Tại đây chỉ theo dõi và xử lý kiểm tra."
      />

      <PageCard padding="sm" className="p-0 overflow-hidden">
        {/* Status Tab Navigation */}
        <nav
          aria-label="Lọc theo trạng thái kiểm tra"
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
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
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
          searchPlaceholder="Tìm theo tên ứng viên, email..."
        />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-64 px-4 py-2">Ứng viên</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-36 px-4 py-2">Nhóm</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-36 px-4 py-2">Trạng thái</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-44 px-4 py-2">Xác minh</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell w-36 px-4 py-2">Ngày bắt đầu</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell w-36 px-4 py-2">Ngày hoàn thành</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-44 px-4 py-2">Lý do thất bại</TableHead>
                <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-32 px-4 py-2 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} className="p-3">
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><p className="font-medium text-destructive">Không tải được danh sách kiểm tra.</p><Button variant="outline" className="mt-3 rounded-full" onClick={() => void refetch()}>Thử lại</Button></TableCell></TableRow>
              ) : filteredChecks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {keyword || activeTab !== "all" ? "Không tìm thấy kết quả phù hợp với bộ lọc" : "Chưa có kiểm tra background nào"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredChecks.map((bgc: BackgroundCheck) => (
                  <BackgroundCheckRow
                    key={bgc.id}
                    bgc={bgc}
                    onStart={() => { handleStart(bgc.id); }}
                    onComplete={(passed) => { handleComplete(bgc.id, passed); }}
                    onViewDetails={handleViewDetails}
                    canStart={hasPermission("recruitment.update")}
                    canComplete={hasPermission("recruitment.approve")}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AppPagination
          currentPage={page}
          totalPages={meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1}
          onPageChange={setPage}
          totalItems={meta?.total ?? filteredChecks.length}
          itemsPerPage={pageSize}
          onItemsPerPageChange={(val) => {
            setPageSize(val)
            setPage(1)
          }}
        />
      </PageCard>

      <ViewBackgroundCheckDialog
        open={viewBgcOpen}
        onOpenChange={setViewBgcOpen}
        backgroundCheck={selectedBgc}
      />
    </PageContainer>
  )
}
