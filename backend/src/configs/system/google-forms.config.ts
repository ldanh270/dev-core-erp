export const GOOGLE_FORMS_SCOPES = [
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
] as const

export interface GoogleFormsConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export function getGoogleFormsConfig(): GoogleFormsConfig | null {
  const clientId = process.env.GOOGLE_FORMS_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_FORMS_CLIENT_SECRET?.trim()
  const refreshToken = process.env.GOOGLE_FORMS_REFRESH_TOKEN?.trim()
  if (!clientId || !clientSecret || !refreshToken) return null
  return { clientId, clientSecret, refreshToken }
}
