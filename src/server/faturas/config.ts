import "server-only";
import { env } from "@/lib/env";
import { ConfigSchema } from "@/lib/schema";
import { SHEETS } from "@/config/payments-constants";
import { CONFIG_COLUMNS } from "@/server/payments/sheets-schema";
import { getConfig } from "@/server/payments/sheets";
import { getSheetRange } from "@/server/payments/sheets-utils";

export const getFaturasConfig = async () => {
  const baseFolderEnv = env.FATURAS_SULAMERICA_BASE_FOLDER_ID ?? "";
  const patternEnv = env.COMPETENCIA_FOLDER_PATTERN ?? "YYYY-MM";
  const sheetId = env.PAYMENTS_SHEETS_ID ?? "";

  if (!sheetId) {
    return {
      baseFolderId: baseFolderEnv,
      competenciaPattern: patternEnv,
    };
  }

  const range = getSheetRange(SHEETS.CONFIG, CONFIG_COLUMNS.length);
  const config = await getConfig(sheetId, range);
  const parsed = ConfigSchema.parse(config ?? {});

  return {
    baseFolderId: parsed.faturas_sulamerica_base_folder_id || baseFolderEnv,
    competenciaPattern: parsed.competencia_folder_pattern || patternEnv,
  };
};
