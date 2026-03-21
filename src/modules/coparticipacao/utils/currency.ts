const DECIMAL_REGEX = /-?\d+(?:[.,]\d+)?/g;

export const parseCurrency = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  if (Number.isFinite(parsed)) return parsed;

  const match = raw.match(DECIMAL_REGEX)?.[0];
  if (!match) return 0;
  return Number(match.replace(/\./g, "").replace(",", "."));
};

export const formatCurrencyBR = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const formatDecimalForTxt = (value: number) =>
  value.toFixed(2).replace(".", ",");
