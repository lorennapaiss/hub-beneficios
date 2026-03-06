import "server-only";
import { competenceSchema } from "@/lib/schema";
import { getDriveClient } from "@/server/payments/drive";
import { getFaturasConfig } from "@/server/faturas/config";

const MONTH_NAMES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARCO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

const replaceTokens = (pattern: string, tokens: Record<string, string>) => {
  return pattern.replace(/YYYY|MES_LABEL|MES|MM|M/g, (match) => {
    return tokens[match] ?? match;
  });
};

const normalizeCompetencia = (competencia: string) => {
  const normalized = competencia.trim();
  const parsed = competenceSchema.safeParse(normalized);
  if (parsed.success) return parsed.data;

  const fallbackMatch = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (!fallbackMatch) return null;
  const year = fallbackMatch[1];
  const month = fallbackMatch[2].padStart(2, "0");
  return `${year}-${month}`;
};

const formatFolderName = (competencia: string, pattern: string) => {
  const normalizedCompetencia = normalizeCompetencia(competencia);
  if (!normalizedCompetencia) {
    throw new Error("Competência inválida. Use o formato AAAA-MM.");
  }

  const [year, month] = normalizedCompetencia.split("-");
  const normalizedPattern = pattern?.trim() || "YYYY-MM";
  const monthIndex = Number(month) - 1;
  const monthName = MONTH_NAMES[monthIndex] ?? "";
  const monthNumber = String(Number(month));
  const monthLabel = `${month} - ${monthName}`;
  return replaceTokens(normalizedPattern, {
    YYYY: year,
    MM: month,
    M: monthNumber,
    MES: monthName,
    MES_LABEL: monthLabel,
  });
};

const findFolderByName = async (
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string,
) => {
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${name.replace(/'/g, "\\'")}'`,
    `'${parentId}' in parents`,
    "trashed=false",
  ].join(" and ");

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data.files?.[0] ?? null;
};

export const resolveFolderIdByCompetencia = async (competencia: string) => {
  const { baseFolderId, competenciaPattern } = await getFaturasConfig();
  if (!baseFolderId) {
    throw new Error(
      "Pasta base de faturas não configurada. Defina FATURAS_SULAMERICA_BASE_FOLDER_ID.",
    );
  }

  const folderPath = formatFolderName(competencia, competenciaPattern);
  const drive = getDriveClient();
  const parts = folderPath
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  let currentId = baseFolderId;
  for (const part of parts) {
    const folder = await findFolderByName(drive, part, currentId);
    if (!folder?.id) {
      throw new Error(
        `Não foi possível localizar a pasta "${part}" para a competência ${competencia}.`,
      );
    }
    currentId = folder.id;
  }

  return currentId;
};

type NormalizedFaturaFile = {
  contrato_codigo: string;
  empresa_nome: string;
  file_id: string;
  file_name: string;
  modified_time?: string;
  web_view_link?: string;
};

const parseFileName = (fileName: string) => {
  const withoutExt = fileName.replace(/\.xlsx$/i, "").trim();
  const separator = " - ";
  const separatorIndex = withoutExt.indexOf(separator);

  if (separatorIndex === -1) {
    return {
      contrato_codigo: withoutExt,
      empresa_nome: "",
    };
  }

  return {
    contrato_codigo: withoutExt.slice(0, separatorIndex).trim(),
    empresa_nome: withoutExt.slice(separatorIndex + separator.length).trim(),
  };
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const listFaturaFilesByCompetencia = async (competencia: string) => {
  const folderId = await resolveFolderIdByCompetencia(competencia);
  const drive = getDriveClient();
  const files: NormalizedFaturaFile[] = [];
  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: [
        `'${folderId}' in parents`,
        "trashed=false",
        "mimeType!='application/vnd.google-apps.folder'",
      ].join(" and "),
      fields: "nextPageToken, files(id, name, modifiedTime, webViewLink)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
      pageToken,
    });

    const batch = response.data.files ?? [];
    for (const file of batch) {
      if (!file.id || !file.name) continue;
      if (!file.name.toLowerCase().endsWith(".xlsx")) continue;
      const { contrato_codigo, empresa_nome } = parseFileName(file.name);
      files.push({
        contrato_codigo,
        empresa_nome,
        file_id: file.id,
        file_name: file.name,
        modified_time: file.modifiedTime ?? undefined,
        web_view_link: file.webViewLink ?? undefined,
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  const deduped = new Map<string, NormalizedFaturaFile>();
  for (const file of files) {
    const existing = deduped.get(file.contrato_codigo);
    if (!existing) {
      deduped.set(file.contrato_codigo, file);
      continue;
    }

    if (toTimestamp(file.modified_time) > toTimestamp(existing.modified_time)) {
      deduped.set(file.contrato_codigo, file);
    }
  }

  return Array.from(deduped.values()).sort((a, b) =>
    a.contrato_codigo.localeCompare(b.contrato_codigo, "pt-BR"),
  );
};

