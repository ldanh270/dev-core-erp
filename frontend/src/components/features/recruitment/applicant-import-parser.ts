import type { ApplicantImportRow } from "@/types/recruitment.types"

const APPLICANT_FIELDS = ["fullName", "email", "phone", "cvUrl", "notes"] as const
type ApplicantField = (typeof APPLICANT_FIELDS)[number]

function isApplicantField(value: string | undefined): value is ApplicantField {
  return APPLICANT_FIELDS.some((field) => field === value)
}

const COLUMN_ALIASES: Record<string, keyof ApplicantImportRow> = {
  fullname: "fullName",
  "họ tên": "fullName",
  "ho ten": "fullName",
  name: "fullName",
  email: "email",
  phone: "phone",
  "số điện thoại": "phone",
  "so dien thoai": "phone",
  cvurl: "cvUrl",
  cv: "cvUrl",
  notes: "notes",
  "ghi chú": "notes",
  "ghi chu": "notes",
}

function parseDelimitedRows(value: string): string[][] {
  const delimiter = value.split(/\r?\n/, 1)[0]?.includes(";") ? ";" : ","
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charAt(index)
    if (char === '"' && quoted && value[index + 1] === '"') {
      cell += '"'
      index += 1
      continue
    }
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === delimiter && !quoted) {
      row.push(cell.trim())
      cell = ""
      continue
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && value[index + 1] === "\n") index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ""
      continue
    }
    cell += char
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

export function parseApplicantCsv(value: string): ApplicantImportRow[] {
  const rows = parseDelimitedRows(value.replace(/^\uFEFF/, ""))
  if (rows.length < 2) return []
  const headers = rows[0].map(
    (header) =>
      new Map(Object.entries(COLUMN_ALIASES)).get(header.trim().toLowerCase()) ||
      header.trim().toLowerCase(),
  )
  return rows.slice(1).map((cells) => {
    const row: Partial<ApplicantImportRow> = {}
    cells.forEach((cell, index) => {
      // eslint-disable-next-line security/detect-object-injection
      const key = headers[index]
      if (isApplicantField(key)) {
        Object.defineProperty(row, key, {
          value: cell,
          enumerable: true,
          writable: true,
          configurable: true,
        })
      }
    })
    return row
  }) as ApplicantImportRow[]
}

export function validateApplicantRows(
  rows: ApplicantImportRow[],
): Array<{ row: number; message: string }> {
  const errors: Array<{ row: number; message: string }> = []
  rows.forEach((row, index) => {
    if (!row.fullName?.trim()) errors.push({ row: index + 2, message: "Thiếu họ tên" })
    if (!row.email?.trim()) errors.push({ row: index + 2, message: "Thiếu email" })
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
      errors.push({ row: index + 2, message: "Email không hợp lệ" })
  })
  return errors
}
