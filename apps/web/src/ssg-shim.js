const hasWindow = typeof window !== "undefined";

if (!hasWindow && typeof globalThis !== "undefined") {
  globalThis.window = globalThis;
}

if (typeof globalThis !== "undefined" && !globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] || null,
    get length() {
      return store.size;
    }
  };
}

if (typeof globalThis !== "undefined" && globalThis.window && !globalThis.window.localStorage) {
  globalThis.window.localStorage = globalThis.localStorage;
}
