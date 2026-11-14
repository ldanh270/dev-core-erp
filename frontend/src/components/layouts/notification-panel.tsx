import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotifications } from "@/hooks/use-notifications"
import { routerNavigate } from "@/lib/router-navigator"
import type { NotificationItem } from "@/types/notification.types"

import { useState } from "react"

import { Bell, Check, Trash2 } from "lucide-react"

function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return "Vừa xong"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

/**
 * NotificationPanel — Displays real-time notification bell with interactive dropdown.
 * Connects directly to backend SSE stream and REST endpoints.
 */
export default function NotificationPanel() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()

  const [open, setOpen] = useState(false)
  const displayCount = unreadCount > 9 ? "9+" : unreadCount

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      void markAsRead(item.id)
    }
    if (item.link) {
      routerNavigate(item.link)
      setOpen(false)
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    void deleteNotification(id)
  }

  const handleMarkSingleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    void markAsRead(id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative text-muted-foreground"
                aria-label="Thông báo"
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background">
                    <span className="text-[9px] font-bold text-primary-foreground leading-none">
                      {displayCount}
                    </span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Thông báo</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent align="end" className="w-84 rounded-xl p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground text-sm">Thông báo</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {unreadCount} mới
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              Đang tải thông báo...
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleNotificationClick(n)
                  }}
                  className={`group relative flex cursor-pointer flex-col gap-1 border-b border-border/50 px-4 py-3 transition-colors hover:bg-secondary/50 last:border-0 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-medium line-clamp-1 ${
                        !n.read ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {n.title}
                    </span>
                    <div className="flex items-center gap-1">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <button
                        onClick={(e) => {
                          handleDelete(e, n.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Xóa thông báo"
                      >
                        <Trash2 size={13} />
                      </button>
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            handleMarkSingleRead(e, n.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-primary transition-opacity"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                  <span className="text-[10px] text-muted-foreground/80 mt-1">
                    {formatNotificationTime(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Không có thông báo nào.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
