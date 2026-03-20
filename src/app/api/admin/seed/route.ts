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
  pjs: [
    "pj_id",
    "nome_completo",
    "nome_social",
    "cpf",
    "data_nascimento",
    "email",
    "telefone",
    "status_cadastro",
    "observacoes_cadastrais",
    "razao_social",
    "nome_fantasia",
    "cnpj",
    "qsa_recebido",
    "data_recebimento_qsa",
    "status_documental",
    "municipio_uf_empresa",
    "dados_bancarios",
    "observacoes_contratuais",
    "status_vinculo",
    "data_inicio",
    "data_termino_prevista",
    "data_encerramento_real",
    "tipo_contrato_categoria",
    "regime_operacional",
    "gestor_responsavel",
    "area",
    "marca",
    "unidade",
    "centro_custo",
    "empresa_alocacao",
    "tipo_prestacao",
    "jornada_dedicacao",
    "valor_mensal_contratado",
    "tipo_remuneracao",
    "valor_ajuda_custo",
    "valor_total_mensal_previsto",
    "data_base_reajuste",
    "historico_reajuste_resumo",
    "status_pagamento",
    "ultima_competencia_paga",
    "observacoes_financeiras",
    "elegivel_plano_saude",
    "elegivel_plano_odontologico",
    "elegivel_vt",
    "elegivel_vr_va",
    "beneficios_concedidos_resumo",
    "fornecedor_beneficio",
    "produto_plano",
    "data_inclusao_beneficio",
    "data_exclusao_beneficio",
    "tipo_custeio",
    "subsidio_empresa",
    "coparticipacao_aplicavel",
    "status_beneficio",
    "observacoes_regra",
    "custo_beneficios_mensal",
    "documentacao_pendente",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ],
  pj_financial_history: [
    "pj_financial_history_id",
    "pj_id",
    "data_vigencia",
    "valor_mensal_contratado",
    "valor_ajuda_custo",
    "valor_total_mensal_previsto",
    "tipo_remuneracao",
    "observacoes",
    "created_at",
    "created_by",
  ],
  pj_benefits: [
    "pj_benefit_id",
    "pj_id",
    "beneficio",
    "fornecedor",
    "produto_plano",
    "status",
    "elegivel",
    "concedido",
    "data_inclusao",
    "data_exclusao",
    "tipo_custeio",
    "subsidio_empresa",
    "coparticipacao",
    "observacoes",
    "created_at",
    "created_by",
  ],
  pj_allocations: [
    "pj_allocation_id",
    "pj_id",
    "marca",
    "unidade",
    "area",
    "gestor_responsavel",
    "centro_custo",
    "empresa_alocacao",
    "status_vinculo",
    "data_inicio",
    "data_fim",
    "observacoes",
    "created_at",
    "created_by",
  ],
  pj_descritivo_config: [
    "config_id",
    "razao_social_emissora",
    "cnpj_emissora",
    "endereco_emissora",
    "cep_emissora",
    "texto_introdutorio",
    "texto_observacoes",
    "politica_geracao_valor_zero",
    "formato_competencia",
    "formato_moeda",
    "nome_arquivo",
    "template_visual",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ],
  pj_descritivo_itens: [
    "pj_descritivo_item_id",
    "pj_id",
    "competencia",
    "beneficiario_nome",
    "beneficiario_tipo",
    "dependente_vinculo",
    "operadora",
    "produto_plano",
    "beneficio_status",
    "regra_subsidio",
    "subsidio_tipo",
    "subsidio_valor",
    "data_inclusao",
    "data_exclusao",
    "mensalidade",
    "coparticipacao",
    "total_consolidado_competencia",
    "observacoes",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ],
  pj_descritivo_geracoes: [
    "pj_descritivo_geracao_id",
    "pj_id",
    "competencia",
    "status",
    "versao",
    "total_beneficiarios",
    "total_plano",
    "total_subsidio",
    "total_coparticipacao",
    "total_devido",
    "arquivo_nome",
    "snapshot_json",
    "inconsistencias_json",
    "generated_at",
    "generated_by",
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
  user_brand_access: [
    "id",
    "user_id",
    "user_email",
    "brand_id",
    "brand_code",
    "brand_name",
    "role",
    "is_active",
    "created_at",
    "updated_at",
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
