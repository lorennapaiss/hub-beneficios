import "server-only";
import { google } from "googleapis";
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/server/supabase";
import {
  filterBrandsForScope,
  type IndicatorAccessScope,
} from "@/server/indicators/access";
import { getGoogleAuth } from "@/server/payments/google";

type BenefitKey = "health" | "dental" | "transport" | "meal";

type BenefitConfig = {
  key: BenefitKey;
  label: string;
  sheetName: string;
  spreadsheetId: string;
  secondarySheetName?: string;
};

type RawIndicator = {
  benefit: BenefitKey;
  competence: string;
  year: number;
  month: number;
  amount: number;
  discountAmount: number;
  headcount: number;
  costCenter: string;
  provider: string;
  brand: string;
  role: string;
  employeeId: string;
  employeeName: string;
  hasEconomy: boolean;
  economyAmount: number;
};

export type TransportRecord = {
  competence: string;
  year: number;
  month: number;
  amount: number;
  economyAmount: number;
  hasEconomy: boolean;
  employeeId: string;
  employeeName: string;
  brand: string;
  role: string;
};

export type HealthRecord = {
  competence: string;
  year: number;
  month: number;
  premiumAmount: number;
  discountAmount: number;
  brand: string;
  role: string;
  employeeId: string;
  employeeName: string;
  status: string;
  holderType: string;
};

export type HealthCopartRecord = {
  competence: string;
  year: number;
  month: number;
  copartAmount: number;
  copartDiscountAmount: number;
  brand: string;
  employeeId: string;
  employeeName: string;
};

export type DentalRecord = {
  competence: string;
  year: number;
  month: number;
  amount: number;
  operator: string;
  brand: string;
  plan: string;
  employeeId: string;
  employeeName: string;
  holderName: string;
  holderCpf: string;
  role: string;
};

export type MealRecord = {
  competence: string;
  year: number;
  month: number;
  amount: number;
  benefit: string;
  personType: string;
  brand: string;
  role: string;
  employeeId: string;
  employeeName: string;
  isLastMonth: boolean;
};

export type BenefitSummary = {
  key: BenefitKey;
  label: string;
  totalCurrent: number;
  totalPrevious: number;
  variationPercent: number | null;
  headcountCurrent: number;
  averageCostPerPerson: number | null;
};

export type TrendPoint = {
  competence: string;
  total: number;
  byBenefit: Record<BenefitKey, number>;
};

export type CostCenterSummary = {
  name: string;
  total: number;
};

export type ProviderSummary = {
  name: string;
  total: number;
};

export type BenefitTabDashboard = {
  key: BenefitKey;
  label: string;
  competenceCurrent: string;
  competencePrevious: string | null;
  totalCurrent: number;
  totalPrevious: number;
  variationPercent: number | null;
  headcountCurrent: number;
  averageCostPerPerson: number | null;
  trend: Array<{ competence: string; total: number }>;
  topCostCenters: CostCenterSummary[];
  topProviders: ProviderSummary[];
};

export type IndicatorsDashboardData = {
  competenceCurrent: string;
  competencePrevious: string | null;
  totalCurrent: number;
  totalPrevious: number;
  totalVariationPercent: number | null;
  benefitSummaries: BenefitSummary[];
  trend: TrendPoint[];
  topCostCenters: CostCenterSummary[];
  benefitDashboards: BenefitTabDashboard[];
  transportRecords: TransportRecord[];
  healthRecords: HealthRecord[];
  healthCopartRecords: HealthCopartRecord[];
  dentalRecords: DentalRecord[];
  mealRecords: MealRecord[];
  warnings: string[];
};

export type IndicatorsOverviewData = Omit<
  IndicatorsDashboardData,
  "transportRecords" | "healthRecords" | "healthCopartRecords" | "dentalRecords" | "mealRecords"
>;

export type IndicatorDetailByBenefit = {
  health: {
    key: "health";
    warnings: string[];
    healthRecords: HealthRecord[];
    healthCopartRecords: HealthCopartRecord[];
  };
  dental: {
    key: "dental";
    warnings: string[];
    dentalRecords: DentalRecord[];
  };
  transport: {
    key: "transport";
    warnings: string[];
    transportRecords: TransportRecord[];
  };
  meal: {
    key: "meal";
    warnings: string[];
    mealRecords: MealRecord[];
  };
};

export type IndicatorDetailResponse<K extends BenefitKey = BenefitKey> =
  IndicatorDetailByBenefit[K];

type IndicatorsSourceData = {
  records: RawIndicator[];
  healthRecords: HealthRecord[];
  healthCopartRecords: HealthCopartRecord[];
  dentalRecords: DentalRecord[];
  mealRecords: MealRecord[];
  warnings: string[];
};

type TransportStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  amount: string | number;
  economy_amount: string | number;
  has_economy: boolean | string;
  employee_id: string | null;
  employee_name: string | null;
  brand: string | null;
  role: string | null;
};

type HealthStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  premium_amount: string | number;
  discount_amount: string | number;
  operator: string | null;
  brand: string | null;
  employee_name: string | null;
  cpf: string | null;
  employee_id: string | null;
  holder_type: string | null;
  status: string | null;
};

type HealthCopartStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  copart_amount: string | number;
  brand: string | null;
  employee_name: string | null;
  employee_id: string | null;
};

type HealthDiscountStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  discount_amount: string | number;
  brand: string | null;
  employee_name: string | null;
  normalized_employee_name: string | null;
  employee_id: string | null;
  cpf: string | null;
  role_name: string | null;
};

type HealthCopartDiscountStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  discount_amount: string | number;
  brand: string | null;
  employee_name: string | null;
  employee_id: string | null;
  cpf: string | null;
  role_name: string | null;
};

type DentalStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  amount: string | number;
  operator: string | null;
  brand_totvs: string | null;
  plan: string | null;
  employee_id: string | null;
  employee_name: string | null;
  holder_name: string | null;
  holder_cpf: string | null;
  role: string | null;
};

type MealStagingRow = {
  competence: string;
  year: string | number;
  month: string | number;
  amount: string | number;
  transaction_type: string | null;
  benefit_name: string | null;
  brand: string | null;
  role: string | null;
  employee_id: string | null;
  employee_name: string | null;
  is_last_month: boolean | string;
};

const BENEFITS: BenefitConfig[] = [
  {
    key: "health",
    label: "Plano de Saúde",
    sheetName: env.INDICATORS_HEALTH_SHEET_NAME,
    spreadsheetId: env.INDICATORS_HEALTH_SHEETS_ID || env.INDICATORS_SHEETS_ID,
    secondarySheetName: env.INDICATORS_HEALTH_COPART_SHEET_NAME,
  },
  {
    key: "dental",
    label: "Plano Odontológico",
    sheetName: env.INDICATORS_DENTAL_SHEET_NAME,
    spreadsheetId: env.INDICATORS_DENTAL_SHEETS_ID || env.INDICATORS_SHEETS_ID,
  },
  {
    key: "transport",
    label: "Vale Transporte",
    sheetName: env.INDICATORS_TRANSPORT_SHEET_NAME,
    spreadsheetId: env.INDICATORS_TRANSPORT_SHEETS_ID || env.INDICATORS_SHEETS_ID,
  },
  {
    key: "meal",
    label: "Vale Refeição",
    sheetName: env.INDICATORS_MEAL_SHEET_NAME,
    spreadsheetId: env.INDICATORS_MEAL_SHEETS_ID || env.INDICATORS_SHEETS_ID,
  },
];

const PT_MONTHS: Record<string, number> = {
  jan: 1,
  janeiro: 1,
  fev: 2,
  fevereiro: 2,
  mar: 3,
  marco: 3,
  abr: 4,
  abril: 4,
  mai: 5,
  maio: 5,
  jun: 6,
  junho: 6,
  jul: 7,
  julho: 7,
  ago: 8,
  agosto: 8,
  set: 9,
  setembro: 9,
  out: 10,
  outubro: 10,
  nov: 11,
  novembro: 11,
  dez: 12,
  dezembro: 12,
};

