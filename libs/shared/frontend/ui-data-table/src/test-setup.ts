// Node 25+ ships an inert `globalThis.localStorage` stub that takes precedence
// over jsdom's, leaving methods undefined under vitest. Replace it with a
// working in-memory store so tests behave like a browser.
const store = new Map<string, string>();
const memoryStorage: Storage = {
  get length() {
    return store.size;
  },
  clear: () => store.clear(),
  getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
  key: (index) => Array.from(store.keys())[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: memoryStorage,
});
