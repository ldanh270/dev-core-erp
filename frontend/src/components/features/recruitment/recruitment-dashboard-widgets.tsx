import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TYPOGRAPHY } from "@/config/typography.config"
import { routerNavigate } from "@/lib/router-navigator"

import { format, isToday, isTomorrow, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar } from "lucide-react"

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
}) {
  return (
    <Card
      className="cursor-pointer border border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 rounded-xl"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={TYPOGRAPHY.TABLE_HEADER}>{title}</CardTitle>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center transition-transform hover:scale-110">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function InterviewItem({
  candidateName,
  positionTitle,
  scheduledAt,
  roundNumber,
}: {
  candidateName: string
  positionTitle: string
  scheduledAt: string
  roundNumber: number
}) {
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr)
      if (isToday(date)) return `Hôm nay, ${format(date, "HH:mm")}`
      if (isTomorrow(date)) return `Ngày mai, ${format(date, "HH:mm")}`
      return format(date, "EEEE, dd/MM - HH:mm", { locale: vi })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{candidateName}</p>
        <p className="text-xs text-muted-foreground">{positionTitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Vòng {roundNumber}
        </Badge>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(scheduledAt)}
        </span>
      </div>
    </div>
  )
}

export function QuickLink({
  title,
  description,
  icon: Icon,
  to,
  count,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  to: string
  count?: number
}) {
  return (
    <Card
      className="cursor-pointer border border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 rounded-xl group"
      onClick={() => routerNavigate(to)}
    >
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {count}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-semibold mt-3">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