const removeDiacritics = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeHeader = (value: string) =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const parseNumber = (value: string | undefined) => {
  const raw = (value ?? "").trim();
  if (!raw) return 0;
  const normalized = raw
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCompetence = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const isPlausibleCompetence = (year: number, month: number) => {
  const currentYear = new Date().getFullYear();
  return month >= 1 && month <= 12 && year >= currentYear - 2 && year <= currentYear + 1;
};

const parseMonthNumber = (value: string | undefined) => {
  const raw = removeDiacritics((value ?? "").trim().toLowerCase());
  if (!raw) return null;

  // Brazilian date formats in month fields: DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const month = Number(ddmmyyyy[2]);
    return month >= 1 && month <= 12 ? month : null;
  }

  const numeric = Number(raw.replace(/[^\d]/g, ""));
  if (numeric >= 1 && numeric <= 12) return numeric;

  return PT_MONTHS[raw] ?? null;
};

const parseMonthForYearContext = (monthRaw: string | undefined) => {
  const raw = removeDiacritics((monthRaw ?? "").trim().toLowerCase());
  if (!raw) return null;

  // RM-style MESCOMP often comes as DD/MM while ANOCOMP carries the year.
  const dayMonth = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (dayMonth) {
    const month = Number(dayMonth[2]);
    return month >= 1 && month <= 12 ? month : null;
  }

  return parseMonthNumber(raw);
};

const parseCompetence = (value: string | undefined) => {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const finalize = (year: number, month: number) =>
    isPlausibleCompetence(year, month) ? toCompetence(year, month) : "";

  const yyyymm = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyymm) return finalize(Number(yyyymm[1]), Number(yyyymm[2]));

  const mmyyyy = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmyyyy) return finalize(Number(mmyyyy[2]), Number(mmyyyy[1]));

  const mmyy = raw.match(/^(\d{1,2})[-/](\d{2})$/);
  if (mmyy) return finalize(2000 + Number(mmyy[2]), Number(mmyy[1]));

  // Brazilian date format: DD/MM/YYYY (e.g. 01/08/2025 -> 2025-08)
  const ddmmyyyy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) return finalize(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]));

  const ddmmyy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (ddmmyy) return finalize(2000 + Number(ddmmyy[3]), Number(ddmmyy[2]));

  const isoDate = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoDate) return finalize(Number(isoDate[1]), Number(isoDate[2]));

  const monthPt = parseMonthNumber(raw);
  if (monthPt) {
    const nowYear = new Date().getFullYear();
    return finalize(nowYear, monthPt);
  }

  return "";
};

const monthNow = () => {
  const now = new Date();
  return toCompetence(now.getFullYear(), now.getMonth() + 1);
};

const previousCompetenceOf = (competence: string) => {
  const match = competence.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return toCompetence(date.getFullYear(), date.getMonth() + 1);
};

const variationPercent = (current: number, previous: number) => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const getHeaderIndex = (headers: string[], aliases: string[]) => {
  for (const alias of aliases.map(normalizeHeader)) {
    const idx = headers.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
};

const getCell = (row: string[], index: number) => (index >= 0 ? row[index] ?? "" : "");

const listSheetRows = async (spreadsheetId: string, sheetName: string) => {
  const sheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  });
  return (response.data.values ?? []) as string[][];
};

const pickHeaderRow = (
  values: string[][],
  requiredAliases: string[],
): { headers: string[]; rows: string[][] } => {
  const normalizedRequired = requiredAliases.map(normalizeHeader);

  for (let i = 0; i < Math.min(values.length, 12); i += 1) {
    const candidate = (values[i] ?? []).map((cell) => normalizeHeader(cell ?? ""));
    if (candidate.length === 0) continue;

    const hitCount = normalizedRequired.filter((alias) => candidate.includes(alias)).length;
    if (hitCount >= 2) {
      return {
        headers: candidate,
        rows: values.slice(i + 1),
      };
    }
  }

  return {
    headers: (values[0] ?? []).map((cell) => normalizeHeader(cell ?? "")),
    rows: values.slice(1),
  };
};

const buildCompetenceFromMonthYear = (
  monthRaw: string | undefined,
  yearRaw: string | undefined,
) => {
  const month = parseMonthForYearContext(monthRaw);
  const year = Number((yearRaw ?? "").replace(/[^\d]/g, ""));
  if (!month || !Number.isFinite(year) || !isPlausibleCompetence(year, month)) return "";
  return toCompetence(year, month);
};

const parseEconomyFlag = (value: string | undefined, economyAmount: number) => {
  const normalized = removeDiacritics((value ?? "").trim().toLowerCase());
  if (["sim", "true", "1", "yes"].includes(normalized)) return true;
  if (["nao", "false", "0", "no"].includes(normalized)) return false;
  return economyAmount > 0;
};

const isActiveStatus = (value: string) => {
  const normalized = removeDiacritics(value.trim().toLowerCase());
  if (!normalized) return true;
  return !["cancelado", "inativo", "excluido", "encerrado", "desligado"].includes(normalized);
};

const readBenefitSheet = async (benefit: BenefitConfig): Promise<RawIndicator[]> => {
  if (!benefit.spreadsheetId) {
    throw new Error(`spreadsheet nao configurada para ${benefit.label}`);
  }

  const values = await listSheetRows(benefit.spreadsheetId, benefit.sheetName);
  if (values.length <= 1) return [];

  const rawHeaders = values[0] ?? [];
  const headers = rawHeaders.map((header) => normalizeHeader(header ?? ""));

  const competenceIndex = getHeaderIndex(headers, [
    "competencia",
    "referencia",
    "periodo",
    "mes",
    "data",
    "ultimo_mes",
  ]);
  const monthIndex = getHeaderIndex(headers, [
    "mes_n",
    "mes_no",
    "mes_numero",
    "mes",
    "ultimo_mes",
  ]);
  const yearIndex = getHeaderIndex(headers, ["ano", "year"]);

  const amountIndex = getHeaderIndex(headers, [
    "vlr_final_pedido",
    "valor_final_pedido",
    "valor",
    "valor_total",
    "custo",
    "custo_total",
    "total",
    "amount",
    "vlr_solicitado",
    "premio",
  ]);
  const discountIndex = getHeaderIndex(headers, [
    "descontado",
    "desconto",
    "valor_descontado",
    "vlr_desconto",
  ]);
  const economyAmountIndex = getHeaderIndex(headers, [
    "vlr_economia",
    "valor_economia",
    "economia",
  ]);
  const economyFlagIndex = getHeaderIndex(headers, [
    "teve_economia",
    "teve_economia_",
    "economia_flag",
  ]);

  const headcountIndex = getHeaderIndex(headers, [
    "vidas",
    "qtd_vidas",
    "quantidade_vidas",
    "colaboradores",
    "qtd_colaboradores",
    "headcount",
    "quantidade_pessoas",
  ]);
  const matriculaIndex = getHeaderIndex(headers, ["matricula", "chapa", "id_colaborador"]);
  const cpfIndex = getHeaderIndex(headers, ["cpf"]);
  const nameIndex = getHeaderIndex(headers, ["nome", "colaborador", "funcionario"]);
  const roleIndex = getHeaderIndex(headers, ["cargo_depara", "cargo", "funcao"]);

  const brandIndex = getHeaderIndex(headers, ["marca", "unidade", "centro_custo"]);
  const costCenterIndex = getHeaderIndex(headers, [
    "marca",
    "centro_custo",
    "centro_de_custo",
    "cost_center",
    "cc",
    "unidade",
    "cargo_depara",
    "departamento",
  ]);
  const providerIndex = getHeaderIndex(headers, [
    "beneficio_depara",
    "beneficio",
    "fornecedor",
    "operadora",
    "empresa",
    "provider",
  ]);

  if (amountIndex < 0) {
    throw new Error(`nenhuma coluna de valor encontrada em ${benefit.sheetName}`);
  }

  const rows = values.slice(1);
  return rows
    .map((row) => {
      const competenceRaw = getCell(row, competenceIndex);
      const monthRaw = getCell(row, monthIndex);
      const yearRaw = getCell(row, yearIndex);
      const competenceByMonthYear = buildCompetenceFromMonthYear(monthRaw, yearRaw);
      const competence =
        competenceByMonthYear || parseCompetence(competenceRaw) || monthNow();

      const competenceMatch = competence.match(/^(\d{4})-(\d{2})$/);
      const year = competenceMatch ? Number(competenceMatch[1]) : new Date().getFullYear();
      const month = competenceMatch ? Number(competenceMatch[2]) : 1;

      const amount = parseNumber(getCell(row, amountIndex));
      const discountAmount = parseNumber(getCell(row, discountIndex));
      const economyAmount = parseNumber(getCell(row, economyAmountIndex));
      const hasEconomy = parseEconomyFlag(getCell(row, economyFlagIndex), economyAmount);

      const explicitHeadcount = parseNumber(getCell(row, headcountIndex));
      const matricula = getCell(row, matriculaIndex).trim();
      const cpf = getCell(row, cpfIndex).trim();
      const employeeId = matricula || cpf;
      const employeeName = getCell(row, nameIndex).trim();
      const hasEmployee = Boolean(employeeId || employeeName);

      const headcount =
        headcountIndex >= 0 ? explicitHeadcount : hasEmployee ? 1 : 0;

      const role = getCell(row, roleIndex).trim() || "Nao informado";
      const brand = getCell(row, brandIndex).trim() || "Nao informado";
      const costCenter = getCell(row, costCenterIndex).trim() || brand || "Nao informado";
      const provider = getCell(row, providerIndex).trim() || "Nao informado";

      return {
        benefit: benefit.key,
        competence,
        year,
        month,
        amount,
        discountAmount,
        economyAmount,
        hasEconomy,
        headcount,
        costCenter,
        provider,
        brand,
        role,
        employeeId,
        employeeName,
      };
    })
    .filter((row) => row.amount > 0 || row.economyAmount > 0 || row.discountAmount > 0);
};

