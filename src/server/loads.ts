import "server-only";

import { createUuid } from "@/lib/uuid";
import { appendRow, getRowsCached } from "@/server/sheets";
import { uploadFile } from "@/server/drive";
import type { CardRow } from "@/server/cards";

export type LoadRow = {
  load_id: string;
  card_id: string;
  data_carga: string;
  valor_carga: string;
  comprovante_url: string;
  observacoes: string;
  created_at: string;
  created_by: string;
};

type CreateLoadInput = {
  card: CardRow;
  data_carga: string;
  valor_carga: number;
  observacoes?: string;
  comprovante_base64: string;
  comprovante_nome: string;
  comprovante_mime: string;
  created_by: string;
};

type ListLoadsParams = {
  from?: string;
  to?: string;
  numero_cartao?: string;
  marca?: string;
  unidade?: string;
  limit?: number;
  offset?: number;
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

export const createLoad = async (input: CreateLoadInput) => {
  const {
    card,
    data_carga,
    valor_carga,
    observacoes,
    comprovante_base64,
    comprovante_nome,
    comprovante_mime,
    created_by,
  } = input;

  if (!data_carga) {
    throw new Error("Data da carga invalida.");
  }
  if (!Number.isFinite(valor_carga) || valor_carga <= 0) {
    throw new Error("Valor da carga invalido.");
  }

  const upload = await uploadFile({
    bytesBase64: comprovante_base64,
    filename: comprovante_nome,
    mimeType: comprovante_mime,
  });

  const now = getNow();
  const load: LoadRow = {
    load_id: createUuid(),
    card_id: card.card_id,
    data_carga,
    valor_carga: String(valor_carga),
    comprovante_url: upload.url,
    observacoes: normalize(observacoes),
    created_at: now,
    created_by,
  };

  await appendRow("loads", load);
  await appendRow("attachments", {
    attachment_id: createUuid(),
    card_id: card.card_id,
    type: "LOAD_RECEIPT",
    url: upload.url,
    notes: "",
    created_at: now,
    created_by,
  });

  await appendEvent(card.card_id, "LOAD_CREATED", { load }, created_by);
  await appendAudit("CREATE", "load", load.load_id, null, load, created_by);

  return load;
};

export const listLoads = async ({
  from,
  to,
  numero_cartao,
  marca,
  unidade,
  limit = 10,
  offset = 0,
}: ListLoadsParams) => {
  const loads = (await getRowsCached("loads")) as LoadRow[];
  const cards = (await getRowsCached("cards")) as CardRow[];

  const cardMap = new Map(cards.map((card) => [card.card_id, card]));

  let result = loads.map((load) => ({
    ...load,
    card: cardMap.get(load.card_id),
  }));

  if (from) {
    result = result.filter((row) => row.data_carga >= from);
  }
  if (to) {
    result = result.filter((row) => row.data_carga <= to);
  }
  if (numero_cartao) {
    const term = numero_cartao.toLowerCase();
    result = result.filter(
      (row) => row.card?.numero_cartao?.toLowerCase().includes(term)
    );
  }
  if (marca) {
    result = result.filter((row) => row.card?.marca === marca);
  }
  if (unidade) {
    result = result.filter((row) => row.card?.unidade === unidade);
  }

  const total = result.length;
  const start = Math.max(offset, 0);
  const end = start + Math.max(limit, 0);
  const page = result.slice(start, end);

  return { rows: page, total };
};
