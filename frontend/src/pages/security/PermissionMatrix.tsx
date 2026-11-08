import {
  type DataTableColumn,
  DataTablePage,
  PageCard,
  TYPOGRAPHY,
} from "@/components/common"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import { cn } from "@/lib/utils"
import type { RouteManifestEntry } from "@/types/system/route.types"

import { useEffect, useMemo, useState } from "react"

import {
  ArrowUpDown,
  CheckCircle2,
  Filter,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react"
import { toast } from "sonner"

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
const renderMethodBadge = (method: string) => {
  const className = BADGE_STYLES_MAP.get(method) ?? "bg-muted text-muted-foreground border-border"
  return (
    <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs inline-block", className)}>
      {method}
    </span>
  )
}

/**
 * Render the list of permissions as small badges.
 * If the array is empty or null, display a tokenized "All Permissions" label.
 */
const renderPermissionsList = (permissions: string[] | null) => {
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

/**
 * PermissionMatrix Component.
 * Standardized API authorization route matrix powered by DataTablePage master component.
 * Features viewport locking, sticky headers, client-side pagination, debounced search, and responsive filters.
 */
export default function PermissionMatrix() {
  const [manifest, setManifest] = useState<RouteManifestEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("DEFAULT")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.DEBUG.ROUTE_MANIFEST)
      .then((res) => {
        setManifest(res.data.data)
      })
      .catch((err) => {
        toast.error("Không thể tải cấu hình Route Manifest")
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Count matches for summary cards
  const stats = useMemo(() => {
    let protectedRoutes = 0
    let publicRoutes = 0
    let permissionRoutes = 0

    manifest.forEach((row) => {
      if (row.authRequired) protectedRoutes++
      else publicRoutes++

      if (row.permissions && row.permissions.length > 0) permissionRoutes++
    })

    return { total: manifest.length, protectedRoutes, publicRoutes, permissionRoutes }
  }, [manifest])

  // Filter and sort the manifest
  const filteredManifest = useMemo(() => {
    let result = manifest.filter((row) => {
      const matchSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.path.toLowerCase().includes(search.toLowerCase()) ||
        (row.description && row.description.toLowerCase().includes(search.toLowerCase()))
      const matchMethod = methodFilter === "ALL" || row.method === methodFilter

      return matchSearch && matchMethod
    })

    if (sortBy === "PATH_ASC") {
      result = [...result].sort((a, b) => a.path.localeCompare(b.path))
    } else if (sortBy === "PATH_DESC") {
      result = [...result].sort((a, b) => b.path.localeCompare(a.path))
    } else if (sortBy.startsWith("SEC_")) {
      const getSecLevel = (row: RouteManifestEntry) => {
        if (row.permissions && row.permissions.length > 0) return 3
        if (row.authRequired) return 2
        return 1
      }
      result = [...result].sort((a, b) => {
        if (sortBy === "SEC_ASC") return getSecLevel(a) - getSecLevel(b)
        return getSecLevel(b) - getSecLevel(a)
      })
    }

    return result
  }, [manifest, search, methodFilter, sortBy])

  // Paginated manifest data slice
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredManifest.slice(start, start + pageSize)
  }, [filteredManifest, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredManifest.length / pageSize))

  // Master DataTable Columns
  const columns = useMemo<DataTableColumn<RouteManifestEntry>[]>(
    () => [
      {
        id: "name",
        header: "Tên API",
        minWidth: "200px",
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
        width: "110px",
        cell: (row) => renderMethodBadge(row.method),
      },
      {
        id: "path",
        header: "Đường dẫn API",
        minWidth: "220px",
        cell: (row) => (
          <span className="font-mono text-[11px] text-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/40 inline-block break-all">
            {row.path}
          </span>
        ),
      },
      {
        id: "authRequired",
        header: "Xác thực",
        width: "90px",
        align: "center",
        cell: (row) =>
          row.authRequired ? (
            <div
              className="inline-flex items-center justify-center text-success bg-success/10 border border-success/20 p-1.5 rounded-full"
              title="Cần đăng nhập (Có Token)"
            >
              <Lock size={14} />
            </div>
          ) : (
            <div
              className="inline-flex items-center justify-center text-muted-foreground bg-muted/60 border border-border/40 p-1.5 rounded-full"
              title="Public (Không cần Token)"
            >
              <Unlock size={14} />
            </div>
          ),
      },
      {
        id: "permissions",
        header: "Phân quyền",
        minWidth: "200px",
        cell: (row) => renderPermissionsList(row.permissions),
      },
    ],
    [],
  )

  return (
    <DataTablePage<RouteManifestEntry>
      title="Cấu trúc Phân quyền"
      description="Danh sách các API endpoints của hệ thống và quyền cần có để truy cập (Single Source of Truth)."
      subHeader={
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
          <PageCard className="bg-muted/20 border-border">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Unlock size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Công khai
                </p>
                <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                  {stats.publicRoutes}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
                </h3>
              </div>
            </div>
          </PageCard>

          <PageCard className="bg-muted/20 border-border">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Yêu cầu đăng nhập
                </p>
                <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                  {stats.protectedRoutes}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
                </h3>
              </div>
            </div>
          </PageCard>

          <PageCard className="bg-muted/20 border-border">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Yêu cầu quyền đặc biệt
                </p>
                <h3 className="text-lg font-extrabold text-foreground leading-none mt-1">
                  {stats.permissionRoutes}{" "}
                  <span className="text-sm font-normal text-muted-foreground">/ {stats.total}</span>
                </h3>
              </div>
            </div>
          </PageCard>
        </div>
      }
      search={{
        value: search,
        placeholder: "Tìm kiếm API, đường dẫn...",
        onSearch: (val) => {
          setSearch(val)
          setCurrentPage(1)
        },
        onClear: () => {
          setSearch("")
          setCurrentPage(1)
        },
      }}
      toolbarActions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-muted-foreground shrink-0" />
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[190px] bg-background rounded-full text-xs font-semibold">
                <SelectValue placeholder="Sắp xếp theo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Đường dẫn (A-Z)</SelectItem>
                <SelectItem value="PATH_DESC">Đường dẫn (Z-A)</SelectItem>
                <SelectItem value="SEC_DESC">Bảo mật (Cao đến thấp)</SelectItem>
                <SelectItem value="SEC_ASC">Bảo mật (Thấp đến cao)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground shrink-0" />
            <Select
              value={methodFilter}
              onValueChange={(val) => {
                setMethodFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[160px] bg-background rounded-full text-xs font-semibold">
                <SelectValue placeholder="Phương thức..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả phương thức</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
      columns={columns}
      data={paginatedData}
      keyExtractor={(row, index) => `${row.method}-${row.path}-${index}`}
      isLoading={loading}
      emptyState={{
        title: "Không tìm thấy API nào",
        description: "Không có route nào khớp với từ khóa tìm kiếm hoặc bộ lọc phương thức hiện tại.",
      }}
      pagination={{
        currentPage,
        totalPages,
        totalItems: filteredManifest.length,
        itemsPerPage: pageSize,
        onPageChange: setCurrentPage,
        onItemsPerPageChange: (newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        },
        pageSizeOptions: [10, 20, 50, 100],
      }}
    />
  )
}
