import {
  DataTablePage,
  useConfirm,
  type DataTableColumn,
} from "@/components/common"
import { SalaryVariableFormPage } from "@/components/features/payroll/salary-variable-form-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SALARY_VARIABLE_DESCRIPTIONS } from "@/config/messages/payroll.message"
import { useDeleteSalaryVariable, useSalaryVariables } from "@/hooks/payroll/use-salary-variable"
import type { ISalaryVariable } from "@/hooks/payroll/use-salary-variable"

import { useMemo, useState } from "react"

import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react"

type VariableRow = Omit<ISalaryVariable, "value"> & {
  value: number | string
  isSystem?: boolean
}

const SYSTEM_VARIABLES: VariableRow[] = [
  {
    id: "sys_baseSalary",
    code: "baseSalary",
    name: "Lương cơ bản",
    value: "Theo thiết lập lương",
    description: SALARY_VARIABLE_DESCRIPTIONS.BASE_SALARY,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_workingDays",
    code: "workingDays",
    name: "Ngày làm việc chuẩn",
    value: "Theo lịch tháng",
    description: SALARY_VARIABLE_DESCRIPTIONS.STANDARD_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_actualWorkingDays",
    code: "actualWorkingDays",
    name: "Ngày làm thực tế",
    value: "Từ chấm công",
    description: SALARY_VARIABLE_DESCRIPTIONS.WORKING_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_overtimeMinutes",
    code: "overtimeMinutes",
    name: "Phút tăng ca",
    value: "Từ chấm công",
    description: SALARY_VARIABLE_DESCRIPTIONS.OVERTIME_MINUTES,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_paidLeaveDays",
    code: "paidLeaveDays",
    name: "Nghỉ phép có lương",
    value: "Từ hệ thống phép",
    description: SALARY_VARIABLE_DESCRIPTIONS.HOLIDAY_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_unpaidLeaveDays",
    code: "unpaidLeaveDays",
    name: "Nghỉ không lương",
    value: "Từ hệ thống phép",
    description: SALARY_VARIABLE_DESCRIPTIONS.ABSENT_DAYS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const PART_TIME_SYSTEM_VARIABLES: VariableRow[] = [
  {
    id: "sys_pt_spentTimeHours",
    code: "spentTimeHours",
    name: "Giờ Spent Time (PT)",
    value: "Từ Spent Time đã duyệt",
    description: SALARY_VARIABLE_DESCRIPTIONS.PT_SPENT_TIME_HOURS,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sys_pt_hourlyRate",
    code: "hourlyRate",
    name: "Đơn giá/giờ dự án (PT)",
    value: "ProjectMember.hourlyRate",
    description: SALARY_VARIABLE_DESCRIPTIONS.PT_HOURLY_RATE,
    isActive: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function SalaryVariablesPage() {
  const confirm = useConfirm()
  const { data: variables, isLoading } = useSalaryVariables()
  const deleteMutation = useDeleteSalaryVariable()

  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedItem, setSelectedItem] = useState<ISalaryVariable | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const combinedVariables = useMemo(() => {
    return [
      ...SYSTEM_VARIABLES,
      ...PART_TIME_SYSTEM_VARIABLES,
      ...(variables || []),
    ] as VariableRow[]
  }, [variables])

  const filteredVariables = useMemo(() => {
    const s = searchTerm.toLowerCase()
    return combinedVariables.filter(
      (v) => v.code.toLowerCase().includes(s) || v.name.toLowerCase().includes(s),
    )
  }, [combinedVariables, searchTerm])

  const paginatedVariables = useMemo(() => {
    return filteredVariables.slice((page - 1) * limit, page * limit)
  }, [filteredVariables, page, limit])

  const totalPages = Math.ceil(filteredVariables.length / limit)

  const handleOpenCreate = () => {
    setSelectedItem(null)
    setView("create")
  }

  const handleOpenEdit = (variable: ISalaryVariable) => {
    setSelectedItem(variable)
    setView("edit")
  }

  const handleCloseForm = () => {
    setView("list")
    setSelectedItem(null)
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: SALARY_VARIABLE_DESCRIPTIONS.DELETE_TITLE,
      description:
        "Bạn có chắc chắn muốn xóa biến số tính lương này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy bỏ",
      variant: "destructive",
    })
    if (isConfirmed) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const columns: DataTableColumn<VariableRow>[] = useMemo(
    () => [
      {
        id: "index",
        header: "#",
        width: "60px",
        align: "center",
        sticky: true,
        cell: (_, index) => (
          <span className="text-muted-foreground">{(page - 1) * limit + index + 1}</span>
        ),
      },
      {
        id: "code",
        header: "Mã biến (Code)",
        minWidth: "180px",
        sticky: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>
            {item.isSystem && (
              <Badge variant="outline" className="text-[10px] bg-muted/50 rounded-full font-normal">
                Hệ thống
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "name",
        header: "Tên biến",
        minWidth: "180px",
        cell: (item) => (
          <div>
            <div className="font-medium text-foreground">{item.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-72" title={item.description}>
              {item.description}
            </div>
          </div>
        ),
      },
      {
        id: "value",
        header: "Giá trị mặc định",
        minWidth: "160px",
        hideBelow: "md",
        cell: (item) => (
          <span className="font-mono text-xs text-foreground bg-muted/40 px-2 py-1 rounded-md">
            {item.value}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        minWidth: "120px",
        cell: (item) => (
          <Badge
            variant={item.isActive ? "default" : "secondary"}
            className={`rounded-full text-xs font-normal ${
              item.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {item.isActive ? "Hoạt động" : "Tạm khóa"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        width: "90px",
        align: "right",
        cell: (item) => {
          if (item.isSystem) {
            return <span className="text-muted-foreground text-xs">—</span>
          }

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleOpenEdit(item as ISalaryVariable)}
                title="Chỉnh sửa biến"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(item.id)}
                title="Xóa biến"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [page, limit],
  )

  if (view !== "list") {
    return (
      <SalaryVariableFormPage
        initialData={selectedItem}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    )
  }

  return (
    <DataTablePage<VariableRow>
      title="Biến hệ thống"
      description="Biến dùng cho công thức full-time và biến chỉnh sửa cho lương part-time (hệ số OT, đơn giá/giờ mặc định)."
      variant="viewport"
      data={paginatedVariables}
      columns={columns}
      isLoading={isLoading}
      keyExtractor={(item) => item.id}
      search={{
        value: searchTerm,
        onSearch: (val: string) => {
          setSearchTerm(val)
          setPage(1)
        },
        placeholder: "Tìm kiếm mã biến, tên biến...",
      }}
      primaryAction={{
        label: "Thêm biến mới",
        icon: Plus,
        onClick: handleOpenCreate,
      }}
      emptyState={{
        icon: SlidersHorizontal,
        title: "Không tìm thấy biến",
        description: "Không có biến tính lương nào phù hợp với từ khóa tìm kiếm.",
      }}
      pagination={
        filteredVariables.length > 0
          ? {
              currentPage: page,
              totalPages,
              totalItems: filteredVariables.length,
              itemsPerPage: limit,
              onPageChange: setPage,
              onItemsPerPageChange: (newLimit) => {
                setLimit(newLimit)
                setPage(1)
              },
            }
          : undefined
      }
    />
  )
}