const readHealthDetailed = async (
  benefit: BenefitConfig,
): Promise<{ main: HealthRecord[]; copart: HealthCopartRecord[] }> => {
  if (!benefit.spreadsheetId) {
    throw new Error("spreadsheet nao configurada para Plano de Saúde");
  }

  const parseHealthBaseSheet = (values: string[][]): HealthRecord[] => {
    if (values.length <= 1) return [];
    const { headers, rows: mainRows } = pickHeaderRow(values, [
      "premio",
      "mes",
      "mes_n",
      "ano_n",
    ]);
    const monthIndex = getHeaderIndex(headers, ["mes_n", "mes_numero", "mes_no"]);
    const yearIndex = getHeaderIndex(headers, ["ano_n", "ano_no"]);
    const competenceIndex = getHeaderIndex(headers, ["mes", "competencia", "referencia"]);
    const premiumIndex = getHeaderIndex(headers, ["premio"]);
    const brandIndex = getHeaderIndex(headers, ["marca"]);
    const roleIndex = getHeaderIndex(headers, [
      "cargo_de_para",
      "cargo_depara",
      "cargo_de_para",
      "cargo",
    ]);
    const nameIndex = getHeaderIndex(headers, [
      "nome",
      "nome_segurado",
      "nome_beneficiario",
    ]);
    const chaveIndex = getHeaderIndex(headers, ["chave"]);
    const cpfIndex = getHeaderIndex(headers, ["cpf_corrigido", "cpf_aux", "cpf"]);
    const statusIndex = getHeaderIndex(headers, ["situacao", "status"]);
    const holderTypeIndex = getHeaderIndex(headers, [
      "titular_ou_dependente",
      "parentesco",
    ]);
    const parsedRows: HealthRecord[] = [];

    for (const row of mainRows) {
      const competenceByMonthYear = buildCompetenceFromMonthYear(
        getCell(row, monthIndex),
        getCell(row, yearIndex),
      );
      const competence = competenceByMonthYear || parseCompetence(getCell(row, competenceIndex)) || monthNow();
      const match = competence.match(/^(\d{4})-(\d{2})$/);
      const year = match ? Number(match[1]) : new Date().getFullYear();
      const month = match ? Number(match[2]) : 1;
      const premiumAmount = parseNumber(getCell(row, premiumIndex));
      const status = getCell(row, statusIndex).trim() || "ATIVO";

      if (premiumAmount <= 0 || !isActiveStatus(status)) continue;

      parsedRows.push({
        competence,
        year,
        month,
        premiumAmount,
        discountAmount: 0,
        brand: getCell(row, brandIndex).trim() || "Nao informado",
        role: getCell(row, roleIndex).trim() || "Nao informado",
        employeeId: getCell(row, cpfIndex).trim() || getCell(row, chaveIndex).trim(),
        employeeName: getCell(row, nameIndex).trim(),
        status,
        holderType: getCell(row, holderTypeIndex).trim() || "Nao informado",
      });
    }
    return parsedRows;
  };

  const parseHealthMonthlyDiscountSheet = (values: string[][]): HealthRecord[] => {
    if (values.length <= 1) return [];
    const { headers, rows } = pickHeaderRow(values, ["valor", "mescomp", "anocomp"]);
    const monthIndex = getHeaderIndex(headers, ["mescomp", "mes_comp"]);
    const yearIndex = getHeaderIndex(headers, ["anocomp"]);
    const brandIndex = getHeaderIndex(headers, ["marca"]);
    const roleIndex = getHeaderIndex(headers, ["descricao_funcao", "cargo"]);
    const nameIndex = getHeaderIndex(headers, ["nome_func", "nome"]);
    const chapaIndex = getHeaderIndex(headers, ["chapa"]);
    const cpfIndex = getHeaderIndex(headers, ["cpf"]);
    const parsedRows: HealthRecord[] = [];

    for (const row of rows) {
      const competence = buildCompetenceFromMonthYear(
        getCell(row, monthIndex),
        getCell(row, yearIndex),
      );
      if (!competence) continue;
      const match = competence.match(/^(\d{4})-(\d{2})$/);
      const year = match ? Number(match[1]) : new Date().getFullYear();
      const month = match ? Number(match[2]) : 1;
      const discountAmount = parseNumber(getCell(row, getHeaderIndex(headers, ["valor", "valor_total"])));
      if (discountAmount <= 0) continue;

      parsedRows.push({
        competence,
        year,
        month,
        premiumAmount: 0,
        discountAmount,
        brand: getCell(row, brandIndex).trim() || "Nao informado",
        role: getCell(row, roleIndex).trim() || "Nao informado",
        employeeId: getCell(row, cpfIndex).trim() || getCell(row, chapaIndex).trim(),
        employeeName: getCell(row, nameIndex).trim(),
        status: "ATIVO",
        holderType: "Nao informado",
      });
    }

    return parsedRows;
  };

  const parseHealthCopartBaseSheet = (values: string[][]): HealthCopartRecord[] => {
    if (values.length <= 1) return [];
    const { headers, rows: copartRows } = pickHeaderRow(values, [
      "valor_copay",
      "mes_referencia",
      "ano",
    ]);
    const monthIndex = getHeaderIndex(headers, ["mes_referencia"]);
    const yearIndex = getHeaderIndex(headers, ["ano"]);
    const competenceIndex = getHeaderIndex(headers, ["mes_referencia", "competencia", "referencia"]);
    const copartIndex = getHeaderIndex(headers, ["valor_copay"]);
    const brandIndex = getHeaderIndex(headers, ["marca"]);
    const nameIndex = getHeaderIndex(headers, [
      "nome_beneficiario",
      "nome",
    ]);
    const cpfIndex = getHeaderIndex(headers, ["cpf"]);
    const parsedRows: HealthCopartRecord[] = [];

    for (const row of copartRows) {
      const competenceByMonthYear = buildCompetenceFromMonthYear(
        getCell(row, monthIndex),
        getCell(row, yearIndex),
      );
      const competence = competenceByMonthYear || parseCompetence(getCell(row, competenceIndex)) || monthNow();
      const match = competence.match(/^(\d{4})-(\d{2})$/);
      const year = match ? Number(match[1]) : new Date().getFullYear();
      const month = match ? Number(match[2]) : 1;
      const copartAmount = parseNumber(getCell(row, copartIndex));
      if (copartAmount <= 0) continue;

      parsedRows.push({
        competence,
        year,
        month,
        copartAmount,
        copartDiscountAmount: 0,
        brand: getCell(row, brandIndex).trim() || "Nao informado",
        employeeId: getCell(row, cpfIndex).trim(),
        employeeName: getCell(row, nameIndex).trim(),
      });
    }

    return parsedRows;
  };

  const parseHealthCopartDiscountSheet = (values: string[][]): HealthCopartRecord[] => {
    if (values.length <= 1) return [];
    const { headers, rows } = pickHeaderRow(values, ["valor", "mescomp", "anocomp"]);
    const monthIndex = getHeaderIndex(headers, ["mescomp", "mes_comp"]);
    const yearIndex = getHeaderIndex(headers, ["anocomp"]);
    const brandIndex = getHeaderIndex(headers, ["marca"]);
    const nameIndex = getHeaderIndex(headers, ["nome_func", "nome"]);
    const chapaIndex = getHeaderIndex(headers, ["chapa"]);
    const cpfIndex = getHeaderIndex(headers, ["cpf"]);
    const valueIndex = getHeaderIndex(headers, ["valor", "valor_total"]);
    const parsedRows: HealthCopartRecord[] = [];

    for (const row of rows) {
      const competence = buildCompetenceFromMonthYear(
        getCell(row, monthIndex),
        getCell(row, yearIndex),
      );
      if (!competence) continue;
      const match = competence.match(/^(\d{4})-(\d{2})$/);
      const year = match ? Number(match[1]) : new Date().getFullYear();
      const month = match ? Number(match[2]) : 1;
      const copartDiscountAmount = parseNumber(getCell(row, valueIndex));
      if (copartDiscountAmount <= 0) continue;

      parsedRows.push({
        competence,
        year,
        month,
        copartAmount: 0,
        copartDiscountAmount,
        brand: getCell(row, brandIndex).trim() || "Nao informado",
        employeeId: getCell(row, cpfIndex).trim() || getCell(row, chapaIndex).trim(),
        employeeName: getCell(row, nameIndex).trim(),
      });
    }

    return parsedRows;
  };

  const mainValues = await listSheetRows(benefit.spreadsheetId, benefit.sheetName);
  const main = parseHealthBaseSheet(mainValues);

  const mainDiscountSheetName = env.INDICATORS_HEALTH_DISCOUNT_SHEET_NAME;
  if (mainDiscountSheetName && mainDiscountSheetName !== benefit.sheetName) {
    try {
      const discountValues = await listSheetRows(benefit.spreadsheetId, mainDiscountSheetName);
      main.push(...parseHealthMonthlyDiscountSheet(discountValues));
    } catch (error) {
      throw new Error(
        `Falha ao ler descontos de mensalidade (${mainDiscountSheetName}): ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }
  }

  const copart: HealthCopartRecord[] = [];
  if (benefit.secondarySheetName) {
    try {
      const copartValues = await listSheetRows(benefit.spreadsheetId, benefit.secondarySheetName);
      copart.push(...parseHealthCopartBaseSheet(copartValues));

      const copartDiscountSheetName = env.INDICATORS_HEALTH_COPART_DISCOUNT_SHEET_NAME;
      if (
        copartDiscountSheetName &&
        copartDiscountSheetName !== benefit.secondarySheetName
      ) {
        const discountValues = await listSheetRows(
          benefit.spreadsheetId,
          copartDiscountSheetName,
        );
        copart.push(...parseHealthCopartDiscountSheet(discountValues));
      }
    } catch (error) {
      throw new Error(
        `Falha ao ler copart (${benefit.secondarySheetName}): ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }
  }

  return { main, copart };
};

const readDentalDetailed = async (benefit: BenefitConfig): Promise<DentalRecord[]> => {
  if (!benefit.spreadsheetId) {
    throw new Error("spreadsheet nao configurada para Plano Odontológico");
  }

  const values = await listSheetRows(benefit.spreadsheetId, benefit.sheetName);
  if (values.length <= 1) return [];

  const { headers, rows } = pickHeaderRow(values, [
    "mensalidade",
    "mes",
    "marca_filial",
    "nome_beneficiario",
  ]);

  const monthIndex = getHeaderIndex(headers, ["mes_n", "mes_numero", "mes", "mes_referencia"]);
  const yearIndex = getHeaderIndex(headers, ["ano_n", "ano_no", "ano", "year"]);
  const competenceIndex = getHeaderIndex(headers, ["mes", "competencia", "referencia"]);

  const amountIndex = getHeaderIndex(headers, ["valor", "valor_total", "mensalidade"]);
  const operatorIndex = getHeaderIndex(headers, ["operadora", "empresa"]);
  const brandIndex = getHeaderIndex(headers, ["marca_totvs", "marca_filial", "marca"]);
  const planIndex = getHeaderIndex(headers, ["plano", "plano_de_para"]);
  const nameIndex = getHeaderIndex(headers, ["nome_beneficiario", "nome_segurado", "nome"]);
  const holderNameIndex = getHeaderIndex(headers, ["nome_titular", "titular"]);
  const holderCpfIndex = getHeaderIndex(headers, ["cpf_titular"]);
  const roleIndex = getHeaderIndex(headers, ["cargo_de_para", "cargo", "cargo_depara"]);
  const cpfIndex = getHeaderIndex(headers, ["cpf"]);
  const normalizedEnrollmentIndex = getHeaderIndex(headers, [
    "matricula_normalizada",
    "matricula_funcional",
    "matricula",
  ]);

  if (amountIndex < 0) {
    throw new Error("coluna de valor nao encontrada em Odontológico");
  }

  const result: DentalRecord[] = [];

  for (const row of rows) {
    const monthAsDateCompetence = parseCompetence(getCell(row, monthIndex));
    const competenceByMonthYear = buildCompetenceFromMonthYear(
      getCell(row, monthIndex),
      getCell(row, yearIndex),
    );
    const competence =
      monthAsDateCompetence ||
      competenceByMonthYear ||
      parseCompetence(getCell(row, competenceIndex)) ||
      monthNow();
    const match = competence.match(/^(\d{4})-(\d{2})$/);
    const year = match ? Number(match[1]) : new Date().getFullYear();
    const month = match ? Number(match[2]) : 1;

    const amount = parseNumber(getCell(row, amountIndex));
    if (amount <= 0) continue;

    const enrollment = getCell(row, normalizedEnrollmentIndex).trim();
    const cpf = getCell(row, cpfIndex).trim();

    result.push({
      competence,
      year,
      month,
      amount,
      operator: getCell(row, operatorIndex).trim() || "Nao informado",
      brand: getCell(row, brandIndex).trim() || "Nao informado",
      plan: getCell(row, planIndex).trim() || "Nao informado",
      employeeId: enrollment || cpf,
      employeeName: getCell(row, nameIndex).trim() || "Nao informado",
      holderName: getCell(row, holderNameIndex).trim() || "Nao informado",
      holderCpf: getCell(row, holderCpfIndex).trim(),
      role: getCell(row, roleIndex).trim() || "Nao informado",
    });
  }

  return result;
};

const readMealDetailed = async (benefit: BenefitConfig): Promise<MealRecord[]> => {
  if (!benefit.spreadsheetId) {
    throw new Error("spreadsheet nao configurada para Vale Refeição");
  }

  const values = await listSheetRows(benefit.spreadsheetId, benefit.sheetName);
  if (values.length <= 1) return [];

  const { headers, rows } = pickHeaderRow(values, ["valor", "mes", "ano", "colaborador"]);

  const monthIndex = getHeaderIndex(headers, ["mes", "mes_referencia"]);
  const yearIndex = getHeaderIndex(headers, ["ano", "ano_n", "year"]);
  const competenceIndex = getHeaderIndex(headers, ["competencia", "referencia", "mes"]);

  const amountIndex = getHeaderIndex(headers, ["valor", "valor_total", "custo"]);
  const brandIndex = getHeaderIndex(headers, ["marca"]);
  const personTypeIndex = getHeaderIndex(headers, ["tipo", "tipo_de_pessoa"]);
  const benefitIndex = getHeaderIndex(headers, ["beneficio", "beneficio_de_para"]);
  const roleIndex = getHeaderIndex(headers, ["cargo", "cargo_de_para", "cargo_depara"]);
  const nameIndex = getHeaderIndex(headers, ["colaborador", "nome"]);
  const enrollmentIndex = getHeaderIndex(headers, ["matricula", "matricula_funcional"]);
  const cpfAdjustedIndex = getHeaderIndex(headers, ["cpf_ajustado", "cpf_corrigido"]);
  const cpfIndex = getHeaderIndex(headers, ["cpf"]);
  const lastMonthIndex = getHeaderIndex(headers, ["is_ultimo_mes", "ultimo_mes"]);

  if (amountIndex < 0) {
    throw new Error("coluna de valor nao encontrada em Vale Refeição");
  }

  const records: MealRecord[] = [];
  for (const row of rows) {
    const competenceByMonthYear = buildCompetenceFromMonthYear(
      getCell(row, monthIndex),
      getCell(row, yearIndex),
    );
    const competence =
      competenceByMonthYear || parseCompetence(getCell(row, competenceIndex)) || monthNow();
    const match = competence.match(/^(\d{4})-(\d{2})$/);
    const year = match ? Number(match[1]) : new Date().getFullYear();
    const month = match ? Number(match[2]) : 1;

    const amount = parseNumber(getCell(row, amountIndex));
    if (amount <= 0) continue;

    const enrollment = getCell(row, enrollmentIndex).trim();
    const cpfAdjusted = getCell(row, cpfAdjustedIndex).trim();
    const cpf = getCell(row, cpfIndex).trim();
    const employeeId = enrollment || cpfAdjusted || cpf;
    const isLastMonth = ["1", "true", "sim", "yes"].includes(
      removeDiacritics(getCell(row, lastMonthIndex).trim().toLowerCase()),
    );

    records.push({
      competence,
      year,
      month,
      amount,
      benefit: getCell(row, benefitIndex).trim() || "Nao informado",
      personType: getCell(row, personTypeIndex).trim() || "Nao informado",
      brand: getCell(row, brandIndex).trim() || "Nao informado",
      role: getCell(row, roleIndex).trim() || "Nao informado",
      employeeId,
      employeeName: getCell(row, nameIndex).trim() || "Nao informado",
      isLastMonth,
    });
  }

  return records;
};

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const buildRanking = (rows: RawIndicator[], field: "costCenter" | "provider") => {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row[field] || "Nao informado";
    map.set(key, (map.get(key) ?? 0) + row.amount);
  }

  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
};

