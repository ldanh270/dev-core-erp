import {
  type DataTableColumn,
  StatusPill,
  TABLE_COL_WIDTH,
  getTableColWidthPx,
  useConfirm,
} from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CONTRACT_STATUS,
  CONTRACT_TYPE_LABELS,
  getContractStatusVariant,
} from "@/config/entities/employee-contract.config"
import { formatCurrency } from "@/lib/utils"
import type { IContract } from "@/types/employee-contract.types"

import { useMemo } from "react"
import { MoreHorizontal } from "lucide-react"

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

interface UseContractsColumnsProps {
  confirm: ReturnType<typeof useConfirm>
  onEdit: (contract: IContract) => void
  onRenew: (contract: IContract) => void
  onTerminate: (contract: IContract) => void
  onSignContract: (
    contract: IContract,
    confirmFn: ReturnType<typeof useConfirm>,
  ) => Promise<void>
}

export function useContractsColumns({
  confirm,
  onEdit,
  onRenew,
  onTerminate,
  onSignContract,
}: UseContractsColumnsProps) {
  return useMemo<DataTableColumn<IContract>[]>(
    () => [
      {
        id: "contractNumber",
        header: "Số hợp đồng",
        width: getTableColWidthPx("CODE"),
        minWidth: `${TABLE_COL_WIDTH.CODE}px`,
        sticky: true,
        cell: (contract) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground inline-block">
            {contract.contractNumber}
          </span>
        ),
      },
      {
        id: "title",
        header: "Tiêu đề",
        width: getTableColWidthPx("TITLE"),
        minWidth: `${TABLE_COL_WIDTH.TITLE}px`,
        cell: (contract) => (
          <span className="text-xs font-medium text-foreground truncate max-w-[200px] inline-block">
            {contract.title || "—"}
          </span>
        ),
      },
      {
        id: "contractType",
        header: "Loại hợp đồng",
        width: getTableColWidthPx("TYPE"),
        minWidth: `${TABLE_COL_WIDTH.TYPE}px`,
        cell: (contract) => (
          <span className="text-xs font-medium text-foreground">
            {CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}
          </span>
        ),
      },
      {
        id: "salary",
        header: "Lương cơ bản",
        align: "right",
        width: getTableColWidthPx("CURRENCY"),
        minWidth: `${TABLE_COL_WIDTH.CURRENCY}px`,
        cell: (contract) => (
          <span className="font-semibold text-xs text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(contract.salary)}
          </span>
        ),
      },
      {
        id: "startDate",
        header: "Ngày bắt đầu",
        width: getTableColWidthPx("DATE"),
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        cell: (contract) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(contract.startDate)}
          </span>
        ),
      },
      {
        id: "endDate",
        header: "Ngày kết thúc",
        width: getTableColWidthPx("DATE"),
        minWidth: `${TABLE_COL_WIDTH.DATE}px`,
        cell: (contract) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(contract.endDate)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Trạng thái",
        width: getTableColWidthPx("STATUS"),
        minWidth: `${TABLE_COL_WIDTH.STATUS}px`,
        align: "center",
        cell: (contract) => (
          <StatusPill
            label={contract.status}
            variant={getContractStatusVariant(contract.status)}
          />
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        align: "center",
        width: getTableColWidthPx("ACTIONS"),
        minWidth: `${TABLE_COL_WIDTH.ACTIONS}px`,
        cell: (contract) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Thao tác"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem
                  onClick={() => {
                    onEdit(contract)
                  }}
                  className="cursor-pointer"
                >
                  Chỉnh sửa hợp đồng
                </DropdownMenuItem>
                {contract.status === CONTRACT_STATUS.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => {
                      onTerminate(contract)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Chấm dứt hợp đồng
                  </DropdownMenuItem>
                )}
                {contract.status === CONTRACT_STATUS.PENDING_SIGNATURE && (
                  <DropdownMenuItem
                    onClick={() => {
                      void onSignContract(contract, confirm)
                    }}
                    className="cursor-pointer text-primary font-medium focus:text-primary"
                  >
                    Ký hợp đồng
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    onRenew(contract)
                  }}
                  className="cursor-pointer"
                >
                  Gia hạn hợp đồng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [confirm, onEdit, onRenew, onSignContract, onTerminate],
  )
}
