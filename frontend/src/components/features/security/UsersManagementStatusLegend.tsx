import { ShieldAlert, ShieldCheck } from "lucide-react"

/**
 * Presenter component showing active and locked account status indicator legends.
 */
export function UsersManagementStatusLegend() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck size={12} className="text-emerald-500" />
        <span>Hoạt động</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldAlert size={12} className="text-rose-500" />
        <span>Bị khóa</span>
      </div>
    </div>
  )
}