const SUPABASE_PAGE_SIZE = 1000;

const hasSupabaseIndicatorsSource = () =>
  Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

const parseBooleanValue = (value: unknown) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "sim", "yes", "ativo", "active"].includes(normalized);
};

const fetchAllSupabaseRows = async <T>(table: string, columns = "*"): Promise<T[]> => {
  const supabase = getSupabaseAdminClient();
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, to);

    if (error) {
      throw new Error(`Falha ao ler ${table} no Supabase: ${error.message}`);
    }

    const batch = (data ?? []) as T[];
    rows.push(...batch);

    if (batch.length < SUPABASE_PAGE_SIZE) {
      break;
    }

    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
};

const mapTransportSupabaseRows = (rows: TransportStagingRow[]): TransportRecord[] =>
  rows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    amount: Number(row.amount ?? 0),
    economyAmount: Number(row.economy_amount ?? 0),
    hasEconomy: parseBooleanValue(row.has_economy),
    employeeId: row.employee_id ?? "",
    employeeName: row.employee_name ?? "",
    brand: row.brand ?? "Nao informado",
    role: row.role ?? "Nao informado",
  }));

const mapHealthSupabaseRows = (
  premiumRows: HealthStagingRow[],
  discountRows: HealthDiscountStagingRow[],
): HealthRecord[] => [
  ...premiumRows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    premiumAmount: Number(row.premium_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    brand: row.brand ?? "Nao informado",
    role: row.operator ?? "Nao informado",
    employeeId: row.employee_id || row.cpf || "",
    employeeName: row.employee_name ?? "",
    status: row.status ?? "Nao informado",
    holderType: row.holder_type ?? "Nao informado",
  })),
  ...discountRows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    premiumAmount: 0,
    discountAmount: Number(row.discount_amount ?? 0),
    brand: row.brand ?? "Nao informado",
    role: row.role_name ?? "Nao informado",
    employeeId: row.employee_id || row.cpf || "",
    employeeName: row.normalized_employee_name || row.employee_name || "",
    status: "Nao informado",
    holderType: "Nao informado",
  })),
];

