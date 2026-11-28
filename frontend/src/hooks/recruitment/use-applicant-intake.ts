import {
  parseApplicantCsv,
  validateApplicantRows,
} from "@/components/features/recruitment/applicant-import-parser"
import {
  APPLICANT_IMPORT_ALLOWED_FILE_PATTERN,
  APPLICANT_IMPORT_MAX_FILE_SIZE_BYTES,
  APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL,
} from "@/config/entities/recruitment.config"
import { RECRUITMENT_MESSAGES } from "@/config/messages/recruitment.message"
import {
  useImportApplicants,
  useJobPostings,
  useRequisitions,
} from "@/hooks/recruitment/use-recruitment-queries"
import { usePermission } from "@/hooks/use-permission"
import type { ApplicantImportResult } from "@/types/recruitment.types"

import { useCallback, useMemo, useRef, useState } from "react"

import { toast } from "sonner"

const { ERRORS: RECRUIT_ERRORS } = RECRUITMENT_MESSAGES

export const SOURCE_OPTIONS = [
  ["website", "Website"],
  ["linkedin", "LinkedIn"],
  ["facebook", "Facebook"],
  ["google_form", "Google Form"],
  ["company_website", "Website công ty"],
  ["agency", "Headhunter / Agency"],
  ["referral", "Referral nội bộ"],
  ["other", "Khác"],
] as const

export function useApplicantIntake() {
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

  const choosePosting = useCallback(
    (value: string) => {
      setPostingId(value)
      const posting = postings.find((item) => item.id === value)
      if (posting) setSource(posting.source)
    },
    [postings],
  )

  const handleRequisitionChange = useCallback((value: string) => {
    setRequisitionId(value)
    setPostingId("")
    setSource("")
  }, [])

  const readFile = useCallback(async (file?: File) => {
    if (!file) return
    if (!APPLICANT_IMPORT_ALLOWED_FILE_PATTERN.test(file.name)) {
      toast.error(RECRUIT_ERRORS.FILE_FORMAT_UNSUPPORTED)
      return
    }
    if (file.size > APPLICANT_IMPORT_MAX_FILE_SIZE_BYTES) {
      toast.error(RECRUIT_ERRORS.FILE_SIZE_EXCEEDED(APPLICANT_IMPORT_MAX_FILE_SIZE_LABEL))
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
  }, [])

  const submit = useCallback(() => {
    if (!postingId) return
    importApplicants.mutate({ requisitionId, postingId, source, rows }, { onSuccess: setResult })
  }, [postingId, importApplicants, requisitionId, source, rows])

  return {
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
    isImportPending: importApplicants.isPending,
  }
}
