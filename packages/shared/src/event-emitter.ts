export class EventEmitter<T extends Record<string | symbol, any>> {
  private eventMap: Map<keyof T, T[keyof T][]> = new Map();

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
    this.eventMap.clear();
  }
}

export default EventEmitter;
