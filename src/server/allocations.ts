import "server-only";

import { createUuid } from "@/lib/uuid";
import { appendRow, getRows, getRowsCached, updateRowById } from "@/server/sheets";
import type { AllocationInput, DeallocationInput } from "@/lib/schemas/allocation";
import type { CardRow } from "@/server/cards";

export type AllocationRow = {
  allocation_id: string;
  card_id: string;
  person_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  motivo: string;
  created_at: string;
  created_by: string;
};

const getNow = () => new Date().toISOString();

const normalize = (value?: string | null) => value?.trim() ?? "";

const appendEvent = async (
  cardId: string,
  eventType: string,
  payload: Record<string, unknown>,
  createdBy: string
) => {
  await appendRow("events", {
    event_id: createUuid(),
    card_id: cardId,
    event_type: eventType,
    event_date: getNow(),
    payload_json: JSON.stringify(payload),
    created_by: createdBy,
  });
};

const appendAudit = async (
  action: "CREATE" | "UPDATE",
  entityType: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  createdBy: string
) => {
  await appendRow("audit_log", {
    audit_id: createUuid(),
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_json: before ? JSON.stringify(before) : "",
    after_json: JSON.stringify(after),
    created_at: getNow(),
    created_by: createdBy,
  });
};

export const getActiveAllocationByCard = async (cardId: string) => {
  const rows = (await getRowsCached("allocations")) as AllocationRow[];
  return rows.find(
    (row) => row.card_id === cardId && row.status === "ATIVA"
  ) ?? null;
};

export const getActiveAllocationByCardFresh = async (cardId: string) => {
  const rows = (await getRows("allocations")) as AllocationRow[];
  return rows.find(
    (row) => row.card_id === cardId && row.status === "ATIVA"
  ) ?? null;
};

export const createAllocation = async (
  card: CardRow,
  input: AllocationInput,
  createdBy: string
) => {
  const rows = (await getRows("allocations")) as AllocationRow[];
  const existing = rows.find(
    (row) => row.card_id === card.card_id && row.status === "ATIVA"
  );
  if (existing) {
    throw new Error("Já existe uma alocação ativa para este cartão.");
  }

  const now = getNow();
  const allocation: AllocationRow = {
    allocation_id: createUuid(),
    card_id: card.card_id,
    person_id: normalize(input.person_id),
    data_inicio: input.data_inicio,
    data_fim: "",
    status: "ATIVA",
    motivo: normalize(input.motivo),
    created_at: now,
    created_by: createdBy,
  };

  await appendRow("allocations", allocation);

  const updatedCard: CardRow = {
    ...card,
    status: "ALOCADO",
    updated_at: now,
    updated_by: createdBy,
  };

  await updateRowById("cards", "card_id", card.card_id, updatedCard);

  await appendEvent(card.card_id, "ALLOCATED", { allocation }, createdBy);
  await appendAudit("CREATE", "allocation", allocation.allocation_id, null, allocation, createdBy);
  await appendAudit("UPDATE", "card", card.card_id, card, updatedCard, createdBy);

  return { allocation, card: updatedCard };
};

export const closeAllocation = async (
  card: CardRow,
  allocation: AllocationRow,
  input: DeallocationInput,
  createdBy: string
) => {
  if (allocation.status !== "ATIVA") {
    throw new Error("Alocação não está ativa.");
  }

  const now = getNow();
  const updatedAllocation: AllocationRow = {
    ...allocation,
    data_fim: input.data_fim,
    motivo: normalize(input.motivo),
    status: "ENCERRADA",
  };

  await updateRowById(
    "allocations",
    "allocation_id",
    allocation.allocation_id,
    updatedAllocation
  );

  const updatedCard: CardRow = {
    ...card,
    status: "ESTOQUE",
    updated_at: now,
    updated_by: createdBy,
  };

  await updateRowById("cards", "card_id", card.card_id, updatedCard);

  await appendEvent(
    card.card_id,
    "DEALLOCATED",
    { allocation: updatedAllocation },
    createdBy
  );
  await appendAudit(
    "UPDATE",
    "allocation",
    allocation.allocation_id,
    allocation,
    updatedAllocation,
    createdBy
  );
  await appendAudit("UPDATE", "card", card.card_id, card, updatedCard, createdBy);

  return { allocation: updatedAllocation, card: updatedCard };
};
