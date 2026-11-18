import type { ChatStreamEvent } from "@/types/chat.types.ts"
import type { CreateNotificationDto, Notification } from "@/types/notification.types.ts"

import { EventEmitter } from "events"

/**
 * Maps domain event names to their payload types.
 * Provides compile-time payload checking for event publishers and subscribers.
 */
export interface DomainEvents {
  "notification:create": CreateNotificationDto
  "notification:broadcast": Notification
  /** Recipient-targeted chat event forwarded by the WebSocket gateway. */
  "chat:message": { recipientEmployeeId: string; event: ChatStreamEvent }
}

/**
 * Shared event bus implementing the Observer pattern.
 * Decouples event publishers from subscribers across application modules.
 */
class AppEventBus extends EventEmitter {
  /**
   * Initializes the event emitter with a warning threshold of 200 listeners.
   * The threshold warns about unusually high fan-out but does not limit subscriptions.
   */
  constructor() {
    super()
    this.setMaxListeners(200)
  }

  /**
   * Publishes a domain event with its corresponding payload type.
   */
  emitTyped<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): boolean {
    return this.emit(event, payload)
  }

  /**
   * Registers a type-safe listener for a domain event.
   */
  onTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    return this.on(event, listener)
  }

  /**
   * Removes a previously registered domain event listener.
   */
  offTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    return this.off(event, listener)
  }

  /**
   * Publishes a notification to the channel of a specific employee.
   */
  emitNotification(employeeId: string, notification: Notification): boolean {
    return this.emit(`notification:${employeeId}`, notification)
  }

  /**
   * Registers a notification listener on an employee-specific channel.
   */
  onNotification(employeeId: string, listener: (notification: Notification) => void): this {
    return this.on(`notification:${employeeId}`, listener)
  }

  /**
   * Removes a notification listener from an employee-specific channel.
   */
  offNotification(employeeId: string, listener: (notification: Notification) => void): this {
    return this.off(`notification:${employeeId}`, listener)
  }

  /**
   * Publishes one recipient-targeted chat event to the Socket.IO gateway.
   * Callers emit once per participant; this bus is not a cross-process broker.
   */
  emitChatMessage(recipientEmployeeId: string, event: ChatStreamEvent): boolean {
    return this.emitTyped("chat:message", { recipientEmployeeId, event })
  }
}

/**
 * Shared instance used by application modules to publish and subscribe on the same event bus.
 */
export const eventBus = new AppEventBus()