const mapHealthCopartSupabaseRows = (
  copartRows: HealthCopartStagingRow[],
  discountRows: HealthCopartDiscountStagingRow[],
): HealthCopartRecord[] => [
  ...copartRows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    copartAmount: Number(row.copart_amount ?? 0),
    copartDiscountAmount: 0,
    brand: row.brand ?? "Nao informado",
    employeeId: row.employee_id ?? "",
    employeeName: row.employee_name ?? "",
  })),
  ...discountRows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    copartAmount: 0,
    copartDiscountAmount: Number(row.discount_amount ?? 0),
    brand: row.brand ?? "Nao informado",
    employeeId: row.employee_id || row.cpf || "",
    employeeName: row.employee_name ?? "",
  })),
];

const mapDentalSupabaseRows = (rows: DentalStagingRow[]): DentalRecord[] =>
  rows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    amount: Number(row.amount ?? 0),
    operator: row.operator ?? "Nao informado",
    brand: row.brand_totvs ?? "Nao informado",
    plan: row.plan ?? "Nao informado",
    employeeId: row.employee_id ?? "",
    employeeName: row.employee_name ?? "",
    holderName: row.holder_name ?? "",
    holderCpf: row.holder_cpf ?? "",
    role: row.role ?? "Nao informado",
  }));

const mapMealSupabaseRows = (rows: MealStagingRow[]): MealRecord[] =>
  rows.map((row) => ({
    competence: row.competence,
    year: Number(row.year),
    month: Number(row.month),
    amount: Number(row.amount ?? 0),
    benefit: row.benefit_name ?? "Nao informado",
    personType: row.transaction_type ?? "Nao informado",
    brand: row.brand ?? "Nao informado",
    role: row.role ?? "Nao informado",
    employeeId: row.employee_id ?? "",
    employeeName: row.employee_name ?? "Nao informado",
    isLastMonth: parseBooleanValue(row.is_last_month),
  }));

