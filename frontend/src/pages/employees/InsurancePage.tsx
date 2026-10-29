import { AppPagination, EmptyState, PageCard, PageHeader } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { formatCurrency } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { useEffect, useMemo, useState } from "react"

import { Plus, Search, ShieldAlert } from "lucide-react"
import { useSearchParams } from "react-router-dom"

const EMPTY_EMPLOYEES: Employee[] = []

export default function InsurancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const searchTerm = searchParams.get("search") || ""

  const { data: paginatedData, isLoading } = useEmployees({ limit: 100 })
  const employees = paginatedData?.data ?? EMPTY_EMPLOYEES
  const [keyword, setKeyword] = useState(searchTerm)

  useEffect(() => {
    setKeyword(searchTerm)
  }, [searchTerm])

  const filteredEmployees = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) return employees

    return employees.filter((employee: Employee) =>
      [employee.fullName, employee.username, employee.nationalId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedTerm)),
    )
  }, [employees, searchTerm])

  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice((page - 1) * limit, page * limit)
  }, [filteredEmployees, page, limit])

  const totalPages = Math.ceil(filteredEmployees.length / limit)

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6">
      <PageHeader
        title="Bảo hiểm"
        description="Theo dõi thông tin bảo hiểm xã hội, y tế và thất nghiệp của nhân sự."
        actions={
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs rounded-full font-semibold">
            <Plus size={13} strokeWidth={2.5} />
            Khai báo bảo hiểm
          </Button>
        }
      />

      <PageCard className="p-0 overflow-hidden" noBorder={false}>
        <div className="flex flex-col justify-between gap-3 border-b border-border p-4 lg:flex-row lg:items-center bg-muted/20">
          <div className="flex w-full flex-1 items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Input
                value={keyword}
                onChange={(event) => {
                  const val = event.target.value
                  setKeyword(val)
                  if (val === "") {
                    const params = new URLSearchParams(searchParams)
                    params.delete("search")
                    params.set("page", "1")
                    setSearchParams(params)
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const params = new URLSearchParams(searchParams)
                    if (keyword.trim()) {
                      params.set("search", keyword.trim())
                    } else {
                      params.delete("search")
                    }
                    params.set("page", "1")
                    setSearchParams(params)
                  }
                }}
                placeholder="Tìm kiếm họ tên, mã BH..."
                aria-label="Tìm kiếm bảo hiểm"
                className="h-9 pl-9 pr-4 text-xs bg-background shadow-none border-border rounded-full"
              />
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                if (keyword.trim()) {
                  params.set("search", keyword.trim())
                } else {
                  params.delete("search")
                }
                params.set("page", "1")
                setSearchParams(params)
              }}
              className="h-9 px-4 text-xs rounded-full font-semibold"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Nhân sự
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Mã NV
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Số sổ BHXH
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Mã BHYT
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium text-muted-foreground">
                  Lương đóng BH
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium text-muted-foreground">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    Đang tải dữ liệu bảo hiểm...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={ShieldAlert}
                      title="Không tìm thấy dữ liệu bảo hiểm"
                      description="Không có nhân sự hoặc hồ sơ bảo hiểm nào phù hợp với từ khóa tìm kiếm."
                    />
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee: Employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-0 transition-colors duration-100 hover:bg-muted/25"
                  >
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-medium text-foreground">
                        {employee.fullName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{employee.username}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {employee?.id ? employee.id.slice(-6).toUpperCase() : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                      {employee?.nationalId ? `79${employee.nationalId.slice(0, 8)}` : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                      {employee?.nationalId ? `DN4${employee.nationalId.slice(0, 10)}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] text-foreground">
                      {formatCurrency(5000000)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className="rounded-full shadow-none font-medium px-2.5 py-0.5 border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 text-[10px]"
                      >
                        Đang đóng BHXH
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredEmployees.length > 0 && (
          <AppPagination
            currentPage={page}
            totalPages={totalPages || 1}
            onPageChange={(p) => {
              const params = new URLSearchParams(searchParams)
              params.set("page", p.toString())
              setSearchParams(params)
            }}
            totalItems={filteredEmployees.length}
            itemsPerPage={limit}
            onItemsPerPageChange={(l) => {
              const params = new URLSearchParams(searchParams)
              params.set("limit", l.toString())
              params.set("page", "1")
              setSearchParams(params)
            }}
          />
        )}
      </PageCard>
    </div>
  )
}
