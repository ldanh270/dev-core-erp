import { EmptyState, PageCard } from "@/components/common"
import { Input } from "@/components/ui/input"
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
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
} from "lucide-react"
import { toast } from "sonner"

/**
 * PermissionMatrix Component.
 * Fetches the backend route manifest and displays the authorization rules for each endpoint.
 */
export default function PermissionMatrix() {
  const [manifest, setManifest] = useState<RouteManifestEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("DEFAULT")

  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.DEBUG.ROUTE_MANIFEST)
      .then((res) => setManifest(res.data.data))
      .catch((err) => {
        toast.error("Không thể tải cấu hình Route Manifest")
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  // Count matches/mismatches for summary cards
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
        if (row.permissions && row.permissions.length > 0) return 3 // Permission
        if (row.authRequired) return 2 // Token
        return 1 // Public
      }
      result = [...result].sort((a, b) => {
        if (sortBy === "SEC_ASC") return getSecLevel(a) - getSecLevel(b)
        return getSecLevel(b) - getSecLevel(a)
      })
    }

    return result
  }, [manifest, search, methodFilter, sortBy])

  /**
   * Render the list of permissions as small badges.
   * If the array is empty or null, display an "All Permissions" label.
   *
   * @param permissions - Array of permission strings, or null
   * @returns React Node containing the badges
   */
  const renderPermissionsList = (permissions: string[] | null) => {
    if (!permissions || permissions.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
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
   * Render color badges for each HTTP Method type.
   *
   * @param method - HTTP Method name (GET, POST, PUT, DELETE, PATCH, ALL)
   * @returns React Node containing the corresponding colored badge
   */
  const renderMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-emerald-500 text-white dark:bg-emerald-600 border-transparent",
      POST: "bg-amber-500 text-white dark:bg-amber-600 border-transparent",
      PUT: "bg-blue-500 text-white dark:bg-blue-600 border-transparent",
      DELETE: "bg-rose-500 text-white dark:bg-rose-600 border-transparent",
      PATCH: "bg-purple-500 text-white dark:bg-purple-600 border-transparent",
      ALL: "bg-muted text-muted-foreground border-border",
    }
    const className = colors[method] || colors.ALL
    return (
      <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs", className)}>
        {method}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl px-6 py-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-snug">
            Cấu trúc Phân quyền
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Danh sách các API endpoints của hệ thống và quyền cần có để truy cập (Single Source of
            Truth).
          </p>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-7">
        <PageCard className="bg-muted/20 border-border">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Unlock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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

      {/* Main Table Matrix */}
      <PageCard className="overflow-hidden" padding="sm">
        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm kiếm API, đường dẫn..."
              className="pl-8 h-8 text-xs bg-background border-border/80 rounded-full focus:border-primary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={15} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[200px] text-xs rounded-full bg-background">
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
              <Filter size={15} className="text-muted-foreground" />
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="h-8 w-[170px] text-xs rounded-full bg-background">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="px-5 py-3 text-left">Tên API</th>
                <th className="px-5 py-3 text-left">Phương thức</th>
                <th className="px-5 py-3 text-left">Đường dẫn API</th>
                <th className="px-5 py-3 text-center">Xác thực</th>
                <th className="px-5 py-3 text-left">Phân quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredManifest.map((row, index) => {
                return (
                  <tr
                    key={`${row.method}-${row.path}-${index}`}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground leading-snug">
                          {row.name}
                        </span>
                        {row.description && (
                          <span className="text-[10px] text-muted-foreground tracking-wide font-medium mt-0.5">
                            {row.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {renderMethodBadge(row.method)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/40 inline-block break-all">
                        {row.path}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.authRequired ? (
                        <div
                          className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-full"
                          title="Cần đăng nhập (Có Token)"
                        >
                          <Lock size={14} />
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center justify-center text-muted-foreground bg-muted/50 p-1.5 rounded-full"
                          title="Public (Không cần Token)"
                        >
                          <Unlock size={14} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{renderPermissionsList(row.permissions)}</td>
                  </tr>
                )
              })}
              {filteredManifest.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8">
                    <EmptyState
                      icon={ShieldCheck}
                      title="Không tìm thấy API nào"
                      description="Không có route nào khớp với từ khóa tìm kiếm hoặc bộ lọc phương thức hiện tại."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  )
}
