import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from "@/config/entities/employee-contract.config"
import { useEmployeeContracts } from "@/hooks/employee-contract/use-contracts"
import { formatCurrency } from "@/lib/utils"
import type { IContract } from "@/types/employee-contract.types"

import { CheckCircle2, FileText, Pencil, RefreshCw, Trash2 } from "lucide-react"

interface ContractListProps {
  employeeId: string
  onEdit?: (contract: IContract) => void
  onTerminate?: (contract: IContract) => void
  onRenew?: (contract: IContract) => void
  onCreateContract?: () => void
  onSign?: (contract: IContract) => void
}

export function ContractList({
  employeeId,
  onEdit,
  onTerminate,
  onRenew,
  onCreateContract,
  onSign,
}: ContractListProps) {
  const { data: contracts, isLoading } = useEmployeeContracts(employeeId)

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
      case "pending_signature":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
      case "draft":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
      case "expired":
        return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
      case "terminated":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusBadge = (status: IContract["status"]) => {
    return (
      <Badge
        variant="outline"
        className={`rounded-full shadow-none font-medium px-2.5 py-0.5 border ${getStatusBadgeClass(status)}`}
      >
        {new Map(Object.entries(CONTRACT_STATUS_LABELS)).get(status) || status}
      </Badge>
    )
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("vi-VN")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground text-sm">Đang tải hợp đồng...</p>
      </div>
    )
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-card gap-3 text-center">
        <FileText className="w-9 h-9 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Chưa có hợp đồng lao động nào</p>
          <p className="text-xs text-muted-foreground">
            Nhân sự này chưa được thiết lập hợp đồng lao động trong hệ thống.
          </p>
        </div>
        {onCreateContract && (
          <Button
            onClick={onCreateContract}
            variant="outline"
            size="sm"
            className="rounded-full mt-2"
          >
            Tạo hợp đồng ngay
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Số HĐ
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Loại
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Ngày bắt đầu
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Ngày kết thúc
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase text-right">
              Lương
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              Trạng thái
            </TableHead>
            <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase w-12">
              {/* Actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="px-4 py-3 font-medium">{contract.contractNumber}</TableCell>
              <TableCell className="px-4 py-3">
                {CONTRACT_TYPE_LABELS[contract.contractType]}
              </TableCell>
              <TableCell className="px-4 py-3">{formatDate(contract.startDate)}</TableCell>
              <TableCell className="px-4 py-3">
                {contract.endDate ? formatDate(contract.endDate) : "Không thời hạn"}
              </TableCell>
              <TableCell className="px-4 py-3 text-right font-medium">
                {formatCurrency(contract.salary)}
              </TableCell>
              <TableCell className="px-4 py-3">{getStatusBadge(contract.status)}</TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {onEdit && contract.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        onEdit(contract)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onSign && contract.status === "pending_signature" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary/10"
                      onClick={() => {
                        onSign(contract)
                      }}
                      title="Ký hợp đồng"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onTerminate && contract.status === "active" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        onTerminate(contract)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onRenew && (contract.status === "active" || contract.status === "expired") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        onRenew(contract)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
