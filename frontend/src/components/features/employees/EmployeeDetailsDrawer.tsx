import { AppDrawer, StatusPill, useConfirm } from "@/components/common"
import { ContractList } from "@/components/employee-contract/ContractList"
import { ContractModal, type ContractModalMode } from "@/components/employee-contract/ContractModal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getEmployeeStatusLabel,
  getEmployeeStatusVariant,
  getEmployeeTypeLabel,
  getRoleLabel,
  getWorkScheduleTypeLabel,
} from "@/config/entities/employee.config"
import { useUpdateContract } from "@/hooks/employee-contract/use-contracts"
import { useEmployee } from "@/hooks/employees/queries/useEmployeeQuery"
import type { IContract } from "@/types/employee-contract.types"
import type { Employee } from "@/types/employee.types"

import { useState } from "react"

import {
  Briefcase,
  Building,
  Calendar,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
} from "lucide-react"
import { toast } from "sonner"

/**
 * Prop definitions for EmployeeDetailsDrawer component.
 */
interface EmployeeDetailsDrawerProps {
  /** The unique ID of the employee to load, or null to close the drawer */
  employeeId: string | null
  /** Callback triggered to close the details drawer */
  onClose: () => void
  /** Optional callback to open the edit dialog/drawer for this employee */
  onEdit?: (employee: Employee) => void
}

/**
 * EmployeeDetailsDrawer Component.
 * Slide-out drawer displaying exhaustive details for a specific employee profile.
 * Renders loading states (skeleton), errors, basic information, organizational metrics, and employment contract records.
 */
