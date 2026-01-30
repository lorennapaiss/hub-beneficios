import "server-only";

import { createUuid } from "@/lib/uuid";
import {
  appendRow,
  findById,
  getRows,
  getRowsCached,
  updateRowById,
} from "@/server/sheets";
import type { CardInput } from "@/lib/schemas/card";

export type CardRow = {
  card_id: string;
  numero_cartao: string;
  marca: string;
  unidade: string;
  status: string;
  foto_cartao_url: string;
  observacoes: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

type ListCardsParams = {
  search?: string;
  marca?: string;
  unidade?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

const normalize = (value?: string | null) => value?.trim() ?? "";

const sanitizeInput = (data: CardInput) => ({
  numero_cartao: normalize(data.numero_cartao),
  marca: normalize(data.marca),
  unidade: normalize(data.unidade),
  status: normalize(data.status || "ESTOQUE"),
  foto_cartao_url: normalize(data.foto_cartao_url),
  observacoes: normalize(data.observacoes),
});

const getNow = () => new Date().toISOString();

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
  cardId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  createdBy: string
) => {
  await appendRow("audit_log", {
    audit_id: createUuid(),
    entity_type: "card",
    entity_id: cardId,
    action,
    before_json: before ? JSON.stringify(before) : "",
    after_json: JSON.stringify(after),
    created_at: getNow(),
    created_by: createdBy,
  });
};

const ensureUniqueNumero = (rows: CardRow[], numero: string, ignoreId?: string) => {
  const exists = rows.find(
    (row) =>
      row.numero_cartao === numero &&
      (!ignoreId || row.card_id !== ignoreId)
  );
  if (exists) {
    throw new Error("Numero de cartao ja cadastrado.");
  }
};

export const listCards = async ({
  search,
  marca,
  unidade,
  status,
  limit = 10,
  offset = 0,
}: ListCardsParams) => {
  const rows = (await getRowsCached("cards")) as CardRow[];
  let result = rows;

  if (search) {
    const term = search.toLowerCase();
    result = result.filter((row) =>
      row.numero_cartao.toLowerCase().includes(term)
    );
  }

  if (marca) {
    result = result.filter((row) => row.marca === marca);
  }

  if (unidade) {
    result = result.filter((row) => row.unidade === unidade);
  }

  if (status) {
    result = result.filter((row) => row.status === status);
  }

  const total = result.length;
  const start = Math.max(offset, 0);
  const end = start + Math.max(limit, 0);
  const page = result.slice(start, end);

  return { rows: page, total };
};

export const getCardById = async (cardId: string) => {
  return (await findById("cards", "card_id", cardId)) as CardRow | null;
};

export const createCard = async (input: CardInput, createdBy: string) => {
  const rows = (await getRows("cards")) as CardRow[];
  const data = sanitizeInput(input);

  ensureUniqueNumero(rows, data.numero_cartao);

  const now = getNow();
  const card: CardRow = {
    card_id: createUuid(),
    numero_cartao: data.numero_cartao,
    marca: data.marca,
    unidade: data.unidade,
    status: data.status || "ESTOQUE",
    foto_cartao_url: data.foto_cartao_url,
    observacoes: data.observacoes,
    created_at: now,
    created_by: createdBy,
    updated_at: now,
    updated_by: createdBy,
  };

  await appendRow("cards", card);
  await appendEvent(card.card_id, "CARD_CREATED", { card }, createdBy);
  await appendAudit("CREATE", card.card_id, null, card, createdBy);

  return card;
};

export const updateCard = async (
  cardId: string,
  input: CardInput,
  updatedBy: string
) => {
  const existing = await getCardById(cardId);
  if (!existing) {
    throw new Error("Cartao nao encontrado.");
  }

  const rows = (await getRows("cards")) as CardRow[];
  const data = sanitizeInput(input);

  if (data.numero_cartao && data.numero_cartao !== existing.numero_cartao) {
    ensureUniqueNumero(rows, data.numero_cartao, cardId);
  }

  const now = getNow();
  const updated: CardRow = {
    ...existing,
    ...data,
    status: data.status || existing.status || "ESTOQUE",
    updated_at: now,
    updated_by: updatedBy,
  };

  await updateRowById("cards", "card_id", cardId, updated);
  await appendEvent(cardId, "CARD_UPDATED", { before: existing, after: updated }, updatedBy);
  await appendAudit("UPDATE", cardId, existing, updated, updatedBy);

  return updated;
};

export const attachCardPhoto = async (
  cardId: string,
  photoUrl: string,
  createdBy: string
) => {
  const existing = await getCardById(cardId);
  if (!existing) {
    throw new Error("Cartao nao encontrado.");
  }

  const now = getNow();
  const updated: CardRow = {
    ...existing,
    foto_cartao_url: photoUrl,
    updated_at: now,
    updated_by: createdBy,
  };

  await updateRowById("cards", "card_id", cardId, updated);

  await appendRow("attachments", {
    attachment_id: createUuid(),
    card_id: cardId,
    type: "CARD_PHOTO",
    url: photoUrl,
    notes: "",
    created_at: now,
    created_by: createdBy,
  });

  await appendEvent(
    cardId,
    "ATTACHMENT_ADDED",
    { type: "CARD_PHOTO", url: photoUrl },
    createdBy
  );

  await appendAudit("UPDATE", cardId, existing, updated, createdBy);

  return updated;
};
