import "server-only";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const globalCache = (() => {
  const g = globalThis as typeof globalThis & {
    __app_cache__?: Map<string, CacheEntry<unknown>>;
  };
  if (!g.__app_cache__) {
    g.__app_cache__ = new Map();
  }
  return g.__app_cache__;
})();

export const getCache = <T>(key: string): T | null => {
  const entry = globalCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key);
    return null;
  }
  return entry.value as T;
};

export const setCache = <T>(key: string, value: T, ttlMs: number) => {
  globalCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const invalidateCache = (prefix: string) => {
  for (const key of globalCache.keys()) {
    if (key.startsWith(prefix)) {
      globalCache.delete(key);
    }
  }
};
