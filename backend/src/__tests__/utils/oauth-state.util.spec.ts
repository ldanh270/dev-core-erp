import { consumeOAuthState, createOAuthState } from "@/utils/oauth-state.util"

const mockCreate = jest.fn()
const mockUpdateMany = jest.fn()

jest.mock("@/libs/database", () => ({
  prisma: {
    recruitmentOAuthStateNonce: {
      create: (...args: unknown[]) => mockCreate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}))

describe("OAuth state", () => {
  const originalSecret = process.env.OAUTH_STATE_SECRET

  beforeEach(() => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret"
    mockCreate.mockResolvedValue({})
    mockUpdateMany.mockResolvedValue({ count: 1 })
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.OAUTH_STATE_SECRET
    else process.env.OAUTH_STATE_SECRET = originalSecret
  })

  it("signs and consumes a state once", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
    const state = await createOAuthState(
      { userId: "employee-1", channel: "google_form", name: "Forms" },
      1000,
    )

    await expect(consumeOAuthState(state, 2000)).resolves.toEqual(
      expect.objectContaining({
        userId: "employee-1",
        channel: "google_form",
        name: "Forms",
      }),
    )
    await expect(consumeOAuthState(state, 3000)).rejects.toThrow("already been consumed")
  })

  it("rejects tampered or expired state", async () => {
    const state = await createOAuthState(
      { userId: "employee-1", channel: "google_form", name: "Forms" },
      1000,
    )
    const [payload, signature] = state.split(".")

    await expect(consumeOAuthState(`${payload}x.${signature}`, 2000)).rejects.toThrow("signature")
    await expect(
      consumeOAuthState(
        await createOAuthState(
          { userId: "employee-1", channel: "google_form", name: "Forms" },
          1000,
        ),
        601001,
      ),
    ).rejects.toThrow("Expired")
  })
})