const mapHealthMainToSupabaseRaw = (rows: HealthRecord[]): RawIndicator[] =>
  rows
    .filter((row) => row.premiumAmount > 0)
    .map((row) => ({
      benefit: "health",
      competence: row.competence,
      year: row.year,
      month: row.month,
      amount: row.premiumAmount,
      discountAmount: row.discountAmount,
      headcount: 1,
      costCenter: row.brand || "Nao informado",
      provider: "Plano de Saude",
      brand: row.brand || "Nao informado",
      role: row.role || "Nao informado",
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      hasEconomy: false,
      economyAmount: 0,
    }));

const mapDentalSupabaseToRaw = (rows: DentalRecord[]): RawIndicator[] =>
  rows.map((row) => ({
    benefit: "dental",
    competence: row.competence,
    year: row.year,
    month: row.month,
    amount: row.amount,
    discountAmount: 0,
    headcount: 1,
    costCenter: row.brand || "Nao informado",
    provider: row.operator || "Nao informado",
    brand: row.brand || "Nao informado",
    role: row.role || "Nao informado",
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    hasEconomy: false,
    economyAmount: 0,
  }));

const mapMealSupabaseToRaw = (rows: MealRecord[]): RawIndicator[] =>
  rows.map((row) => ({
    benefit: "meal",
    competence: row.competence,
    year: row.year,
    month: row.month,
    amount: row.amount,
    discountAmount: 0,
    headcount: 1,
    costCenter: row.brand || "Nao informado",
    provider: row.benefit || "Nao informado",
    brand: row.brand || "Nao informado",
    role: row.role || "Nao informado",
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    hasEconomy: false,
    economyAmount: 0,
  }));

const mapTransportSupabaseToRaw = (rows: TransportRecord[]): RawIndicator[] =>
  rows.map((row) => ({
    benefit: "transport",
    competence: row.competence,
    year: row.year,
    month: row.month,
    amount: row.amount,
    discountAmount: 0,
    headcount: 1,
    costCenter: row.brand || "Nao informado",
    provider: "Vale Transporte",
    brand: row.brand || "Nao informado",
    role: row.role || "Nao informado",
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    hasEconomy: row.hasEconomy,
    economyAmount: row.economyAmount,
  }));

const getIndicatorsSourceDataFromSupabase = async (): Promise<IndicatorsSourceData> => {
  const warnings: string[] = [];

  const [
    transportRows,
    healthRows,
    healthCopartRows,
    healthDiscountRows,
    healthCopartDiscountRows,
    dentalRows,
    mealRows,
  ] = await Promise.all([
    fetchAllSupabaseRows<TransportStagingRow>("indicator_transport_staging").catch((error) => {
      warnings.push(error instanceof Error ? error.message : "Falha ao ler VT no Supabase.");
      return [];
    }),
    fetchAllSupabaseRows<HealthStagingRow>("indicator_health_staging").catch((error) => {
      warnings.push(error instanceof Error ? error.message : "Falha ao ler saude no Supabase.");
      return [];
    }),
    fetchAllSupabaseRows<HealthCopartStagingRow>("indicator_health_copart_staging").catch(
      (error) => {
        warnings.push(
          error instanceof Error ? error.message : "Falha ao ler copart no Supabase.",
        );
        return [];
      },
    ),
    fetchAllSupabaseRows<HealthDiscountStagingRow>(
      "indicator_health_monthly_discounts_staging",
    ).catch((error) => {
      warnings.push(
        error instanceof Error ? error.message : "Falha ao ler descontos de mensalidade.",
      );
      return [];
    }),
    fetchAllSupabaseRows<HealthCopartDiscountStagingRow>(
      "indicator_health_copart_discounts_staging",
    ).catch((error) => {
      warnings.push(
        error instanceof Error ? error.message : "Falha ao ler descontos de coparticipacao.",
      );
      return [];
    }),
    fetchAllSupabaseRows<DentalStagingRow>("indicator_dental_staging").catch((error) => {
      warnings.push(
        error instanceof Error ? error.message : "Falha ao ler odontologico no Supabase.",
      );
      return [];
    }),
    fetchAllSupabaseRows<MealStagingRow>("indicator_meal_staging").catch((error) => {
      warnings.push(error instanceof Error ? error.message : "Falha ao ler refeicao no Supabase.");
      return [];
    }),
  ]);

  const transportRecords = mapTransportSupabaseRows(transportRows);
  const healthRecords = mapHealthSupabaseRows(healthRows, healthDiscountRows);
  const healthCopartRecords = mapHealthCopartSupabaseRows(
    healthCopartRows,
    healthCopartDiscountRows,
  );
  const dentalRecords = mapDentalSupabaseRows(dentalRows);
  const mealRecords = mapMealSupabaseRows(mealRows);

  return {
    records: [
      ...mapHealthMainToSupabaseRaw(healthRecords),
      ...mapDentalSupabaseToRaw(dentalRecords),
      ...mapTransportSupabaseToRaw(transportRecords),
      ...mapMealSupabaseToRaw(mealRecords),
    ],
    healthRecords,
    healthCopartRecords,
    dentalRecords,
    mealRecords,
    warnings,
  };
};

const buildEmptyIndicatorsSourceData = (
  warning: string,
): IndicatorsSourceData => ({
  records: [],
  healthRecords: [],
  healthCopartRecords: [],
  dentalRecords: [],
  mealRecords: [],
  warnings: [warning],
});

