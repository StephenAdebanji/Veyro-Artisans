import { EventEmitter } from "node:events";
import type { DomainEvent, DomainEventOf, DomainEventType } from "@veyro/contracts";

type Handler<T extends DomainEventType> = (event: DomainEventOf<T>) => void | Promise<void>;

/**
 * In-process typed pub/sub. Stands in for a real message broker (SQS/RabbitMQ/Kafka)
 * once a service is physically extracted — callers only ever see `publish`/`subscribe`,
 * never the EventEmitter underneath, so swapping the transport later doesn't touch
 * any service code.
 */
class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  publish(event: DomainEvent): void {
    this.emitter.emit(event.type, event);
  }

  subscribe<T extends DomainEventType>(type: T, handler: Handler<T>): void {
    this.emitter.on(type, (event: DomainEventOf<T>) => {
      Promise.resolve(handler(event)).catch((error: unknown) => {
        console.error(`[event-bus] handler for "${type}" failed`, error);
      });
    });
  }
}

export const eventBus = new EventBus();
