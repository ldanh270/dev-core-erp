import type { CreateNotificationDto, Notification } from "@/types/notification.types.ts"

import { EventEmitter } from "events"

/**
 * Maps domain event names to their payload types.
 * Provides compile-time payload checking for event publishers and subscribers.
 */
export interface DomainEvents {
  "notification:create": CreateNotificationDto
  "notification:broadcast": Notification
}

/**
 * Shared event bus implementing the Observer pattern.
 * Decouples event publishers from subscribers across application modules.
 */
class AppEventBus extends EventEmitter {
  /**
   * Initializes the event emitter and configures its listener warning threshold.
   */
  constructor() {
    // Initialize the Node.js event subscription and delivery mechanism.
    super()

    // Warn when an event has more than 200 listeners.
    // This threshold does not impose a hard limit on subscriptions.
    this.setMaxListeners(200)
  }

  /**
   * Publishes a domain event with its corresponding payload type.
   */
  emitTyped<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): boolean {
    // Deliver the payload to registered listeners.
    // Return whether the event had any listeners.
    return this.emit(event, payload)
  }

  /**
   * Registers a type-safe listener for a domain event.
   */
  onTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    // Register a domain event callback with its payload type inferred from the event name.
    return this.on(event, listener)
  }

  /**
   * Removes a previously registered domain event listener.
   */
  offTyped<K extends keyof DomainEvents>(
    event: K,
    listener: (payload: DomainEvents[K]) => void,
  ): this {
    // Remove the same callback reference that was passed to onTyped.
    return this.off(event, listener)
  }

  /**
   * Publishes a notification to the channel of a specific employee.
   */
  emitNotification(employeeId: string, notification: Notification): boolean {
    // Publish on the employee-specific channel.
    // Only listeners registered on this channel receive the notification.
    return this.emit(`notification:${employeeId}`, notification)
  }

  /**
   * Registers a notification listener on an employee-specific channel.
   */
  onNotification(employeeId: string, listener: (notification: Notification) => void): this {
    // Subscribe to the employee-specific channel for delivery through consumers such as SSE.
    return this.on(`notification:${employeeId}`, listener)
  }

  /**
   * Removes a notification listener from an employee-specific channel.
   */
  offNotification(employeeId: string, listener: (notification: Notification) => void): this {
    // Remove the exact callback when no longer needed, such as after an SSE connection closes.
    return this.off(`notification:${employeeId}`, listener)
  }
}

/**
 * Shared instance used by application modules to publish and subscribe on the same event bus.
 */
export const eventBus = new AppEventBus()