export const getIndicatorsDashboardDataUncached = async (): Promise<IndicatorsDashboardData> => {
  if (hasSupabaseIndicatorsSource()) {
    return buildDashboardFromSource(await getIndicatorsSourceDataFromSupabase());
  }

  const hasAnySpreadsheet = BENEFITS.some((benefit) => Boolean(benefit.spreadsheetId));
  if (!hasAnySpreadsheet) {
    return buildDashboardFromSource(
      buildEmptyIndicatorsSourceData(
        "Indicadores em migracao: nenhuma fonte de dados configurada ainda.",
      ),
    );
  }

  const warnings: string[] = [];
  let healthMainRecords: HealthRecord[] = [];
  let healthCopartRecords: HealthCopartRecord[] = [];
  let dentalDetailedRecords: DentalRecord[] = [];
  let mealDetailedRecords: MealRecord[] = [];

  const mapHealthMainToRaw = (rows: HealthRecord[]): RawIndicator[] =>
    rows.map((row) => ({
      benefit: "health",
      competence: row.competence,
      year: row.year,
      month: row.month,
      amount: row.premiumAmount,
      discountAmount: row.discountAmount,
      headcount: 1,
      costCenter: row.brand || "Nao informado",
      provider: "Plano de Saude",
      brand: row.brand || "Nao informado",
      role: row.role || "Nao informado",
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      hasEconomy: false,
      economyAmount: 0,
    }));

  const datasets = await Promise.all(
    BENEFITS.map(async (benefit) => {
      try {
        if (benefit.key === "health") {
          try {
            const healthData = await readHealthDetailed(benefit);
            healthMainRecords = healthData.main;
            healthCopartRecords = healthData.copart;
            return mapHealthMainToRaw(healthData.main);
          } catch (error) {
            const message = error instanceof Error ? error.message : "falha ao carregar saúde";
            warnings.push(message);
            return [];
          }
        }
        if (benefit.key === "dental") {
          try {
            dentalDetailedRecords = await readDentalDetailed(benefit);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "falha ao carregar odontológico";
            warnings.push(message);
          }
        }
        if (benefit.key === "meal") {
          try {
            mealDetailedRecords = await readMealDetailed(benefit);
          } catch (error) {
            const message = error instanceof Error ? error.message : "falha ao carregar vale refeição";
            warnings.push(message);
          }
        }
        return await readBenefitSheet(benefit);
      } catch (error) {
        const message = error instanceof Error ? error.message : "falha ao carregar aba";
        warnings.push(`Nao foi possivel ler ${benefit.sheetName}: ${message}`);
        return [];
      }
    }),
  );

  const records = datasets.flat();
  const competences = Array.from(new Set(records.map((row) => row.competence))).sort();

  const nowCompetence = monthNow();
  const competenceCurrent = competences.includes(nowCompetence)
    ? nowCompetence
    : (competences.at(-1) ?? nowCompetence);
  const calculatedPrevious = previousCompetenceOf(competenceCurrent);
  const competencePrevious =
    calculatedPrevious && competences.includes(calculatedPrevious)
      ? calculatedPrevious
      : competences.length > 1
        ? (competences.at(-2) ?? null)
        : null;

  const byCompetence = (competence: string | null) =>
    competence ? records.filter((row) => row.competence === competence) : [];

  const rowsCurrent = byCompetence(competenceCurrent);
  const rowsPrevious = byCompetence(competencePrevious);

  const totalCurrent = sum(rowsCurrent.map((row) => row.amount));
  const totalPrevious = sum(rowsPrevious.map((row) => row.amount));

  const benefitSummaries = BENEFITS.map((benefit) => {
    const currentRows = rowsCurrent.filter((row) => row.benefit === benefit.key);
    const previousRows = rowsPrevious.filter((row) => row.benefit === benefit.key);
    const currentTotal = sum(currentRows.map((row) => row.amount));
    const previousTotal = sum(previousRows.map((row) => row.amount));
    const headcountCurrent = sum(currentRows.map((row) => row.headcount));

    return {
      key: benefit.key,
      label: benefit.label,
      totalCurrent: currentTotal,
      totalPrevious: previousTotal,
      variationPercent: variationPercent(currentTotal, previousTotal),
      headcountCurrent,
      averageCostPerPerson: headcountCurrent > 0 ? currentTotal / headcountCurrent : null,
    };
  });

  const trendCompetences = competences.slice(-6);
  const trend = trendCompetences.map((competence) => {
    const rows = records.filter((row) => row.competence === competence);
    const byBenefit: Record<BenefitKey, number> = {
      health: 0,
      dental: 0,
      transport: 0,
      meal: 0,
    };

    for (const row of rows) {
      byBenefit[row.benefit] += row.amount;
    }

    return {
      competence,
      byBenefit,
      total: sum(Object.values(byBenefit)),
    };
  });

  const topCostCenters = buildRanking(rowsCurrent, "costCenter");

  const benefitDashboards: BenefitTabDashboard[] = BENEFITS.map((benefit) => {
    const recordsByBenefit = records.filter((row) => row.benefit === benefit.key);
    const currentRows = recordsByBenefit.filter((row) => row.competence === competenceCurrent);
    const previousRows = recordsByBenefit.filter(
      (row) => row.competence === competencePrevious,
    );

    const currentTotal = sum(currentRows.map((row) => row.amount));
    const previousTotal = sum(previousRows.map((row) => row.amount));
    const headcountCurrent = sum(currentRows.map((row) => row.headcount));

    return {
      key: benefit.key,
      label: benefit.label,
      competenceCurrent,
      competencePrevious,
      totalCurrent: currentTotal,
      totalPrevious: previousTotal,
      variationPercent: variationPercent(currentTotal, previousTotal),
      headcountCurrent,
      averageCostPerPerson: headcountCurrent > 0 ? currentTotal / headcountCurrent : null,
      trend: trendCompetences.map((competence) => ({
        competence,
        total: sum(
          recordsByBenefit
            .filter((row) => row.competence === competence)
            .map((row) => row.amount),
        ),
      })),
      topCostCenters: buildRanking(currentRows, "costCenter"),
      topProviders: buildRanking(currentRows, "provider"),
    };
  });

  const transportRecords: TransportRecord[] = records
    .filter((row) => row.benefit === "transport")
    .map((row) => ({
      competence: row.competence,
      year: row.year,
      month: row.month,
      amount: row.amount,
      economyAmount: row.economyAmount,
      hasEconomy: row.hasEconomy,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      brand: row.brand,
      role: row.role,
    }));

  return {
    competenceCurrent,
    competencePrevious,
    totalCurrent,
    totalPrevious,
    totalVariationPercent: variationPercent(totalCurrent, totalPrevious),
    benefitSummaries,
    trend,
    topCostCenters,
    benefitDashboards,
    transportRecords,
    healthRecords: healthMainRecords,
    healthCopartRecords: healthCopartRecords,
    dentalRecords: dentalDetailedRecords,
    mealRecords: mealDetailedRecords,
    warnings,
  };
};

const INDICATORS_CACHE_TTL_MS = 10 * 60 * 1000;
let indicatorsSourceCache:
  | {
      expiresAt: number;
      data: IndicatorsSourceData;
    }
  | null = null;
let indicatorsSourceInFlight: Promise<IndicatorsSourceData> | null = null;

const mapHealthMainToOverviewRaw = (rows: HealthRecord[]): RawIndicator[] =>
  rows.map((row) => ({
    benefit: "health",
    competence: row.competence,
    year: row.year,
    month: row.month,
    amount: row.premiumAmount,
    discountAmount: row.discountAmount,
    headcount: 1,
    costCenter: row.brand || "Nao informado",
    provider: "Plano de Saude",
    brand: row.brand || "Nao informado",
    role: row.role || "Nao informado",
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    hasEconomy: false,
    economyAmount: 0,
  }));

const mapTransportDetailRecords = (rows: RawIndicator[]): TransportRecord[] =>
  rows
    .filter((row) => row.benefit === "transport")
    .map((row) => ({
      competence: row.competence,
      year: row.year,
      month: row.month,
      amount: row.amount,
      economyAmount: row.economyAmount,
      hasEconomy: row.hasEconomy,
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      brand: row.brand,
      role: row.role,
    }));

const buildDashboardFromSource = ({
  records,
  healthRecords,
  healthCopartRecords,
  dentalRecords,
  mealRecords,
  warnings,
}: IndicatorsSourceData): IndicatorsDashboardData => {
  const overview = buildOverviewFromRecords(records, warnings);

  return {
    ...overview,
    transportRecords: mapTransportDetailRecords(records),
    healthRecords,
    healthCopartRecords,
    dentalRecords,
    mealRecords,
  };
};

const applyIndicatorScopeToSource = (
  source: IndicatorsSourceData,
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): IndicatorsSourceData => {
  if (!scope || scope.isAdmin) {
    return source;
  }

  return {
    records: filterBrandsForScope(source.records, scope),
    healthRecords: filterBrandsForScope(source.healthRecords, scope),
    healthCopartRecords: filterBrandsForScope(source.healthCopartRecords, scope),
    dentalRecords: filterBrandsForScope(source.dentalRecords, scope),
    mealRecords: filterBrandsForScope(source.mealRecords, scope),
    warnings: source.warnings,
  };
};

