import { API_ENDPOINTS } from "@/config/api.config"
import apiClient from "@/lib/api-client"
import type { RouteManifestEntry } from "@/types/system/route.types"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

/**
 * Custom hook managing route manifest retrieval, filtering by method/search, and pagination state.
 */
export function usePermissionMatrix() {
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

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredManifest.slice(start, start + pageSize)
  }, [filteredManifest, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredManifest.length / pageSize))

  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((val: string) => {
    setSortBy(val)
    setCurrentPage(1)
  }, [])

  const handleMethodChange = useCallback((val: string) => {
    setMethodFilter(val)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }, [])

  return {
    loading,
    search,
    methodFilter,
    sortBy,
    currentPage,
    pageSize,
    stats,
    paginatedData,
    totalItems: filteredManifest.length,
    totalPages,
    handleSearch,
    handleClearSearch,
    handleSortChange,
    handleMethodChange,
    handlePageChange,
    handlePageSizeChange,
  }
}
