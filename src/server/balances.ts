import "server-only";

import { getRowsCached } from "@/server/sheets";

type LoadRow = {
  card_id: string;
  valor_carga: string;
};

const parseNumber = (value: string) => {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const computeBalancesMap = async () => {
  const loads = (await getRowsCached("loads")) as LoadRow[];
  const map = new Map<string, number>();

  for (const load of loads) {
    const current = map.get(load.card_id) ?? 0;
    map.set(load.card_id, current + parseNumber(load.valor_carga));
  }

  return map;
};

export const computeCardBalance = async (cardId: string) => {
  const map = await computeBalancesMap();
  return map.get(cardId) ?? 0;
};
