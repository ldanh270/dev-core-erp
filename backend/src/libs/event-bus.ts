import { EventEmitter } from "events"
import { CreateNotificationDto, Notification } from "@/types/notification.types.ts"

/**
 * Domain Events interface for known system events.
 */
export interface DomainEvents {
  "notification:create": CreateNotificationDto
  "notification:broadcast": Notification
}

/**
 * Global typed domain Event Bus following the Observer pattern (docs/design-patterns.md §6).
 * Decouples domain event publishers from event subscribers (such as notifications).
 */
class AppEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(200)
  }

  emitTyped<K extends keyof DomainEvents>(event: K, payload: DomainEvents[K]): boolean {
    return this.emit(event, payload)
  }

  onTyped<K extends keyof DomainEvents>(event: K, listener: (payload: DomainEvents[K]) => void): this {
    return this.on(event, listener)
  }

  offTyped<K extends keyof DomainEvents>(event: K, listener: (payload: DomainEvents[K]) => void): this {
    return this.off(event, listener)
  }

  emitNotification(employeeId: string, notification: Notification): boolean {
    return this.emit(`notification:${employeeId}`, notification)
  }

  onNotification(employeeId: string, listener: (notification: Notification) => void): this {
    return this.on(`notification:${employeeId}`, listener)
  }

  offNotification(employeeId: string, listener: (notification: Notification) => void): this {
    return this.off(`notification:${employeeId}`, listener)
  }
}

export const eventBus = new AppEventBus()
