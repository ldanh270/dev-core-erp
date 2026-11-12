import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { OAUTH_STATE_SECRET } from "@/configs/auth/auth.config"
import { prisma } from "@/libs/database"

const STATE_TTL_MS = 10 * 60 * 1000

/**
 * Encrypted and HMAC-signed state payload exchanged during OAuth handshakes.
 */
export interface OAuthStatePayload {
  userId: string
  channel: string
  name: string
  accountId?: string
  nonce: string
  expiresAt: number
}

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url")
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const getSecret = () => {
  const secret = process.env.OAUTH_STATE_SECRET || OAUTH_STATE_SECRET
  if (!secret) throw new Error("OAuth state secret is not configured")
  return secret
}

const sign = (value: string) => createHmac("sha256", getSecret()).update(value).digest("base64url")

/**
 * Creates an HMAC-signed OAuth state parameter with a unique single-use nonce.
 * Persists the nonce into the database with a 10-minute expiration window.
 *
 * @param input - Identity and channel information to embed in state
 * @param now - Optional timestamp override (default: Date.now())
 * @returns Dot-delimited string formatted as `<base64urlPayload>.<signature>`
 */
export async function createOAuthState(
  input: Omit<OAuthStatePayload, "nonce" | "expiresAt">,
  now = Date.now(),
) {
  const payload: OAuthStatePayload = {
    ...input,
    nonce: randomBytes(32).toString("base64url"),
    expiresAt: now + STATE_TTL_MS,
  }
  await prisma.recruitmentOAuthStateNonce.create({
    data: { nonce: payload.nonce, expiresAt: new Date(payload.expiresAt) },
  })
  const encodedPayload = encode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

/**
 * Verifies and consumes a signed OAuth state parameter.
 * Enforces timing-safe signature comparison, expiration checking, and single-use DB nonce consumption.
 *
 * @param state - The state string returned from the OAuth provider callback
 * @param now - Optional timestamp override (default: Date.now())
 * @returns Decoded and verified OAuthStatePayload
 * @throws {Error} If format invalid, signature mismatched, state expired, or nonce already consumed
 */
export async function consumeOAuthState(state: string, now = Date.now()): Promise<OAuthStatePayload> {
  const [encodedPayload, encodedSignature, ...extra] = state.split(".")
  if (!encodedPayload || !encodedSignature || extra.length > 0) {
    throw new Error("Invalid OAuth state format")
  }

  const expectedSignature = sign(encodedPayload)
  const actual = Buffer.from(encodedSignature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid OAuth state signature")
  }

  let payload: OAuthStatePayload
  try {
    payload = JSON.parse(decode(encodedPayload)) as OAuthStatePayload
  } catch {
    throw new Error("Invalid OAuth state payload")
  }
  if (!payload.userId || !payload.channel || !payload.name || !payload.nonce || payload.expiresAt <= now) {
    throw new Error("Expired OAuth state")
  }

  const consumed = await prisma.recruitmentOAuthStateNonce.updateMany({
    where: { nonce: payload.nonce, consumedAt: null, expiresAt: { gt: new Date(now) } },
    data: { consumedAt: new Date(now) },
  })
  if (consumed.count !== 1) throw new Error("OAuth state has already been consumed or expired")
  return payload
}
