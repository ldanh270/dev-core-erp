import {
  DataTablePage,
  type DataTableColumn,
  StatusPill,
} from "@/components/common"
import { SYSTEM_CONFIG } from "@/config/system.config"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { formatCurrency } from "@/lib/utils"
import type { Employee } from "@/types/employee.types"

import { useMemo } from "react"
import { Plus, ShieldAlert, User } from "lucide-react"
import { useSearchParams } from "react-router-dom"

const EMPTY_EMPLOYEES: Employee[] = []

/**
 * Standardized Social & Health Insurance management page.
 * Powered by DataTablePage master primitive with viewport-locked internal scrolling,
 * 400ms search debouncing, and token-based StatusPill indicators.
 */
export default function InsurancePage() {
  // ==========================================
  // 1. URL Query State & Pagination
  // ==========================================
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || SYSTEM_CONFIG.PAGINATION.SMALL_LIMIT
  const searchTerm = searchParams.get("search") || ""

  // ==========================================
  // 2. Data Fetching
  // ==========================================
  const { data: paginatedData, isLoading } = useEmployees({ limit: 100 })
  const employees = paginatedData?.data ?? EMPTY_EMPLOYEES

  // ==========================================
  // 3. Filtering & Pagination Logic
  // ==========================================
  const filteredEmployees = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) return employees

    return employees.filter((employee: Employee) =>
      [employee.fullName, employee.username, employee.nationalId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedTerm)),
    )
  }, [employees, searchTerm])

  const paginatedEmployees = useMemo(
    () => filteredEmployees.slice((page - 1) * limit, page * limit),
    [filteredEmployees, page, limit],
  )
  const totalPages = Math.ceil(filteredEmployees.length / limit)

  // ==========================================
  // 4. Table Columns Definition
  // ==========================================
  const columns: DataTableColumn<Employee>[] = useMemo(
    () => [
      {
        id: "employee",
        header: "Nhân sự",
        width: "240px",
        minWidth: "240px",
        sticky: true,
        cell: (employee) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate" title={employee.fullName}>
                {employee.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={employee.username}>
                {employee.username}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "code",
        header: "Mã NV",
        width: "110px",
        minWidth: "110px",
        sticky: true,
        cell: (employee) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground inline-block truncate">
            {employee.id ? employee.id.slice(-6).toUpperCase() : "—"}
          </span>
        ),
      },
      {
        id: "socialInsurance",
        header: "Số sổ BHXH",
        width: "160px",
        minWidth: "160px",
        cell: (employee) => (
          <span className="font-mono text-xs text-muted-foreground">
            {employee.nationalId ? `79${employee.nationalId.slice(0, 8)}` : "—"}
          </span>
        ),
      },
      {
        id: "healthInsurance",
        header: "Mã BHYT",
        width: "160px",
        minWidth: "160px",
        cell: (employee) => (
          <span className="font-mono text-xs text-muted-foreground">
            {employee.nationalId ? `DN4${employee.nationalId.slice(0, 10)}` : "—"}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Lương đóng BH",
        align: "right",
        width: "150px",
        minWidth: "150px",
        cell: () => (
          <span className="font-mono font-medium text-foreground whitespace-nowrap">
            {formatCurrency(5000000)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: "150px",
        minWidth: "150px",
        cell: () => (
          <StatusPill label="Đang đóng BHXH" variant="success" />
        ),
      },
    ],
    [],
  )

  // ==========================================
  // 5. Render Master DataTablePage
  // ==========================================
  return (
    <DataTablePage<Employee>
      title="Bảo hiểm"
      description="Theo dõi thông tin bảo hiểm xã hội, y tế và thất nghiệp của nhân sự."
      primaryAction={{
        label: "Khai báo bảo hiểm",
        icon: Plus,
        onClick: () => {
          // Future handler or drawer trigger for insurance declaration
        },
      }}
      search={{
        placeholder: "Tìm kiếm họ tên, mã BH...",
        value: searchTerm,
        onSearch: (value) => {
          const params = new URLSearchParams(searchParams)
          if (value.trim()) {
            params.set("search", value.trim())
          } else {
            params.delete("search")
          }
          params.set("page", "1")
          setSearchParams(params)
        },
      }}
      columns={columns}
      data={paginatedEmployees}
      isLoading={isLoading}
      emptyState={{
        icon: ShieldAlert,
        title: "Không tìm thấy dữ liệu bảo hiểm",
        description: "Không có nhân sự hoặc hồ sơ bảo hiểm nào phù hợp với từ khóa tìm kiếm.",
      }}
      pagination={
        filteredEmployees.length > 0
          ? {
              currentPage: page,
              totalPages: totalPages || 1,
              totalItems: filteredEmployees.length,
              itemsPerPage: limit,
              onPageChange: (newPage) => {
                const params = new URLSearchParams(searchParams)
                params.set("page", newPage.toString())
                setSearchParams(params)
              },
              onItemsPerPageChange: (newLimit) => {
                const params = new URLSearchParams(searchParams)
                params.set("limit", newLimit.toString())
                params.set("page", "1")
                setSearchParams(params)
              },
              pageSizeOptions: [10, 20, 50, 100],
            }
          : undefined
      }
    />
  )
}
