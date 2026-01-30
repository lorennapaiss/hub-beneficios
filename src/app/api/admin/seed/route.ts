import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isAllowedEmail } from "@/lib/auth";
import { getClient } from "@/server/sheets";
import { checkRateLimit } from "@/server/rate-limit";
import { env } from "@/lib/env";

const SCHEMA: Record<string, string[]> = {
  cards: [
    "card_id",
    "numero_cartao",
    "marca",
    "unidade",
    "status",
    "foto_cartao_url",
    "observacoes",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ],
  people: [
    "person_id",
    "nome",
    "chapa_matricula",
    "marca",
    "unidade",
    "status",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ],
  loads: [
    "load_id",
    "card_id",
    "data_carga",
    "valor_carga",
    "comprovante_url",
    "observacoes",
    "created_at",
    "created_by",
  ],
  allocations: [
    "allocation_id",
    "card_id",
    "person_id",
    "data_inicio",
    "data_fim",
    "status",
    "motivo",
    "created_at",
    "created_by",
  ],
  events: [
    "event_id",
    "card_id",
    "event_type",
    "event_date",
    "payload_json",
    "created_by",
  ],
  attachments: [
    "attachment_id",
    "card_id",
    "type",
    "url",
    "notes",
    "created_at",
    "created_by",
  ],
  audit_log: [
    "audit_id",
    "entity_type",
    "entity_id",
    "action",
    "before_json",
    "after_json",
    "created_at",
    "created_by",
  ],
};

const ensureSeedEnabled = () => env.ENABLE_SEED === "true";

const getSpreadsheetId = () => {
  return env.SHEETS_SPREADSHEET_ID;
};

const assertAllowlist = (email?: string | null) => {
  if (!isAllowedEmail(email) || !isAdminEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Acesso negado." },
      { status: 403 }
    );
  }
  return null;
};

export async function POST(request: Request) {
  if (!ensureSeedEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Seed desabilitado. Defina ENABLE_SEED=true." },
      { status: 403 }
    );
  }

  const session = await getServerSession(authOptions);
  const allowlistError = assertAllowlist(session?.user?.email);
  if (allowlistError) return allowlistError;
  const rate = checkRateLimit(request, {
    key: "admin:seed",
    limit: 3,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 }
    );
  }

  try {
    const sheets = await getClient();
    const spreadsheetId = getSpreadsheetId();

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets =
      spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title) ?? [];

    const created: string[] = [];
    const headersSet: string[] = [];

    for (const [sheetName, headers] of Object.entries(SCHEMA)) {
      if (!existingSheets.includes(sheetName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetName } } }],
          },
        });
        created.push(sheetName);
      }

      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
      });

      const values = headerResponse.data.values ?? [];
      const isEmpty = values.length === 0 || values[0].length === 0;

      if (isEmpty) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!1:1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });
        headersSet.push(sheetName);
      }
    }

    return NextResponse.json({
      ok: true,
      createdSheets: created,
      headersInitialized: headersSet,
    });
  } catch (error) {
    console.error("Seed do Sheets falhou.", error);
    const message =
      error instanceof Error ? error.message : "Erro ao inicializar schema.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
