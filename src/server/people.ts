import "server-only";

import { createUuid } from "@/lib/uuid";
import { appendRow, findById, getRowsCached, updateRowById } from "@/server/sheets";
import type { PersonInput } from "@/lib/schemas/person";

export type PersonRow = {
  person_id: string;
  nome: string;
  chapa_matricula: string;
  marca: string;
  unidade: string;
  status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

type ListPeopleParams = {
  search?: string;
  marca?: string;
  unidade?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

const normalize = (value?: string | null) => value?.trim() ?? "";

const sanitizeInput = (data: PersonInput) => ({
  nome: normalize(data.nome),
  chapa_matricula: normalize(data.chapa_matricula),
  marca: normalize(data.marca),
  unidade: normalize(data.unidade),
  status: normalize(data.status || "ATIVO"),
});

const getNow = () => new Date().toISOString();

const appendAudit = async (
  action: "CREATE" | "UPDATE",
  personId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  createdBy: string
) => {
  await appendRow("audit_log", {
    audit_id: createUuid(),
    entity_type: "person",
    entity_id: personId,
    action,
    before_json: before ? JSON.stringify(before) : "",
    after_json: JSON.stringify(after),
    created_at: getNow(),
    created_by: createdBy,
  });
};

export const listPeople = async ({
  search,
  marca,
  unidade,
  status,
  limit = 10,
  offset = 0,
}: ListPeopleParams) => {
  const rows = (await getRowsCached("people")) as PersonRow[];
  let result = rows;

  if (search) {
    const term = search.toLowerCase();
    result = result.filter(
      (row) =>
        row.nome.toLowerCase().includes(term) ||
        row.chapa_matricula.toLowerCase().includes(term)
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

export const getPersonById = async (personId: string) => {
  return (await findById("people", "person_id", personId)) as PersonRow | null;
};

export const createPerson = async (input: PersonInput, createdBy: string) => {
  const data = sanitizeInput(input);
  const now = getNow();
  const person: PersonRow = {
    person_id: createUuid(),
    nome: data.nome,
    chapa_matricula: data.chapa_matricula,
    marca: data.marca,
    unidade: data.unidade,
    status: data.status || "ATIVO",
    created_at: now,
    created_by: createdBy,
    updated_at: now,
    updated_by: createdBy,
  };

  await appendRow("people", person);
  await appendAudit("CREATE", person.person_id, null, person, createdBy);

  return person;
};

export const updatePerson = async (
  personId: string,
  input: PersonInput,
  updatedBy: string
) => {
  const existing = await getPersonById(personId);
  if (!existing) {
    throw new Error("Pessoa nao encontrada.");
  }

  const data = sanitizeInput(input);
  const now = getNow();
  const updated: PersonRow = {
    ...existing,
    ...data,
    status: data.status || existing.status || "ATIVO",
    updated_at: now,
    updated_by: updatedBy,
  };

  await updateRowById("people", "person_id", personId, updated);
  await appendAudit("UPDATE", personId, existing, updated, updatedBy);

  return updated;
};
