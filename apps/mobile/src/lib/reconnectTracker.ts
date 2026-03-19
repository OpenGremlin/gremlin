export class ReconnectTracker {
  private listeners = new Set<() => void>();
  private wasConnected = false;

  handleConnected() {
    const isReconnect = this.wasConnected;
    this.wasConnected = true;
    if (isReconnect) {
      for (const cb of this.listeners) cb();
    }
  }

  addListener(cb: () => void) {
    this.listeners.add(cb);
  }

  removeListener(cb: () => void) {
    this.listeners.delete(cb);
  }
}
