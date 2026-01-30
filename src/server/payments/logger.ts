export type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

const REDACT_KEYS = new Set([
  "drive_file_id",
  "private_key",
  "GOOGLE_PRIVATE_KEY",
  "authorization",
  "cookie",
]);

const redact = (meta?: LogMeta): LogMeta => {
  if (!meta) return meta;

  const clone: Record<string, unknown> = {};
  Object.entries(meta).forEach(([key, value]) => {
    if (REDACT_KEYS.has(key)) {
      clone[key] = "[REDACTED]";
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      clone[key] = redact(value as LogMeta);
      return;
    }
    clone[key] = value;
  });

  return clone;
};

const log = (level: LogLevel, message: string, meta?: LogMeta) => {
  const payload = redact(meta);
  const entry = payload ? { message, ...payload } : { message };

  if (level === "error") {
    console.error(entry);
    return;
  }
  if (level === "warn") {
    console.warn(entry);
    return;
  }
  console.log(entry);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => log("info", message, meta),
  warn: (message: string, meta?: LogMeta) => log("warn", message, meta),
  error: (message: string, meta?: LogMeta) => log("error", message, meta),
};
