"use client"

import { PageCard, PageContainer, PageHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TYPOGRAPHY } from "@/config/typography.config"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

import { Plus } from "lucide-react"

interface LeavesSummaryTabProps {
  subHeader?: ReactNode
  onOpenCreate: () => void
  extraContent?: ReactNode
}

/** Renders the personal leave entitlement summary and quotas. */
export function LeavesSummaryTab({ subHeader, onOpenCreate, extraContent }: LeavesSummaryTabProps) {
  return (
    <PageContainer variant="table">
      <PageHeader
        title="Đơn của tôi"
        description="Tra cứu, theo dõi và quản lý đơn từ cá nhân."
        actions={
          <Button
            size="default"
            className="rounded-full shadow-xs gap-2 font-medium"
            onClick={onOpenCreate}
          >
            <Plus size={15} strokeWidth={2.5} />
            Tạo đơn
          </Button>
        }
      />
      {subHeader}
      <PageCard
        padding="none"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs"
      >
        <div className="overflow-x-auto p-4">
          <Table className="text-sm">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className={cn("text-center", TYPOGRAPHY.TABLE_HEADER)}>
                  Số phép
                </TableHead>
                <TableHead className={cn("text-center", TYPOGRAPHY.TABLE_HEADER)}>
                  Đã dùng
                </TableHead>
                <TableHead className={cn("text-center", TYPOGRAPHY.TABLE_HEADER)}>
                  Còn lại
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableCell
                  className={cn("py-6 text-center text-lg font-bold", TYPOGRAPHY.CELL_CODE)}
                >
                  7
                </TableCell>
                <TableCell
                  className={cn("py-6 text-center text-lg font-bold", TYPOGRAPHY.CELL_CODE)}
                >
                  0
                </TableCell>
                <TableCell
                  className={cn(
                    "py-6 text-center text-lg font-bold text-primary",
                    TYPOGRAPHY.CELL_CODE,
                  )}
                >
                  7
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </PageCard>
      {extraContent}
    </PageContainer>
  )
}
