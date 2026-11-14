import { PayrollDetailSheet } from "@/components/payroll/PayrollDetailSheet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployeePayslipsHistory } from "@/hooks/payroll/use-payrolls"
import { formatCurrency } from "@/lib/utils"

import { useState } from "react"

import { FileText, Loader2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: { id: string; fullName: string; position?: string } | null
}

export default function EmployeePayslipHistoryDialog({ open, onOpenChange, employee }: Props) {
  const { data: payslips, isLoading } = useEmployeePayslipsHistory(
    open ? employee?.id || null : null,
  )

  const [selectedPayslip, setSelectedPayslip] = useState<{
    payrollId: string
    employeeId: string
  } | null>(null)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-162.5 max-h-[85vh] flex flex-col rounded-xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Lịch sử phiếu lương: {employee?.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {employee?.position || "Nhân viên"} • ID:{" "}
                  {employee?.id ? employee.id.slice(-6).toUpperCase() : "—"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !payslips || payslips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">Nhân sự này chưa có phiếu lương nào được tạo.</p>
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="min-w-12.5 px-4 py-3 font-medium text-xs text-muted-foreground uppercase text-center">
                      #
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap">
                      Kỳ lương
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-right">
                      Tổng thu nhập
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-right">
                      Tổng khấu trừ
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap text-right">
                      Thực nhận
                    </TableHead>
                    <TableHead className="px-4 py-3 font-medium text-xs text-muted-foreground uppercase whitespace-nowrap w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((payslip, index) => (
                    <TableRow
                      key={payslip.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => {
                        setSelectedPayslip({
                          payrollId: payslip.payrollId,
                          employeeId: payslip.employeeId,
                        })
                      }}
                    >
                      <TableCell className="px-4 py-3 text-center text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium">
                        {/* Assuming the backend populates payroll.periodMonth and periodYear, if not we fallback */}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(payslip as any).payroll?.periodMonth
                          ? /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                            `Tháng ${(payslip as any).payroll.periodMonth}/${(payslip as any).payroll.periodYear}`
                          : "Kỳ hiện tại"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-success font-medium">
                        +{formatCurrency(Number(payslip.totalAdditions))}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-destructive font-medium">
                        -{formatCurrency(Number(payslip.totalDeductions))}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-primary">
                        {formatCurrency(Number(payslip.netSalary))}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                          &rarr;
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="px-6 py-3 border-t bg-muted/10 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full h-8"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPayslip && (
        <PayrollDetailSheet
          payrollId={selectedPayslip.payrollId}
          onClose={() => {
            setSelectedPayslip(null)
          }}
        />
      )}
    </>
  )
}
