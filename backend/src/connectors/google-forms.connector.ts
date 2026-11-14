import {
  GOOGLE_FORM_DEFAULT_FIELDS,
  type GoogleFormFieldDefinition,
  googleFormQuestionId,
} from "@/configs/rules/google-form.config"
import { HttpStatusCode } from "@/configs/system/http.config"
import { jobPostingRepository } from "@/repositories/job-posting.repository"
import { googleFormFieldSchema, intakeRowSchema } from "@/schemas/recruitment.schema"
import type { RecruitmentConnector } from "@/services/job-posting.service"
import { recruitmentOAuthAccountService } from "@/services/recruitment-oauth-account.service"
import type {
  ConnectorIntakeRow,
  ConnectorRowError,
  ConnectorSyncResult,
} from "@/types/recruitment-connector.types"
import { decryptCredential } from "@/utils/credential-encryption.util"
import { AppError } from "@/utils/error.util"

interface GoogleOAuthCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

const LAYER = "GoogleFormsConnector"
const FORMS_API = "https://forms.googleapis.com/v1/forms"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

export const GOOGLE_FORM_QUESTION_IDS = {
  FULL_NAME: googleFormQuestionId("full_name"),
  EMAIL: googleFormQuestionId("email"),
  PHONE: googleFormQuestionId("phone"),
  CV_URL: googleFormQuestionId("cv_url"),
  NOTES: googleFormQuestionId("notes"),
} as const

interface GoogleForm {
  formId: string
  responderUri?: string
  items?: Array<{
    itemId?: string
    title?: string
    questionItem?: {
      question?: {
        questionId?: string
      }
    }
  }>
}

interface GoogleAnswer {
  textAnswers?: { answers?: Array<{ value?: string }> }
  fileUploadAnswers?: { answers?: Array<{ fileId?: string }> }
}

interface GoogleFormResponse {
  responseId?: string
  respondentEmail?: string
  answers?: Record<string, GoogleAnswer>
}

interface GoogleResponsesPage {
  responses?: GoogleFormResponse[]
  nextPageToken?: string
}

type PostingRepository = Pick<
  typeof jobPostingRepository,
  "findById" | "storeConnectorExternalId" | "updateFieldQuestionIds"
>

export class GoogleFormsConnector implements RecruitmentConnector {
  private readonly oauthService = recruitmentOAuthAccountService

  constructor(
    private readonly fetchFn: typeof fetch = fetch,
    private readonly postingRepository: PostingRepository = jobPostingRepository,
  ) {}

