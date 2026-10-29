/**
 * Centralized Branding Configuration
 * Change logo URL, application name, or brand identity in this single location.
 */
export const BRANDING_CONFIG = {
  APP_NAME: "DevCore ERP",
  APP_SUBTITLE: "Enterprise Resource Planning",
  LOGO_URL: "/logo.svg",
  LOGO_ALT: "DevCore ERP",
} as const

export const APP_LOGO = BRANDING_CONFIG.LOGO_URL
