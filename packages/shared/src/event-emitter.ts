export class EventEmitter<T extends Record<string | symbol, any>> {
  private eventMap: Map<keyof T, T[keyof T][]> = new Map();

  private eventMapCache: Map<keyof T, T[keyof T][]> = new Map();

  on<K extends keyof T>(eventName: K, listener: T[K]) {
    if (!this.eventMap.has(eventName)) {
      this.eventMap.set(eventName, []);
    }
    this.eventMap.get(eventName)!.push(listener);
    return this;
  }

  emit<K extends keyof T>(eventName: K, ...args: Parameters<T[K]>) {
    const listeners = this.eventMap.get(eventName);
    if (!listeners || listeners.length === 0) return false;
    listeners.forEach(listener => {
      listener(...args);
    });
    return true;
  }

  off<K extends keyof T>(eventName: K, listener: T[K]) {
    if (this.eventMap.has(eventName)) {
      const filtered = this.eventMap.get(eventName)!.filter(item => item !== listener);
      if (!filtered.length) {
        this.eventMap.delete(eventName);
      } else {
        this.eventMap.set(eventName, filtered);
      }
    }
    return this;
  }

  clear() {
    // 所有事件缓存一份方便reset
    // 这么做是因为model在被移除的时候，要清空事件，但是在undo的时候，还需要在重新把事件设置回来
    this.eventMapCache.clear();
    const entries = this.eventMap.entries();
    for (const [eventName, listeners] of entries) {
      this.eventMapCache.set(eventName, listeners);
    }
    this.eventMap.clear();
  }

  reset() {
    this.eventMap.clear();
    const entries = this.eventMapCache.entries();
    for (const [eventName, listeners] of entries) {
      this.eventMap.set(eventName, listeners);
    }
  }
}

export default EventEmitter;
