import { PageCard } from "@/components/common"

interface AttendanceSummaryStatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
}

export function AttendanceSummaryStatCard({
  title,
  value,
  description,
  icon: Icon,
}: AttendanceSummaryStatCardProps) {
  return (
    <PageCard padding="md" className="shadow-xs hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground truncate" title={description}>
            {description}
          </p>
        </div>
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="size-5" />
        </div>
      </div>
    </PageCard>
  )
}
