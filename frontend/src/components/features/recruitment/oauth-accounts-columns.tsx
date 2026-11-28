import type { DataTableColumn } from "@/components/common"
import { StatusPill } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { getTableColWidthPx } from "@/config/table-columns.config"
import { TYPOGRAPHY } from "@/config/typography.config"
import type { OAuthAccount } from "@/lib/api/recruitment.api"
import { cn } from "@/lib/utils"

import { Link2, RefreshCw, Trash2 } from "lucide-react"

function getChannelLabel(channel: string): string {
  return POSTING_CHANNELS.find((ch) => ch.value === channel)?.label || channel
}

export interface OAuthAccountsColumnsOptions {
  onOpenConnect: (channel?: string, accountId?: string) => void
  onDelete: (id: string, name?: string) => void
}

/**
 * Factory function defining data table column schema for connected OAuth accounts.
 */
export function getOAuthAccountsColumns({
  onOpenConnect,
  onDelete,
}: OAuthAccountsColumnsOptions): DataTableColumn<OAuthAccount>[] {
  return [
    {
      id: "account",
      header: "Tên tài khoản / Mã ID",
      minWidth: getTableColWidthPx("TITLE"),
      sticky: true,
      cell: (account) => (
        <div className="flex items-center gap-2.5">
          <Link2 className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className={cn(TYPOGRAPHY.CELL_PRIMARY, "truncate")}>
              {account.name || "Default Account"}
            </div>
            <div className={cn(TYPOGRAPHY.CELL_CODE, "mt-0.5 truncate")}>ID: {account.id}</div>
          </div>
        </div>
      ),
    },
    {
      id: "channel",
      header: "Kênh tuyển dụng",
      minWidth: getTableColWidthPx("TYPE"),
      cell: (account) => (
        <span
          className={cn(
            TYPOGRAPHY.STATUS_PILL,
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-foreground border border-border",
          )}
        >
          {getChannelLabel(account.channel)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      minWidth: getTableColWidthPx("STATUS"),
      cell: (account) => {
        const isConnected = account.hasRefreshToken
        return (
          <StatusPill
            label={isConnected ? "Đã kết nối" : "Chưa xác thực"}
            variant={isConnected ? "success" : "warning"}
          />
        )
      },
    },
    {
      id: "createdAt",
      header: "Ngày kết nối",
      minWidth: getTableColWidthPx("DATE"),
      hideBelow: "md",
      cell: (account) => (
        <span className={TYPOGRAPHY.CELL_DATE}>
          {new Date(account.createdAt).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      width: getTableColWidthPx("ACTIONS"),
      align: "right",
      cell: (account) => {
        const isConnected = account.hasRefreshToken
        return (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {!isConnected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenConnect(account.channel, account.id)
                    }}
                    className="h-8 px-2.5 text-xs rounded-full gap-1 border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Xác thực lại
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cấp lại quyền OAuth cho tài khoản này</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onDelete(account.id, account.name)
                  }}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hủy liên kết tài khoản</TooltipContent>
            </Tooltip>
          </div>
        )
      },
    },
  ]
}
