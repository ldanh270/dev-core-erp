import { cors } from "@/middlewares/cors.middleware"

describe("cors middleware", () => {
  const originalOrigins = process.env.CORS_ALLOWED_ORIGINS

  afterEach(() => {
    if (originalOrigins === undefined) delete process.env.CORS_ALLOWED_ORIGINS
    else process.env.CORS_ALLOWED_ORIGINS = originalOrigins
  })

  it("allows configured origins and handles preflight", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://hr.example.com"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "OPTIONS", headers: { origin: "https://hr.example.com" } } as never,
      response as never,
      next,
    )

    expect(response.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://hr.example.com")
    expect(response.sendStatus).toHaveBeenCalledWith(204)
    expect(next).not.toHaveBeenCalled()
  })

  it("allows both local development loopback origins", () => {
    process.env.CORS_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "POST", headers: { origin: "http://localhost:5173" } } as never,
      response as never,
      next,
    )

    expect(response.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "http://localhost:5173")
    expect(next).toHaveBeenCalled()
  })

  it("rejects unconfigured origins before routing", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://hr.example.com"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "POST", headers: { origin: "https://evil.example.com" } } as never,
      response as never,
      next,
    )

    expect(response.status).toHaveBeenCalledWith(403)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: "ORIGIN_NOT_ALLOWED" }),
    }))
    expect(next).not.toHaveBeenCalled()
  })

  it("allows origins matching wildcard patterns like *.vercel.app", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://*.vercel.app,http://localhost:*"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "POST", headers: { origin: "https://dev-core-erp-git-feat.vercel.app" } } as never,
      response as never,
      next,
    )

    expect(response.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "https://dev-core-erp-git-feat.vercel.app",
    )
    expect(next).toHaveBeenCalled()
  })

  it("rejects malicious origin that mimics wildcard domain", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://*.vercel.app"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "POST", headers: { origin: "https://evil-vercel.app" } } as never,
      response as never,
      next,
    )

    expect(response.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
