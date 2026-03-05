/**
 * eventBusService.ts - Lightweight in-process typed event bus
 *
 * This is NOT related to Electron IPC. It allows renderer components and
 * services to communicate without tight coupling.
 */

type EventBusCallback<T> = (data: T) => void;

class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly listeners: Map<string, Set<EventBusCallback<any>>> = new Map();

  /**
   * Subscribe to an event.
   * Re-subscribing the same callback for the same event has no effect.
   */
  on<T>(event: string, cb: EventBusCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb as EventBusCallback<unknown>);
  }

  /**
   * Unsubscribe a previously registered callback.
   */
  off<T>(event: string, cb: EventBusCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(cb as EventBusCallback<unknown>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event and invoke all registered callbacks synchronously.
   */
  emit<T>(event: string, data: T): void {
    const set = this.listeners.get(event);
    if (!set) return;

    // Iterate over a snapshot so that on/off calls inside a callback are safe.
    for (const cb of Array.from(set)) {
      cb(data);
    }
  }
}

export const eventBus = new EventBus();