const buildOverviewFromRecords = (
  records: RawIndicator[],
  warnings: string[],
): IndicatorsOverviewData => {
  const competences = Array.from(new Set(records.map((row) => row.competence))).sort();
  const nowCompetence = monthNow();
  const competenceCurrent = competences.includes(nowCompetence)
    ? nowCompetence
    : (competences.at(-1) ?? nowCompetence);
  const calculatedPrevious = previousCompetenceOf(competenceCurrent);
  const competencePrevious =
    calculatedPrevious && competences.includes(calculatedPrevious)
      ? calculatedPrevious
      : competences.length > 1
        ? (competences.at(-2) ?? null)
        : null;

  const byCompetence = (competence: string | null) =>
    competence ? records.filter((row) => row.competence === competence) : [];

  const rowsCurrent = byCompetence(competenceCurrent);
  const rowsPrevious = byCompetence(competencePrevious);
  const totalCurrent = sum(rowsCurrent.map((row) => row.amount));
  const totalPrevious = sum(rowsPrevious.map((row) => row.amount));

  const benefitSummaries = BENEFITS.map((benefit) => {
    const currentRows = rowsCurrent.filter((row) => row.benefit === benefit.key);
    const previousRows = rowsPrevious.filter((row) => row.benefit === benefit.key);
    const currentTotal = sum(currentRows.map((row) => row.amount));
    const previousTotal = sum(previousRows.map((row) => row.amount));
    const headcountCurrent = sum(currentRows.map((row) => row.headcount));

    return {
      key: benefit.key,
      label: benefit.label,
      totalCurrent: currentTotal,
      totalPrevious: previousTotal,
      variationPercent: variationPercent(currentTotal, previousTotal),
      headcountCurrent,
      averageCostPerPerson: headcountCurrent > 0 ? currentTotal / headcountCurrent : null,
    };
  });

  const trendCompetences = competences.slice(-6);
  const trend = trendCompetences.map((competence) => {
    const rows = records.filter((row) => row.competence === competence);
    const byBenefit: Record<BenefitKey, number> = {
      health: 0,
      dental: 0,
      transport: 0,
      meal: 0,
    };

    for (const row of rows) {
      byBenefit[row.benefit] += row.amount;
    }

    return {
      competence,
      byBenefit,
      total: sum(Object.values(byBenefit)),
    };
  });

  const benefitDashboards: BenefitTabDashboard[] = BENEFITS.map((benefit) => {
    const recordsByBenefit = records.filter((row) => row.benefit === benefit.key);
    const currentRows = recordsByBenefit.filter((row) => row.competence === competenceCurrent);
    const previousRows = recordsByBenefit.filter(
      (row) => row.competence === competencePrevious,
    );

    const currentTotal = sum(currentRows.map((row) => row.amount));
    const previousTotal = sum(previousRows.map((row) => row.amount));
    const headcountCurrent = sum(currentRows.map((row) => row.headcount));

    return {
      key: benefit.key,
      label: benefit.label,
      competenceCurrent,
      competencePrevious,
      totalCurrent: currentTotal,
      totalPrevious: previousTotal,
      variationPercent: variationPercent(currentTotal, previousTotal),
      headcountCurrent,
      averageCostPerPerson: headcountCurrent > 0 ? currentTotal / headcountCurrent : null,
      trend: trendCompetences.map((competence) => ({
        competence,
        total: sum(
          recordsByBenefit
            .filter((row) => row.competence === competence)
            .map((row) => row.amount),
        ),
      })),
      topCostCenters: buildRanking(currentRows, "costCenter"),
      topProviders: buildRanking(currentRows, "provider"),
    };
  });

  return {
    competenceCurrent,
    competencePrevious,
    totalCurrent,
    totalPrevious,
    totalVariationPercent: variationPercent(totalCurrent, totalPrevious),
    benefitSummaries,
    trend,
    topCostCenters: buildRanking(rowsCurrent, "costCenter"),
    benefitDashboards,
    warnings,
  };
};

const getIndicatorsSourceDataUncached = async (): Promise<IndicatorsSourceData> => {
  if (hasSupabaseIndicatorsSource()) {
    return getIndicatorsSourceDataFromSupabase();
  }

  const hasAnySpreadsheet = BENEFITS.some((benefit) => Boolean(benefit.spreadsheetId));
  if (!hasAnySpreadsheet) {
    return buildEmptyIndicatorsSourceData(
      "Indicadores em migracao: nenhuma fonte de dados configurada ainda.",
    );
  }

  const warnings: string[] = [];
  let healthMainRecords: HealthRecord[] = [];
  let healthCopartRecords: HealthCopartRecord[] = [];
  let dentalDetailedRecords: DentalRecord[] = [];
  let mealDetailedRecords: MealRecord[] = [];

  const datasets = await Promise.all(
    BENEFITS.map(async (benefit) => {
      try {
        if (benefit.key === "health") {
          try {
            const healthData = await readHealthDetailed(benefit);
            healthMainRecords = healthData.main;
            healthCopartRecords = healthData.copart;
            return mapHealthMainToOverviewRaw(healthData.main);
          } catch (error) {
            const message = error instanceof Error ? error.message : "falha ao carregar saude";
            warnings.push(message);
            return [];
          }
        }
        if (benefit.key === "dental") {
          try {
            dentalDetailedRecords = await readDentalDetailed(benefit);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "falha ao carregar odontologico";
            warnings.push(message);
          }
        }
        if (benefit.key === "meal") {
          try {
            mealDetailedRecords = await readMealDetailed(benefit);
          } catch (error) {
            const message = error instanceof Error ? error.message : "falha ao carregar vale refeicao";
            warnings.push(message);
          }
        }
        return await readBenefitSheet(benefit);
      } catch (error) {
        const message = error instanceof Error ? error.message : "falha ao carregar aba";
        warnings.push(`Nao foi possivel ler ${benefit.sheetName}: ${message}`);
        return [];
      }
    }),
  );

  return {
    records: datasets.flat(),
    healthRecords: healthMainRecords,
    healthCopartRecords,
    dentalRecords: dentalDetailedRecords,
    mealRecords: mealDetailedRecords,
    warnings,
  };
};

const getIndicatorsSourceData = async (): Promise<IndicatorsSourceData> => {
  const now = Date.now();
  if (indicatorsSourceCache && indicatorsSourceCache.expiresAt > now) {
    return indicatorsSourceCache.data;
  }

  if (indicatorsSourceInFlight) {
    return indicatorsSourceInFlight;
  }

  indicatorsSourceInFlight = getIndicatorsSourceDataUncached()
    .then((data) => {
      indicatorsSourceCache = {
        data,
        expiresAt: Date.now() + INDICATORS_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      indicatorsSourceInFlight = null;
    });

  return indicatorsSourceInFlight;
};

export const getIndicatorsDashboardData = async (
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorsDashboardData> => {
  const source = await getIndicatorsSourceData();
  return buildDashboardFromSource(applyIndicatorScopeToSource(source, scope));
};

export const getIndicatorsOverviewData = async (
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorsOverviewData> => {
  const source = await getIndicatorsSourceData();
  return buildOverviewFromRecords(
    applyIndicatorScopeToSource(source, scope).records,
    source.warnings,
  );
};

export function getIndicatorDetailData(
  benefitKey: "health",
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorDetailByBenefit["health"]>;
export function getIndicatorDetailData(
  benefitKey: "dental",
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorDetailByBenefit["dental"]>;
export function getIndicatorDetailData(
  benefitKey: "meal",
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorDetailByBenefit["meal"]>;
export function getIndicatorDetailData(
  benefitKey: "transport",
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorDetailByBenefit["transport"]>;
export async function getIndicatorDetailData(
  benefitKey: BenefitKey,
  scope?: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
): Promise<IndicatorDetailResponse> {
  const source = applyIndicatorScopeToSource(await getIndicatorsSourceData(), scope);

  if (benefitKey === "health") {
    return {
      key: "health",
      warnings: source.warnings,
      healthRecords: source.healthRecords,
      healthCopartRecords: source.healthCopartRecords,
    };
  }

  if (benefitKey === "dental") {
    return {
      key: "dental",
      warnings: source.warnings,
      dentalRecords: source.dentalRecords,
    };
  }

  if (benefitKey === "meal") {
    return {
      key: "meal",
      warnings: source.warnings,
      mealRecords: source.mealRecords,
    };
  }

  return {
    key: "transport",
    warnings: source.warnings,
    transportRecords: mapTransportDetailRecords(
      source.records.filter((row) => row.benefit === "transport"),
    ),
  };
};
