import { PageContainer, PageHeader } from "@/components/common"
import {
  ApplicantIntakeFileUploadCard,
  ApplicantIntakePreviewCard,
  ApplicantIntakeResultCard,
  ApplicantIntakeSourceCard,
} from "@/components/features/recruitment/ApplicantIntakeCards"
import { ROUTES } from "@/config/routes.config"
import { useApplicantIntake } from "@/hooks/recruitment/use-applicant-intake"

/**
 * Tier 2 Page Orchestrator for candidate CSV intake and source binding.
 * Connects useApplicantIntake workflow hook with preview and source configuration cards.
 */
export default function ApplicantIntakePage() {
  const {
    fileRef,
    requisitionId,
    postingId,
    source,
    setSource,
    rawCsv,
    setRawCsv,
    result,
    requisitions,
    isLoadingRequisitions,
    postings,
    isLoadingPostings,
    hasPermission,
    rows,
    validationErrors,
    choosePosting,
    handleRequisitionChange,
    readFile,
    submit,
    isImportPending,
  } = useApplicantIntake()

  const canSubmit = Boolean(
    requisitionId &&
      postingId &&
      source &&
      rows.length > 0 &&
      validationErrors.length === 0,
  )

  return (
    <PageContainer variant="default" className="flex flex-col gap-6">
      <PageHeader
        backHref={ROUTES.RECRUITMENT.CANDIDATES}
        title="Tiếp nhận ứng viên"
        description="Import hồ sơ vào đúng Yêu cầu tuyển dụng và khóa nguồn tuyển ngay khi tạo Application."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ApplicantIntakeSourceCard
          requisitionId={requisitionId}
          postingId={postingId}
          source={source}
          requisitions={requisitions}
          postings={postings}
          isLoadingRequisitions={isLoadingRequisitions}
          isLoadingPostings={isLoadingPostings}
          onRequisitionChange={handleRequisitionChange}
          onPostingChange={choosePosting}
          onSourceChange={setSource}
        />

        <ApplicantIntakeFileUploadCard
          fileRef={fileRef}
          onFileSelect={readFile}
        />
      </div>

      <ApplicantIntakePreviewCard
        rawCsv={rawCsv}
        rows={rows}
        validationErrors={validationErrors}
        canSubmit={canSubmit}
        isPending={isImportPending}
        onRawCsvChange={setRawCsv}
        onSubmit={submit}
        canManageIntake={hasPermission("recruitment.intake.manage")}
      />

      {result && <ApplicantIntakeResultCard result={result} />}
    </PageContainer>
  )
}
