import { PageCard, SectionHeader } from "@/components/common"
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
  APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL,
  POSTING_CHANNELS,
} from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import { SOURCE_OPTIONS } from "@/hooks/recruitment/use-applicant-intake"
import { cn } from "@/lib/utils"
import type {
  ApplicantImportResult,
  ApplicantImportRow,
  JobPosting,
  JobRequisition,
} from "@/types/recruitment.types"
import { FileSpreadsheet, Inbox, Upload } from "lucide-react"
import type { RefObject } from "react"

/**
 * Displays summary metric tile with count and title.
 */
export function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

/**
 * Pure UI presenter rendering batch applicant import outcome metrics and error lists.
 */
export function ApplicantIntakeResultCard({ result }: { result: ApplicantImportResult }) {
  return (
    <PageCard>
      <SectionHeader title="Kết quả import" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <ResultMetric label="Tổng" value={result.total} />
        <ResultMetric label="Application mới" value={result.applicationsCreated} />
        <ResultMetric label="Candidate mới" value={result.candidatesCreated} />
        <ResultMetric label="Candidate đã match" value={result.candidatesMatched} />
        <ResultMetric label="Lỗi" value={result.failed} />
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
  )
}

/**
 * Pure UI presenter rendering file upload dropzone and format instructions.
 */
export function ApplicantIntakeFileUploadCard({
  fileRef,
  onFileSelect,
}: {
  fileRef: RefObject<HTMLInputElement | null>
  onFileSelect: (file?: File) => void
}) {
  return (
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
        onChange={(event) => void onFileSelect(event.target.files?.[0])}
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
  )
}

/**
 * Pure UI presenter rendering requisition and posting channel selectors.
 */
export function ApplicantIntakeSourceCard({
  requisitionId,
  postingId,
  source,
  requisitions,
  postings,
  isLoadingRequisitions,
  isLoadingPostings,
  onRequisitionChange,
  onPostingChange,
  onSourceChange,
}: {
  requisitionId: string
  postingId: string
  source: string
  requisitions: JobRequisition[]
  postings: JobPosting[]
  isLoadingRequisitions: boolean
  isLoadingPostings: boolean
  onRequisitionChange: (value: string) => void
  onPostingChange: (value: string) => void
  onSourceChange: (value: string) => void
}) {
  return (
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
            <Select value={requisitionId} onValueChange={onRequisitionChange}>
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
            <Select value={postingId} onValueChange={onPostingChange}>
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
          <Select value={source} onValueChange={onSourceChange} disabled={Boolean(postingId)}>
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
  )
}

/**
 * Pure UI presenter rendering raw CSV preview textarea, parsed applicant table, and submission trigger.
 */
export function ApplicantIntakePreviewCard({
  rawCsv,
  rows,
  validationErrors,
  canSubmit,
  isPending,
  onRawCsvChange,
  onSubmit,
  canManageIntake,
}: {
  rawCsv: string
  rows: ApplicantImportRow[]
  validationErrors: Array<{ row: number; message: string }>
  canSubmit: boolean
  isPending: boolean
  onRawCsvChange: (value: string) => void
  onSubmit: () => void
  canManageIntake: boolean
}) {
  return (
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
          onChange={(event) => onRawCsvChange(event.target.value)}
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
              <TableHead
                className={cn("h-10 px-4 py-2", TYPOGRAPHY.TABLE_HEADER)}
                style={{ width: getTableColWidthPx("TITLE") }}
              >
                CV URL
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  <Inbox className="mx-auto mb-2 h-6 w-6 opacity-40" />
                  Chưa có dữ liệu hợp lệ để hiển thị
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
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
          Mỗi dòng tạo một Candidate/Application mới trong bài đăng đã chọn; email được phép trùng.
        </p>
        {canManageIntake && (
          <Button className="rounded-full" onClick={onSubmit} disabled={!canSubmit || isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {isPending ? "Đang tiếp nhận..." : `Tiếp nhận ${rows.length} hồ sơ`}
          </Button>
        )}
      </div>
    </PageCard>
  )
}
