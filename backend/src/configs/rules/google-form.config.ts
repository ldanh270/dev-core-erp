export const GOOGLE_FORM_FIELD_TYPE = {
  SHORT_TEXT: "short_text",
  PARAGRAPH: "paragraph",
} as const

export const GOOGLE_FORM_FIELD_TYPES = Object.values(GOOGLE_FORM_FIELD_TYPE) as [
  (typeof GOOGLE_FORM_FIELD_TYPE)[keyof typeof GOOGLE_FORM_FIELD_TYPE],
  ...(typeof GOOGLE_FORM_FIELD_TYPE)[keyof typeof GOOGLE_FORM_FIELD_TYPE][],
]

export interface GoogleFormFieldDefinition {
  key: string
  label: string
  type: (typeof GOOGLE_FORM_FIELD_TYPES)[number]
  required: boolean
}

export const GOOGLE_FORM_QUESTION_PREFIX = "devcore_"
export const GOOGLE_FORM_SOURCE_CODE_PREFIX = "GFORM"

export const GOOGLE_FORM_DEFAULT_FIELDS: readonly GoogleFormFieldDefinition[] = [
  { key: "full_name", label: "Họ và tên", type: "short_text", required: true },
  { key: "email", label: "Email", type: "short_text", required: true },
  { key: "phone", label: "Số điện thoại", type: "short_text", required: false },
  { key: "cv_url", label: "Đường dẫn CV", type: "short_text", required: false },
] as const

export const googleFormQuestionId = (key: string) => `${GOOGLE_FORM_QUESTION_PREFIX}${key}`
