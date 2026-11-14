import { toPublicOAuthAccount } from "@/services/recruitment-oauth-account.service"

import { RecruitmentChannel } from "@prisma/client"

describe("toPublicOAuthAccount", () => {
  it("removes OAuth secrets from the public DTO", () => {
    const account = toPublicOAuthAccount({
      id: "account-1",
      userId: "employee-1",
      channel: RecruitmentChannel.google_form,
      name: "Google Forms",
      clientId: "public-client-id",
      clientSecret: "secret-value",
      refreshToken: "refresh-token-value",
      createdAt: new Date("2026-07-29T00:00:00.000Z"),
      updatedAt: new Date("2026-07-29T00:00:00.000Z"),
    })

    expect(account).toEqual(
      expect.objectContaining({
        id: "account-1",
        clientId: "public-client-id",
        hasRefreshToken: true,
      }),
    )
    expect(account).not.toHaveProperty("clientSecret")
    expect(account).not.toHaveProperty("refreshToken")
  })
})
