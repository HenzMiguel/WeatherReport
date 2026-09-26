export class MemoryCache {
  constructor(maxEntries = 500) {
    this.entries = new Map();
    this.maxEntries = maxEntries;
  }
  get(key) {
    const item = this.entries.get(key);
    if (!item || item.expires <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return item.value;
  }
  set(key, value, ttl) {
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries)
      this.entries.delete(this.entries.keys().next().value);
    this.entries.set(key, { value, expires: Date.now() + ttl });
    return value;
  }
}
