import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config"
import { routerNavigate } from "@/lib/router-navigator"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/store/auth-store"
import type { NotificationItem, NotificationListResponse } from "@/types/notification.types"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export function useNotifications() {
  const { isAuthenticated, accessToken } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const isMountedRef = useRef(true)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const response = await apiClient.get<{
        data: NotificationListResponse
        error: null | { message: string }
      }>(API_ENDPOINTS.NOTIFICATIONS.BASE)

      if (response.data.data && isMountedRef.current) {
        setNotifications(response.data.data.notifications)
        setUnreadCount(response.data.data.unreadCount)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      void fetchNotifications()
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)

    try {
      await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL)
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      void fetchNotifications()
    }
  }, [fetchNotifications])

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((item) => item.id !== id))
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      try {
        await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id))
      } catch (error) {
        console.error("Failed to delete notification:", error)
        void fetchNotifications()
      }
    },
    [notifications, fetchNotifications],
  )

  useEffect(() => {
    isMountedRef.current = true
    void fetchNotifications()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchNotifications])

  // Native Browser EventSource for Real-Time SSE
  useEffect(() => {
    if (!isAuthenticated) return

    const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : ""
    const streamUrl = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.STREAM}${tokenParam}`

    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(streamUrl, { withCredentials: true })

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationItem & { type?: string }
          if (data && data.id && data.title) {
            // Prepend new real-time notification
            setNotifications((prev) => {
              if (prev.some((item) => item.id === data.id)) return prev
              return [data, ...prev]
            })
            setUnreadCount((prev) => prev + 1)

            // Pop up immediate top-right toast notification
            const showToast =
              data.type === "success"
                ? toast.success
                : data.type === "warning"
                  ? toast.warning
                  : data.type === "error"
                    ? toast.error
                    : toast.info

            showToast(data.title, {
              description: data.message,
              duration: 6000,
              action: data.link
                ? {
                    label: "Xem",
                    onClick: () => routerNavigate(data.link!),
                  }
                : undefined,
            })
          }
        } catch {
          // Ignore non-json or handshake keep-alive messages
        }
      }

      eventSource.onerror = (error) => {
        console.warn("EventSource notification stream error / reconnecting...", error)
      }
    } catch (err) {
      console.error("Failed to initialize EventSource:", err)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
    }
  }, [isAuthenticated, accessToken])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}
