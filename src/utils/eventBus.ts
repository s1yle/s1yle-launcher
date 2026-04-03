type Listener<T> = (data: T) => void;

interface Subscription {
  unsubscribe: () => void;
}

class EventBus {
  private listeners: Map<string, Set<Listener<unknown>>> = new Map();

  on<T>(event: string, listener: Listener<T>): Subscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);

    return {
      unsubscribe: () => {
        this.off(event, listener);
      },
    };
  }

  off<T>(event: string, listener: Listener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Listener<unknown>);
    }
  }

  emit<T>(event: string, data?: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          (listener as Listener<T>)(data as T);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  once<T>(event: string, listener: Listener<T>): Subscription {
    const unsubscribe = this.on(event, (data: T) => {
      unsubscribe.unsubscribe();
      listener(data);
    });
    return unsubscribe;
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = new EventBus();

export const AppEvents = {
  INSTANCE_CREATED: 'instance:created',
  INSTANCE_DELETED: 'instance:deleted',
  INSTANCE_RENAMED: 'instance:renamed',
  INSTANCE_LAUNCHED: 'instance:launched',
  INSTANCE_STOPPED: 'instance:stopped',
  DOWNLOAD_STARTED: 'download:started',
  DOWNLOAD_COMPLETED: 'download:completed',
  DOWNLOAD_FAILED: 'download:failed',
  DEPLOY_COMPLETED: 'deploy:completed',
  DEPLOY_FAILED: 'deploy:failed',
  ACCOUNT_ADDED: 'account:added',
  ACCOUNT_DELETED: 'account:deleted',
  ACCOUNT_CHANGED: 'account:changed',
  LANGUAGE_CHANGED: 'language:changed',
  THEME_CHANGED: 'theme:changed',
} as const;

export type AppEventType = typeof AppEvents[keyof typeof AppEvents];
