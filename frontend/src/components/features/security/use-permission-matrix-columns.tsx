import { type DataTableColumn, TABLE_COL_WIDTH, getTableColWidthPx } from "@/components/common"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"
import type { RouteManifestEntry } from "@/types/system/route.types"

import { useMemo } from "react"

import { CheckCircle2, Lock, Unlock } from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers & Subcomponents
// ---------------------------------------------------------------------------

const BADGE_STYLES_MAP = new Map<string, string>([
  ["GET", "bg-success/15 text-success border-success/30"],
  ["POST", "bg-warning/15 text-warning border-warning/30"],
  ["PUT", "bg-info/15 text-info border-info/30"],
  ["DELETE", "bg-destructive/15 text-destructive border-destructive/30"],
  ["PATCH", "bg-primary/15 text-primary border-primary/30"],
  ["ALL", "bg-muted text-muted-foreground border-border"],
])

/**
 * Render color badges for each HTTP Method type using semantic design tokens.
 */
function MethodBadge({ method }: { method: string }) {
  const className = BADGE_STYLES_MAP.get(method) ?? "bg-muted text-muted-foreground border-border"
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs inline-block",
        className,
      )}
    >
      {method}
    </span>
  )
}

/**
 * Render the list of permissions as small badges.
 * If the array is empty or null, display a tokenized "All Permissions" label.
 */
function PermissionsListBadge({ permissions }: { permissions: string[] | null }) {
  if (!permissions || permissions.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-success font-semibold bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
        <CheckCircle2 size={11} />
        Tất cả quyền
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((p) => (
        <span
          key={p}
          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono"
        >
          {p}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

export function usePermissionMatrixColumns() {
  return useMemo<DataTableColumn<RouteManifestEntry>[]>(
    () => [
      {
        id: "name",
        header: "Tên API",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (row) => (
          <div className="flex flex-col">
            <span className={cn(TYPOGRAPHY.CELL_PRIMARY, "font-bold leading-snug")}>
              {row.name}
            </span>
            {row.description && (
              <span className={cn(TYPOGRAPHY.CELL_SECONDARY, "tracking-wide font-medium mt-0.5")}>
                {row.description}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "method",
        header: "Phương thức",
        width: getTableColWidthPx("PRIORITY"),
        minWidth: `${TABLE_COL_WIDTH.PRIORITY}px`,
        cell: (row) => <MethodBadge method={row.method} />,
      },
      {
        id: "path",
        header: "Đường dẫn API",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (row) => (
          <span className="font-mono text-xs text-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/40 inline-block font-semibold">
            {row.path}
          </span>
        ),
      },
      {
        id: "access",
        header: "Mức truy cập",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        cell: (row) =>
          !row.authRequired ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Unlock size={14} className="text-muted-foreground/80 shrink-0" />
              Công khai
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-warning font-semibold">
              <Lock size={14} className="text-warning shrink-0" />
              Đăng nhập
            </span>
          ),
      },
      {
        id: "permissions",
        header: "Quyền hạn yêu cầu",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (row) => <PermissionsListBadge permissions={row.permissions} />,
      },
    ],
    [],
  )
}
