import { GoogleFormsConnector } from "@/connectors/google-forms.connector"

describe("GoogleFormsConnector", () => {
  it("uses persisted question IDs instead of rejecting a response after labels change", async () => {
    const updateFieldQuestionIds = jest.fn()
    const postingRepository = {
      findById: jest.fn().mockResolvedValue({
        id: "posting-1",
        channel: "google_form",
        externalId: "form-1",
        formFields: null,
        oauthAccountId: "oauth-1",
        oauthAccount: {
          clientId: "client-id",
          clientSecret: "client-secret",
          refreshToken: "refresh-token",
        },
        fieldSnapshots: [
          {
            fieldKey: "full_name",
            label: "Họ và tên",
            type: "short_text",
            required: true,
            externalQuestionId: "question-name",
          },
          {
            fieldKey: "email",
            label: "Email",
            type: "short_text",
            required: true,
            externalQuestionId: "question-email",
          },
          {
            fieldKey: "portfolio",
            label: "Portfolio",
            type: "short_text",
            required: false,
            externalQuestionId: "question-portfolio",
          },
        ],
      }),
      storeConnectorExternalId: jest.fn(),
      updateFieldQuestionIds,
    }
    const fetchFn = jest.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.includes("oauth2.googleapis.com/token")) {
        return Response.json({ access_token: "access-token" })
      }
      if (url.endsWith("/forms/form-1")) {
        return Response.json({
          formId: "form-1",
          items: [
            {
              title: "Tên ứng viên đã đổi",
              questionItem: { question: { questionId: "question-name" } },
            },
            {
              title: "Địa chỉ liên hệ",
              questionItem: { question: { questionId: "question-email" } },
            },
            {
              title: "Hồ sơ cá nhân",
              questionItem: { question: { questionId: "question-portfolio" } },
            },
          ],
        })
      }
      return Response.json({
        responses: [
          {
            responseId: "response-1",
            answers: {
              "question-name": { textAnswers: { answers: [{ value: "Nguyễn An" }] } },
              "question-email": { textAnswers: { answers: [{ value: "an@example.com" }] } },
              "question-portfolio": {
                textAnswers: { answers: [{ value: "https://example.com/an" }] },
              },
            },
          },
        ],
      })
    })
    const connector = new GoogleFormsConnector(
      fetchFn as unknown as typeof fetch,
      postingRepository as never,
    )

    const result = await connector.sync("posting-1")

    expect(result.errors).toEqual([])
    expect(result.rows).toEqual([
      expect.objectContaining({
        fullName: "Nguyễn An",
        email: "an@example.com",
        externalResponseId: "response-1",
        responseData: expect.objectContaining({ portfolio: "https://example.com/an" }),
      }),
    ])
    expect(updateFieldQuestionIds).not.toHaveBeenCalled()
  })

  it("does not fall back to an unrelated OAuth account", async () => {
    const postingRepository = {
      findById: jest.fn().mockResolvedValue({
        id: "posting-without-account",
        channel: "google_form",
        externalId: "form-1",
        formFields: null,
        oauthAccountId: null,
        oauthAccount: null,
        fieldSnapshots: [],
      }),
    }
    const connector = new GoogleFormsConnector(jest.fn() as never, postingRepository as never)

    await expect(connector.sync("posting-without-account")).rejects.toMatchObject({
      errorCode: "CONNECTOR_NOT_CONFIGURED",
    })
  })
})
