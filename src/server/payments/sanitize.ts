const sanitizeString = (value: unknown) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

export const sanitizeObject = (input: Record<string, unknown>) => {
  const output: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      output[key] = value.map((item) => sanitizeString(item));
      return;
    }
    if (value && typeof value === "object") {
      output[key] = sanitizeObject(value as Record<string, unknown>);
      return;
    }
    output[key] = sanitizeString(value);
  });
  return output;
};
