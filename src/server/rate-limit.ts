import "server-only";
import type { NextRequest } from "next/server";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const store = (() => {
  const g = globalThis as typeof globalThis & {
    __rate_limit__?: Map<string, RateLimitState>;
  };
  if (!g.__rate_limit__) {
    g.__rate_limit__ = new Map();
  }
  return g.__rate_limit__;
})();

const getIp = (request: Request | NextRequest) => {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
};

export const checkRateLimit = (request: Request | NextRequest, config: RateLimitConfig) => {
  const ip = getIp(request);
  const key = `${config.key}:${ip}`;
  const now = Date.now();
  const current = store.get(key);

  if (!current || now > current.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, remaining: config.limit - 1, resetMs: config.windowMs };
  }

  if (current.count >= config.limit) {
    return { ok: false, remaining: 0, resetMs: current.resetAt - now };
  }

  current.count += 1;
  store.set(key, current);
  return { ok: true, remaining: config.limit - current.count, resetMs: current.resetAt - now };
};
