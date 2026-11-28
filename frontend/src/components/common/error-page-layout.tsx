import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"

export interface QuickLinkItem {
  label: string
  icon: LucideIcon
  onClick: () => void
}

export interface ErrorPageLayoutProps {
  /** Error Code (e.g. 404, 500, 403) */
  code: string | number
  /** Badge text */
  badgeLabel?: string
  badgeIcon?: LucideIcon
  /** Title */
  title: string
  /** Description message */
  description: string
  /** Primary action button */
  primaryAction?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
  }
  /** Quick recommendation links */
  quickLinks?: QuickLinkItem[]
  /** Footer text note */
  footerNote?: ReactNode
  className?: string
}

/**
 * Standardized ErrorPageLayout component.
 * High-quality layout primitive for 404, 403, 500 error and fallback pages.
 * Encapsulates background glow, grid aura, and responsive card presentation.
 */
export function ErrorPageLayout({
  code,
  badgeLabel,
  badgeIcon: BadgeIcon,
  title,
  description,
  primaryAction,
  secondaryAction,
  quickLinks,
  footerNote = "Hệ thống DevCore ERP • Enterprise Resource Planning",
  className,
}: ErrorPageLayoutProps) {
  const PrimaryIcon = primaryAction?.icon
  const SecondaryIcon = secondaryAction?.icon

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground md:p-8",
        className,
      )}
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-primary/15 blur-[128px]" />

      {/* Decorative Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        <Card className="w-full border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl rounded-xl overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

          <CardHeader className="flex flex-col items-center text-center pt-8 pb-4 space-y-4">
            {badgeLabel && (
              <Badge
                variant="outline"
                className="rounded-full px-3.5 py-1 bg-primary/10 border-primary/20 text-primary font-medium text-xs gap-1.5 shadow-xs"
              >
                {BadgeIcon && <BadgeIcon className="size-3.5" />}
                <span>{badgeLabel}</span>
              </Badge>
            )}

            <div className="relative flex items-center justify-center my-2">
              <div className="pointer-events-none absolute h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
              <h1 className="select-none bg-gradient-to-r from-primary via-primary/80 to-muted-foreground/60 bg-clip-text text-8xl md:text-9xl font-black tracking-tighter text-transparent">
                {code}
              </h1>
            </div>

            <div className="space-y-2 max-w-md">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-6 px-6 pb-6">
            {(primaryAction || secondaryAction) && (
              <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                {primaryAction && (
                  <Button
                    onClick={primaryAction.onClick}
                    size="lg"
                    className="rounded-full px-6 font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                  >
                    {PrimaryIcon && <PrimaryIcon className="size-4" />}
                    {primaryAction.label}
                  </Button>
                )}

                {secondaryAction && (
                  <Button
                    onClick={secondaryAction.onClick}
                    variant="outline"
                    size="lg"
                    className="rounded-full px-6 font-medium transition-all duration-200"
                  >
                    {SecondaryIcon && <SecondaryIcon className="size-4" />}
                    {secondaryAction.label}
                  </Button>
                )}
              </div>
            )}

            {quickLinks && quickLinks.length > 0 && (
              <>
                <Separator className="w-full opacity-60" />

                <div className="w-full rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    Gợi ý truy cập nhanh
                  </span>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {quickLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <button
                          key={link.label}
                          type="button"
                          onClick={link.onClick}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {link.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>

          {footerNote && (
            <CardFooter className="flex justify-center border-t border-border/40 bg-muted/20 py-3 px-6 text-center text-xs text-muted-foreground">
              {footerNote}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
