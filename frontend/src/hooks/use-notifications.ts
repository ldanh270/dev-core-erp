import { API_BASE_URL, API_ENDPOINTS } from "@/config/api.config"
import { NOTIFICATION_TYPE } from "@/config/entities/notification.config"
import apiClient from "@/lib/api-client"
import { routerNavigate } from "@/lib/router-navigator"
import { useAuthStore } from "@/store/auth-store"
import type { NotificationItem, NotificationListResponse } from "@/types/notification.types"

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

/**
 * State and actions consumed by the notification bell.
 *
 * @typedef {object} NotificationInboxState
 * @property {NotificationItem[]} notifications - Currently displayed inbox items.
 * @property {number} unreadCount - Number of unread notifications.
 * @property {boolean} isLoading - Whether an inbox request is in progress.
 * @property {(id: string) => Promise<void>} markAsRead - Marks one notification as read.
 * @property {() => Promise<void>} markAllAsRead - Marks all notifications as read.
 * @property {(id: string) => Promise<void>} deleteNotification - Hides a notification from the inbox.
 * @property {() => Promise<void>} refetch - Reloads the inbox from the server.
 */
/**
 * Keeps the notification bell in sync with the saved inbox and realtime events.
 *
 * @returns {NotificationInboxState} Inbox contents, unread state, and available actions.
 */
export function useNotifications() {
  const { isAuthenticated, accessToken } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const isMountedRef = useRef(true)
  /**
   * Tracks the latest inbox request so an earlier response cannot replace newer data.
   * @type {{ current: number }}
   */
  const latestFetchRef = useRef(0)

  /**
   * Refreshes inbox contents and the authoritative unread count.
   * @returns {Promise<void>} Resolves when the refresh has been handled.
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return

    /**
     * Identifies the inbox request that may update the displayed state.
     * @type {number}
     */
    const requestId = ++latestFetchRef.current
    setIsLoading(true)

    try {
      const response = await apiClient.get<{
        data: NotificationListResponse
        error: null | { message: string }
      }>(API_ENDPOINTS.NOTIFICATIONS.BASE)

      if (response.data.data && isMountedRef.current && requestId === latestFetchRef.current) {
        setNotifications(response.data.data.notifications)
        setUnreadCount(response.data.data.unreadCount)
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      if (isMountedRef.current && requestId === latestFetchRef.current) setIsLoading(false)
    }
  }, [isAuthenticated])

  /**
   * Marks one notification as read and reconciles the inbox if the update fails.
   * @param {string} id - Notification identifier.
   * @returns {Promise<void>} Resolves when the read update has been handled.
   */
  const markAsRead = useCallback(
    async (id: string) => {
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
    },
    [fetchNotifications],
  )

  /**
   * Marks all inbox notifications as read.
   * @returns {Promise<void>} Resolves when the bulk update has been handled.
   */
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

  /**
   * Removes a notification from the current employee’s inbox.
   * @param {string} id - Notification identifier.
   * @returns {Promise<void>} Resolves when the removal has been handled.
   */
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
    const latestFetch = latestFetchRef
    void fetchNotifications()

    return () => {
      isMountedRef.current = false
      latestFetch.current++
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

      /**
       * Tracks notification identifiers already delivered on this stream.
       * @type {Set<string>}
       */
      const receivedIds = new Set<string>()
      /**
       * Reloads saved notifications when the realtime connection opens or reconnects.
       * @returns {void}
       */
      eventSource.onopen = () => {
        // Recover persisted notifications sent while this connection was offline.
        void fetchNotifications()
      }

      /**
       * Refreshes the inbox and displays a toast for a new notification.
       * @param {MessageEvent<string>} event - Notification payload or stream control message.
       * @returns {void}
       */
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationItem & { type?: string }

          if (data?.id && data.title && !receivedIds.has(data.id)) {
            receivedIds.add(data.id)
            // The server is authoritative for unread totals and recipient-specific state.
            void fetchNotifications()

            // Pop up immediate top-right toast notification
            const showToast =
              data.type === NOTIFICATION_TYPE.SUCCESS
                ? toast.success
                : data.type === NOTIFICATION_TYPE.WARNING
                  ? toast.warning
                  : data.type === NOTIFICATION_TYPE.ERROR
                    ? toast.error
                    : toast.info

            const link = data.link

            showToast(data.title, {
              description: data.message,
              duration: 6000,
              action: link
                ? {
                    label: "Xem",
                    onClick: () => routerNavigate(link),
                  }
                : undefined,
            })
          }
        } catch {
          // Ignore non-json or handshake keep-alive messages
        }
      }

      /**
       * Records a stream interruption while EventSource handles reconnection.
       * @param {Event} error - EventSource error event.
       * @returns {void}
       */
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
  }, [isAuthenticated, accessToken, fetchNotifications])

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
