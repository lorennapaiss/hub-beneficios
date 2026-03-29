export const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export function getPagination(
  params: { limit?: string; offset?: string },
  defaults: { limit?: number } = {},
) {
  const limit = toNumber(params.limit, defaults.limit ?? 10);
  const offset = toNumber(params.offset, 0);
  const totalPages = (total: number) => Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.floor(offset / limit) + 1;

  return { limit, offset, totalPages, currentPage };
}

export function makePageLinkBuilder(
  basePath: string,
  filters: Record<string, string | undefined>,
  limit: number,
) {
  return (nextOffset: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    params.set("limit", String(limit));
    params.set("offset", String(nextOffset));
    return `${basePath}?${params.toString()}`;
  };
}
