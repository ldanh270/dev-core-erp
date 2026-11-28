import { BRANDING_CONFIG } from "@/config/branding.config"

import type { ReactNode } from "react"

function GeometricBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-35">
      <svg className="h-full w-full" viewBox="0 0 800 800" preserveAspectRatio="none" fill="none">
        <path d="M-100,-100 L450,150 L250,650 L-100,550 Z" fill="url(#geom-grad)" />
        <path d="M350,50 L950,350 L650,850 L250,750 Z" fill="url(#geom-grad-2)" />
        <defs>
          <linearGradient id="geom-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.12" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="geom-grad-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function BrandLogo({
  className = "size-14 rounded-lg object-cover shadow-lg transition-transform hover:scale-105",
}: {
  className?: string
}) {
  return <img src={BRANDING_CONFIG.LOGO_URL} alt={BRANDING_CONFIG.LOGO_ALT} className={className} />
}

interface AuthSplitLayoutProps {
  title: string
  description: string
  showSliderDots?: boolean
  bottomSlot?: ReactNode
  children: ReactNode
}

/**
 * Split layout container for authentication views (Login, Reset Password)
 * featuring responsive branding panels and geometric illustration backdrops.
 */
export function AuthSplitLayout({
  title,
  description,
  showSliderDots = false,
  bottomSlot,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left Column: Visual branding and teaser (Only on lg screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-linear-to-br from-login-grad-start via-login-grad-mid to-login-grad-end p-12 text-white overflow-hidden lg:flex">
        <GeometricBackground />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo />
          <span className="text-xl font-bold tracking-wide">{BRANDING_CONFIG.APP_NAME}</span>
        </div>

        {/* Feature Teaser */}
        <div className="relative z-10 my-auto flex flex-col items-start space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">{title}</h1>
          <p className="text-white/80 text-base leading-relaxed">{description}</p>
          {showSliderDots && (
            <div className="flex items-center gap-2 pt-2">
              <span className="h-2.5 w-6 rounded-full bg-white transition-all" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/40 hover:bg-white/60 cursor-pointer transition-all" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/40 hover:bg-white/60 cursor-pointer transition-all" />
            </div>
          )}
        </div>

        {/* Bottom slot */}
        {bottomSlot ? (
          <div className="relative z-10 flex justify-center pb-8">{bottomSlot}</div>
        ) : (
          <div className="relative z-10 h-10" />
        )}
      </div>

      {/* Right Column: Form Container */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  )
}
