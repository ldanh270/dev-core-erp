import { EmptyState, PageCard, PageContainer, PageHeader, SectionHeader } from "@/components/common"
import {
  parseApplicantCsv,
  validateApplicantRows,
} from "@/components/features/recruitment/applicant-import-parser"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  APPLICANT_IMPORT_ALLOWED_FILE_PATTERN,
  APPLICANT_IMPORT_MAX_FILE_SIZE_BYTES,
  APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL,
  POSTING_CHANNELS,
} from "@/config/entities/recruitment.config"
import { ROUTES } from "@/config/routes.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import {
  useImportApplicants,
  useJobPostings,
  useRequisitions,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import { cn } from "@/lib/utils"
import type { ApplicantImportResult } from "@/types/recruitment.types"

import { useMemo, useRef, useState } from "react"

import { FileSpreadsheet, Inbox, Upload } from "lucide-react"
import { toast } from "sonner"

const SOURCE_OPTIONS = [
  ["website", "Website"],
  ["linkedin", "LinkedIn"],
  ["facebook", "Facebook"],
  ["google_form", "Google Form"],
  ["company_website", "Website công ty"],
  ["agency", "Headhunter / Agency"],
  ["referral", "Referral nội bộ"],
  ["other", "Khác"],
] as const

export default function ApplicantIntakePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [requisitionId, setRequisitionId] = useState("")
  const [postingId, setPostingId] = useState("")
  const [source, setSource] = useState("")
  const [rawCsv, setRawCsv] = useState("fullName,email,phone,cvUrl,notes\n")
  const [result, setResult] = useState<ApplicantImportResult>()
  const { data: requisitionsData, isLoading: isLoadingRequisitions } = useRequisitions({
    status: "approved",
  })
  const requisitions = requisitionsData?.data ?? []
  const { data: postings = [], isLoading: isLoadingPostings } = useJobPostings(
    requisitionId || undefined,
  )
  const importApplicants = useImportApplicants()
  const { hasPermission } = usePermission()
  const rows = useMemo(() => parseApplicantCsv(rawCsv), [rawCsv])
  const validationErrors = useMemo(() => validateApplicantRows(rows), [rows])

  const choosePosting = (value: string) => {
    setPostingId(value)
    const posting = postings.find((item) => item.id === value)
    if (posting) setSource(posting.source)
  }
  const readFile = async (file?: File) => {
    if (!file) return
    if (!APPLICANT_IMPORT_ALLOWED_FILE_PATTERN.test(file.name)) {
      toast.error("Chỉ hỗ trợ file CSV, XLSX hoặc XLS")
      return
    }
    if (file.size > APPLICANT_IMPORT_MAX_FILE_SIZE_BYTES) {
      toast.error(`File vượt quá giới hạn ${APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL}`)
      return
    }
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      setRawCsv(XLSX.utils.sheet_to_csv(firstSheet))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setRawCsv(String(reader.result ?? ""))
    }
    reader.readAsText(file, "UTF-8")
  }
  const submit = () => {
    if (!postingId) return
    importApplicants.mutate({ requisitionId, postingId, source, rows }, { onSuccess: setResult })
  }

  return (
    <PageContainer variant="default" className="flex flex-col gap-6">
      <PageHeader
        backHref={ROUTES.RECRUITMENT.CANDIDATES}
        title="Tiếp nhận ứng viên"
        description="Import hồ sơ vào đúng Yêu cầu tuyển dụng và khóa nguồn tuyển ngay khi tạo Application."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PageCard className="min-w-0">
          <SectionHeader
            title="Nguồn hồ sơ"
            description="Chọn Yêu cầu tuyển dụng trước, sau đó chọn bài đăng để tự nhận diện nguồn."
          />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className={TYPOGRAPHY.FORM_LABEL}>Yêu cầu tuyển dụng</Label>
              {isLoadingRequisitions ? (
                <Skeleton className="h-10 w-full rounded-full" />
              ) : (
                <Select
                  value={requisitionId}
                  onValueChange={(value) => {
                    setRequisitionId(value)
                    setPostingId("")
                    setSource("")
                  }}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Chọn yêu cầu tuyển dụng" />
                  </SelectTrigger>
                  <SelectContent>
                    {requisitions.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.title} · {req.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label className={TYPOGRAPHY.FORM_LABEL}>Điểm đăng tuyển</Label>
              {isLoadingPostings ? (
                <Skeleton className="h-10 w-full rounded-full" />
              ) : (
                <Select value={postingId} onValueChange={choosePosting}>
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Không có / nhập thủ công" />
                  </SelectTrigger>
                  <SelectContent>
                    {postings.map((posting) => (
                      <SelectItem key={posting.id} value={posting.id}>
                        {POSTING_CHANNELS.find((item) => item.value === posting.channel)?.label} ·{" "}
                        {posting.sourceCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label className={TYPOGRAPHY.FORM_LABEL}>Nguồn Application</Label>
              <Select value={source} onValueChange={setSource} disabled={Boolean(postingId)}>
                <SelectTrigger className="w-full rounded-full">
                  <SelectValue placeholder="Chọn nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className={TYPOGRAPHY.FORM_HELPER}>
                Khi chọn điểm đăng, nguồn được lấy từ kênh và không thể đổi thủ công.
              </p>
            </div>
          </div>
        </PageCard>
        <PageCard>
          <SectionHeader
            title="Import Excel / CSV"
            description="Đọc sheet đầu tiên, dòng đầu là tiêu đề cột."
          />
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={(event) => void readFile(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Chọn file Excel / CSV
          </Button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Hỗ trợ CSV, XLSX, XLS tối đa {APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL}. Cột bắt buộc:{" "}
            <span className="font-mono">fullName, email</span>. Tùy chọn:{" "}
            <span className="font-mono">phone, cvUrl, notes</span>.
          </p>
        </PageCard>
      </div>
      <PageCard padding="sm" className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <SectionHeader
            title={`Dữ liệu xem trước (${rows.length} hồ sơ)`}
            description="Có thể dán trực tiếp dữ liệu CSV vào ô bên dưới."
            className="border-b-0 pb-0 mb-0"
          />
        </div>
        <div className="p-4">
          <Textarea
            value={rawCsv}
            onChange={(event) => {
              setRawCsv(event.target.value)
            }}
            className="min-h-32 font-mono text-xs rounded-xl"
          />
        </div>
        <div className="max-h-80 overflow-auto border-t border-b border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/40">
              <TableRow>
                <TableHead
                  className={cn("h-10 px-4 py-2", TYPOGRAPHY.TABLE_HEADER)}
                  style={{ width: getTableColWidthPx("TITLE") }}
                >
                  Họ tên
                </TableHead>
                <TableHead
                  className={cn("h-10 px-4 py-2", TYPOGRAPHY.TABLE_HEADER)}
                  style={{ width: getTableColWidthPx("CONTACT") }}
                >
                  Email
                </TableHead>
                <TableHead
                  className={cn("h-10 px-4 py-2", TYPOGRAPHY.TABLE_HEADER)}
                  style={{ width: getTableColWidthPx("CONTACT") }}
                >
                  Điện thoại
                </TableHead>
                <TableHead className={cn("h-10 px-4 py-2", TYPOGRAPHY.TABLE_HEADER)}>CV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-44 text-center">
                    <EmptyState
                      compact
                      icon={Inbox}
                      title="Chưa có dữ liệu ứng viên để xem trước"
                      description="Dán dữ liệu CSV vào ô phía trên hoặc chọn file Excel / CSV để tải lên."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, 50).map((row, index) => (
                  <TableRow
                    key={`${row.email}-${index}`}
                    className="transition-colors duration-100 hover:bg-muted/25"
                  >
                    <TableCell className={cn("h-[60px] px-4 py-3", TYPOGRAPHY.CELL_PRIMARY)}>
                      {row.fullName}
                    </TableCell>
                    <TableCell className={cn("h-[60px] px-4 py-3", TYPOGRAPHY.CELL_SECONDARY)}>
                      {row.email}
                    </TableCell>
                    <TableCell className={cn("h-[60px] px-4 py-3", TYPOGRAPHY.CELL_SECONDARY)}>
                      {row.phone || "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "h-[60px] px-4 py-3 max-w-52 truncate",
                        TYPOGRAPHY.CELL_SECONDARY,
                      )}
                    >
                      {row.cvUrl || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {validationErrors.length > 0 && (
          <div className="border-t border-border bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Cần sửa {validationErrors.length} lỗi trước khi import
            </p>
            <ul className="mt-2 max-h-28 overflow-auto text-xs text-destructive">
              {validationErrors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Dòng {error.row}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Mỗi dòng tạo một Candidate/Application mới trong bài đăng đã chọn; email được phép
            trùng.
          </p>
          {hasPermission("recruitment.intake.manage") && (
            <Button
              className="rounded-full"
              onClick={submit}
              disabled={
                !requisitionId ||
                !postingId ||
                !source ||
                rows.length === 0 ||
                validationErrors.length > 0 ||
                importApplicants.isPending
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              {importApplicants.isPending ? "Đang tiếp nhận..." : `Tiếp nhận ${rows.length} hồ sơ`}
            </Button>
          )}
        </div>
      </PageCard>
      {result && (
        <PageCard>
          <SectionHeader title="Kết quả import" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Result label="Tổng" value={result.total} />
            <Result label="Application mới" value={result.applicationsCreated} />
            <Result label="Candidate mới" value={result.candidatesCreated} />
            <Result label="Candidate đã match" value={result.candidatesMatched} />
            <Result label="Lỗi" value={result.failed} />
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-4 text-sm text-destructive">
              {result.errors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Dòng {error.row}: {error.message}
                </li>
              ))}
            </ul>
          )}
        </PageCard>
      )}
    </PageContainer>
  )
}

function Result({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