export function EmployeeDetailsDrawer({ employeeId, onClose }: EmployeeDetailsDrawerProps) {
  // Query hook to fetch employee details by their ID (reacts to changes in employeeId)
  const { data: employee, isLoading, error } = useEmployee(employeeId || "")

  // State for Contract Modal management
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractModalMode, setContractModalMode] = useState<ContractModalMode>("create")
  const [selectedContract, setSelectedContract] = useState<IContract | null>(null)

  const confirm = useConfirm()
  const updateMutation = useUpdateContract()

  const handleCreateContract = () => {
    setContractModalMode("create")
    setSelectedContract(null)
    setIsContractModalOpen(true)
  }

  const handleEditContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("edit")
    setIsContractModalOpen(true)
  }

  const handleRenewContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("renew")
    setIsContractModalOpen(true)
  }

  const handleTerminateContract = (contract: IContract) => {
    setSelectedContract(contract)
    setContractModalMode("terminate")
    setIsContractModalOpen(true)
  }

  const handleSignContract = async (contract: IContract) => {
    const isConfirmed = await confirm({
      title: "Ký hợp đồng lao động",
      description: `Bạn có chắc chắn muốn xác nhận ký hợp đồng số ${contract.contractNumber}? Trạng thái hợp đồng sẽ chuyển sang "Đang hiệu lực".`,
    })

    if (!isConfirmed) return

    const toastId = toast.loading("Đang thực hiện ký hợp đồng...")
    try {
      await updateMutation.mutateAsync({
        id: contract.id,
        data: {
          status: "active",
          signedDate: new Date().toISOString().slice(0, 10),
        },
      })
      toast.dismiss(toastId)
    } catch (_error) {
      toast.dismiss(toastId)
    }
  }

  /**
   * Formats a date string into Vietnamese localized format (DD/MM/YYYY).
   * @param dateStr ISO date string.
   * @returns Localized date string or placeholder text.
   */
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Chưa cập nhật"
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <AppDrawer isOpen={!!employeeId} onClose={onClose}>
      {/* ── Loading Skeleton State ───────────────────────────────── */}
      {isLoading && (
        <div className="p-8 space-y-8 animate-in fade-in duration-300 mt-6">
          <div className="flex gap-4 items-center">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full col-span-2 rounded-xl" />
          </div>
        </div>
      )}

      {/* ── Error / Missing Record State ─────────────────────────── */}
      {!isLoading && (error || (!employee && employeeId)) && (
        <div className="p-8 flex flex-col items-center justify-center text-center h-full">
          <h2 className="text-lg font-medium text-destructive mb-1">Không thể tải hồ sơ</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Đã có lỗi xảy ra hoặc nhân sự không tồn tại.
          </p>
          <Button onClick={onClose} variant="outline" size="sm">
            Đóng
          </Button>
        </div>
      )}

      {/* ── Main Details Viewport ────────────────────────────────── */}
      {!isLoading && employee && (
        <div className="animate-in fade-in duration-300">
          {/* Header Section: Profile Cover, Avatar, Name & Quick Actions */}
          <div className="px-10 pt-14 pb-8 bg-muted/20 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 rounded-full bg-background border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                {employee.avatar?.url ? (
                  <img
                    src={employee.avatar.url}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {employee.fullName}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                  <span className="font-mono bg-background border border-border px-1.5 py-0.5 rounded text-[11px]">
                    {employee?.id ? employee.id.slice(-6).toUpperCase() : "—"}
                  </span>
                  <span>@{employee.username}</span>
                </div>
                <div className="pt-2">
                  <StatusPill
                    label={getEmployeeStatusLabel(employee.status)}
                    variant={getEmployeeStatusVariant(employee.status)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Core Info Details Body */}
          <div className="p-10 space-y-8">
            {/* Bento Grid: Organization metrics (Title, Role, Contract) */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Tổ chức & Vị trí
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <Briefcase size={14} />
                    <span className="text-[12px] font-medium">Chức danh</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6">
                    {employee.position || "—"}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <User size={14} />
                    <span className="text-[12px] font-medium">Phân quyền hệ thống</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6 capitalize">
                    {employee.role ? getRoleLabel(employee.role) : "—"}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <Building size={14} />
                    <span className="text-[12px] font-medium">Loại nhân sự</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6">
                    {getEmployeeTypeLabel(employee.employeeType)}
                  </div>
                </div>
                {/* workScheduleType drives PT availability/payroll; not the same as employeeType. */}
                <div className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
                    <Building size={14} />
                    <span className="text-[12px] font-medium">Hình thức làm việc</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium pl-6">
                    {getWorkScheduleTypeLabel(employee.workScheduleType)}
                  </div>
                </div>
              </div>
            </section>

            {/* Employment Contracts Management Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText size={15} /> Hợp đồng lao động
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateContract}
                  className="rounded-full text-xs h-8 gap-1 border-border"
                >
                  <Plus size={14} /> Tạo hợp đồng
                </Button>
              </div>
              <ContractList
                employeeId={employee.id}
                onEdit={handleEditContract}
                onRenew={handleRenewContract}
                onTerminate={handleTerminateContract}
                onCreateContract={handleCreateContract}
                onSign={handleSignContract}
              />
            </section>

            {/* List Group: Contact details (Email, Phone, Address) */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Liên hệ
              </h3>
              <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Email</span>
                  </div>
                  <span className="text-[14px] font-medium">{employee.email}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Điện thoại</span>
                  </div>
                  <span className="text-[14px] font-medium">{employee.phone || "—"}</span>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin size={16} strokeWidth={1.5} />
                    <span className="text-[13px]">Địa chỉ thường trú</span>
                  </div>
                  <span className="text-[14px] font-medium pl-7 leading-snug">
                    {employee.address || "—"}
                  </span>
                </div>
              </div>
            </section>

            {/* Bento Grid: Personal Dates & Identity numbers */}
            <section>
              <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Hồ sơ cá nhân
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày sinh</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.dateOfBirth)}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Hash size={14} />
                    <span className="text-[12px] font-medium">CCCD / CMND</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium font-mono">
                    {employee.nationalId || "—"}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày vào làm</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.startDate)}
                  </div>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar size={14} />
                    <span className="text-[12px] font-medium">Ngày kết thúc HĐ</span>
                  </div>
                  <div className="text-[14px] text-foreground font-medium">
                    {formatDate(employee.endDate)}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Contract Management Modal */}
      {employee && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false)
          }}
          employeeId={employee.id}
          mode={contractModalMode}
          contract={selectedContract}
        />
      )}
    </AppDrawer>
  )
}