  async publish(postingId: string): Promise<{ externalId: string; postingUrl: string }> {
    const posting = await this.postingRepository.findById(postingId)
    if (!posting || posting.channel !== "google_form") {
      throw new AppError(
        "Bài đăng Google Form không tồn tại",
        HttpStatusCode.NOT_FOUND,
        LAYER,
        "GOOGLE_FORM_POSTING_NOT_FOUND",
      )
    }

    const config = await this.requireConfig(posting)
    const token = await this.getAccessToken(config)
    let formId = posting.externalId
    let existingItems: GoogleForm["items"] = []
    if (!formId) {
      const created = await this.request<GoogleForm>(token, FORMS_API, {
        method: "POST",
        body: JSON.stringify({
          info: { title: posting.requisition.title },
        }),
      })
      formId = created.formId
      await this.postingRepository.storeConnectorExternalId(postingId, formId)
    } else {
      const existing = await this.request<GoogleForm>(token, `${FORMS_API}/${formId}`)
      existingItems = existing.items
    }

    const existingTitles = new Set(
      (existingItems ?? [])
        .map((item) => item.title?.trim())
        .filter((t): t is string => Boolean(t)),
    )
    const fields = this.postingFields(posting)
    const description = this.buildDescription(posting.requisition)
    const requests: Array<Record<string, unknown>> = [
      {
        updateFormInfo: {
          info: { title: posting.requisition.title, description },
          updateMask: "title,description",
        },
      },
      ...this.questionRequests(fields, existingTitles),
    ]
    await this.request(token, `${FORMS_API}/${formId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ includeFormInResponse: false, requests }),
    })
    await this.request(token, `${FORMS_API}/${formId}:setPublishSettings`, {
      method: "POST",
      body: JSON.stringify({
        publishSettings: {
          publishState: { isPublished: true, isAcceptingResponses: true },
        },
      }),
    })
    const published = await this.request<GoogleForm>(token, `${FORMS_API}/${formId}`)
    if (!published.responderUri) {
      throw this.apiError("Google Forms không trả về đường dẫn ứng tuyển")
    }
    const mappings = this.questionIdMappings(fields, published.items ?? [])
    if (mappings.length > 0) {
      await this.postingRepository.updateFieldQuestionIds(postingId, mappings)
    }
    return { externalId: formId, postingUrl: published.responderUri }
  }

  async sync(postingId: string): Promise<ConnectorSyncResult> {
    const posting = await this.postingRepository.findById(postingId)
    if (!posting || posting.channel !== "google_form") {
      throw new AppError(
        "Bài đăng Google Form không tồn tại",
        HttpStatusCode.NOT_FOUND,
        LAYER,
        "GOOGLE_FORM_POSTING_NOT_FOUND",
      )
    }
    if (!posting.externalId) {
      throw new AppError(
        "Google Form chưa được xuất bản",
        HttpStatusCode.CONFLICT,
        LAYER,
        "GOOGLE_FORM_NOT_PUBLISHED",
      )
    }

    const config = await this.requireConfig(posting)
    const token = await this.getAccessToken(config)
    const form = await this.request<GoogleForm>(token, `${FORMS_API}/${posting.externalId}`)
    const fields = this.postingFields(posting)

    const questionIdMap = new Map(
      posting.fieldSnapshots.flatMap((field) =>
        field.externalQuestionId ? [[field.fieldKey, field.externalQuestionId] as const] : [],
      ),
    )
    for (const item of form.items ?? []) {
      const qId = item.questionItem?.question?.questionId
      const title = item.title?.trim()
      if (!qId || !title) continue
      const matchedField = fields.find((field) => this.matchesField(field, title))
      if (matchedField) {
        questionIdMap.set(matchedField.key, qId)
      }
    }
    const learnedMappings = posting.fieldSnapshots.flatMap((field) => {
      if (field.externalQuestionId) return []
      const externalQuestionId = questionIdMap.get(field.fieldKey)
      return externalQuestionId ? [{ fieldKey: field.fieldKey, externalQuestionId }] : []
    })
    if (learnedMappings.length > 0) {
      await this.postingRepository.updateFieldQuestionIds(postingId, learnedMappings)
    }

    const responses: GoogleFormResponse[] = []
    let pageToken: string | undefined
    do {
      const query = new URLSearchParams({ pageSize: "500" })
      if (pageToken) query.set("pageToken", pageToken)
      const page = await this.request<GoogleResponsesPage>(
        token,
        `${FORMS_API}/${posting.externalId}/responses?${query.toString()}`,
      )
      responses.push(...(page.responses ?? []))
      pageToken = page.nextPageToken
    } while (pageToken)

    const rows: ConnectorIntakeRow[] = []
    const errors: ConnectorRowError[] = []
    for (const [index, response] of responses.entries()) {
      const responseId = response.responseId?.trim()
      const responseData = Object.fromEntries(
        fields.map((field) => {
          const qId = questionIdMap.get(field.key)
          return [field.key, qId ? this.text(response, qId) : ""]
        }),
      )
      const cvQId = questionIdMap.get("cv_url")
      const raw = {
        fullName: responseData.full_name ?? "",
        email: (responseData.email || response.respondentEmail || "").toLowerCase(),
        phone: responseData.phone || undefined,
        cvUrl: cvQId ? this.cvUrl(response, cvQId) : undefined,
        notes: responseData.notes || undefined,
      }
      const parsed = intakeRowSchema.safeParse(raw)
      if (!responseId || !parsed.success) {
        const validationMessage = parsed.success
          ? ""
          : parsed.error?.issues.map((issue: { message: string }) => issue.message).join("; ")
        errors.push({
          row: index + 1,
          email: raw.email,
          code: "INVALID_GOOGLE_FORM_RESPONSE",
          message: responseId
            ? validationMessage || "Dữ liệu Google Form không hợp lệ"
            : "Google response không có responseId",
          sourceRef: responseId ?? `row-${index + 1}`,
          responseData,
        })
        continue
      }
      rows.push({ ...parsed.data, externalResponseId: responseId, responseData })
    }
    return { rows, errors, totalFetched: responses.length }
  }

  private async requireConfig(posting: {
    id?: string
    oauthAccountId: string | null
    oauthAccount?: { clientId: string; clientSecret: string; refreshToken: string } | null
  }): Promise<GoogleOAuthCredentials> {
    // Try to use the OAuth account directly linked to the posting first
    const oauthAccount = posting.oauthAccount
    if (oauthAccount?.clientId && oauthAccount.clientSecret && oauthAccount.refreshToken) {
      return {
        clientId: oauthAccount.clientId,
        clientSecret: decryptCredential(oauthAccount.clientSecret),
        refreshToken: decryptCredential(oauthAccount.refreshToken),
      }
    }

    throw new AppError(
      "Bài đăng chưa được gắn tài khoản OAuth. Hãy chọn đúng tài khoản của bạn rồi thử lại.",
      HttpStatusCode.CONFLICT,
      LAYER,
      "CONNECTOR_NOT_CONFIGURED",
    )
  }

  private async getAccessToken(config: GoogleOAuthCredentials): Promise<string> {
    const response = await this.fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    })
    if (!response.ok) {
      const errDetail = await response.text().catch(() => "")
      throw this.apiError("Không thể xác thực Google Forms")
    }
    const body = (await response.json()) as { access_token?: string }
    if (!body.access_token) throw this.apiError("Google OAuth không trả về access token")
    return body.access_token
  }

  private async request<T = unknown>(token: string, url: string, init?: RequestInit): Promise<T> {
    let response: Response
    try {
      response = await this.fetchFn(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
      })
    } catch {
      // Re-throw as typed error when network is unreachable.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      throw this.apiError("Không thể kết nối Google Forms")
    }
    if (!response.ok) {
      let detail = ""
      try {
        const body = (await response.json()) as { error?: { message?: string } }
        detail = body.error?.message ? `: ${body.error.message}` : ""
      } catch {
        // Do not leak raw upstream responses.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      }
      throw this.apiError(`Google Forms API từ chối yêu cầu${detail}`)
    }
    return (await response.json()) as T
  }

  private questionRequests(
    fields: readonly GoogleFormFieldDefinition[],
    existingTitles: Set<string>,
  ): Array<Record<string, unknown>> {
    return fields.flatMap((field, index) => {
      if (existingTitles.has(field.label.trim())) {
        return []
      }
      return [
        {
          createItem: {
            item: {
              title: field.label,
              questionItem: {
                question: {
                  required: field.required,
                  textQuestion: { paragraph: field.type === "paragraph" },
                },
              },
            },
            location: { index },
          },
        },
      ]
    })
  }

  private buildDescription(jd: {
    summary: string | null
    responsibilities: string | null
    requirements: string | null
    benefits: string | null
  }): string {
    return [jd.summary, jd.responsibilities, jd.requirements, jd.benefits]
      .filter((value): value is string => Boolean(value?.trim()))
      .join("\n\n")
  }

  private text(response: GoogleFormResponse, questionId: string): string {
    // questionId originates from validated posting field snapshots (typed as Google form question id).
    // eslint-disable-next-line security/detect-object-injection
    return response.answers?.[questionId]?.textAnswers?.answers?.[0]?.value?.trim() ?? ""
  }

  private optionalText(response: GoogleFormResponse, questionId: string): string | undefined {
    return this.text(response, questionId) || undefined
  }

  private cvUrl(response: GoogleFormResponse, questionId: string): string | undefined {
    const text = this.optionalText(response, questionId)
    if (text) return text
    // questionId originates from validated posting field snapshots (typed as Google form question id).
    // eslint-disable-next-line security/detect-object-injection
    const fileId = response.answers?.[questionId]?.fileUploadAnswers?.answers?.[0]?.fileId
    return fileId ? `https://drive.google.com/open?id=${encodeURIComponent(fileId)}` : undefined
  }

  private formFields(value: unknown): readonly GoogleFormFieldDefinition[] {
    if (value === null || value === undefined) return GOOGLE_FORM_DEFAULT_FIELDS
    if (!Array.isArray(value)) throw this.apiError("Cấu hình trường Google Form không hợp lệ")
    return value.map((field) => {
      const parsed = googleFormFieldSchema.safeParse(field)
      if (!parsed.success) throw this.apiError("Cấu hình trường Google Form không hợp lệ")
      return parsed.data
    })
  }

  private postingFields(posting: {
    formFields: unknown
    fieldSnapshots: Array<{
      fieldKey: string
      label: string
      type: "short_text" | "paragraph"
      required: boolean
    }>
  }): readonly GoogleFormFieldDefinition[] {
    if (posting.fieldSnapshots.length > 0) {
      return posting.fieldSnapshots.map((field) => ({
        key: field.fieldKey,
        label: field.label,
        type: field.type,
        required: field.required,
      }))
    }
    return this.formFields(posting.formFields)
  }

  private questionIdMappings(
    fields: readonly GoogleFormFieldDefinition[],
    items: NonNullable<GoogleForm["items"]>,
  ): Array<{ fieldKey: string; externalQuestionId: string }> {
    return fields.flatMap((field) => {
      const item = items.find((candidate) => {
        const title = candidate.title?.trim()
        return title ? this.matchesField(field, title) : false
      })
      const externalQuestionId = item?.questionItem?.question?.questionId
      return externalQuestionId ? [{ fieldKey: field.key, externalQuestionId }] : []
    })
  }

  private matchesField(field: GoogleFormFieldDefinition, title: string): boolean {
    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    const normalizedTitle = normalize(title)
    if (normalize(field.label) === normalizedTitle || normalize(field.key) === normalizedTitle)
      return true
    const aliases = new Map<string, readonly string[]>([
      ["full_name", ["ho va ten", "ho ten", "ten day du", "full name", "name"]],
      ["email", ["email", "email address", "dia chi email"]],
      ["phone", ["so dien thoai", "dien thoai", "phone", "phone number"]],
      ["cv_url", ["cv", "link cv", "duong dan cv", "resume"]],
      ["notes", ["ghi chu", "thong tin bo sung", "notes", "additional information"]],
    ])
    return aliases.get(field.key)?.includes(normalizedTitle) ?? false
  }

  private apiError(message: string): AppError {
    return new AppError(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      LAYER,
      "GOOGLE_FORMS_API_ERROR",
    )
  }
}

export const googleFormsConnector = new GoogleFormsConnector()
