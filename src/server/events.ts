import "server-only";

import { getRowsCached } from "@/server/sheets";

export type EventRow = {
  event_id: string;
  card_id: string;
  event_type: string;
  event_date: string;
  payload_json: string;
  created_by: string;
};

export const getEventsByCard = async (cardId: string) => {
  const rows = (await getRowsCached("events")) as EventRow[];
  return rows
    .filter((row) => row.card_id === cardId)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));
};
