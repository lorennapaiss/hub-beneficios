import "server-only";

import { getRows } from "@/server/sheets";
import { getSupabaseAdminClient } from "@/server/supabase";

const USER_BRAND_ACCESS_SHEET = "user_brand_access";
const USER_BRAND_ACCESS_TABLE = "indicator_user_brand_access";

type SheetUserBrandAccessRow = {
  id?: string;
  user_id?: string;
  user_email?: string;
  brand_id?: string;
  brand_code?: string;
  brand_name?: string;
  role?: string;
  is_active?: string;
};

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim() ?? "";
  return normalized || null;
};

const toBoolean = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return true;
  return ["true", "1", "sim", "yes", "ativo", "active"].includes(normalized);
};

const normalizeSheetRow = (row: SheetUserBrandAccessRow) => ({
  user_id: normalizeText(row.user_id),
  user_email: normalizeText(row.user_email)?.toLowerCase() ?? "",
  brand_id: normalizeText(row.brand_id),
  brand_code: normalizeText(row.brand_code),
  brand_name: normalizeText(row.brand_name),
  role: normalizeText(row.role),
  is_active: toBoolean(row.is_active),
});

export const importIndicatorAccessFromSheets = async () => {
  const rows = (await getRows(USER_BRAND_ACCESS_SHEET)) as SheetUserBrandAccessRow[];
  const normalizedRows = rows
    .map(normalizeSheetRow)
    .filter((row) => row.user_email && (row.brand_name || row.brand_code || row.brand_id));

  const supabase = getSupabaseAdminClient();

  const { error: deleteError } = await supabase
    .from(USER_BRAND_ACCESS_TABLE)
    .delete()
    .not("user_email", "is", null);

  if (deleteError) {
    throw new Error(`Falha ao limpar acessos antigos no Supabase. ${deleteError.message}`);
  }

  if (normalizedRows.length === 0) {
    return {
      importedCount: 0,
      skippedCount: rows.length,
    };
  }

  const { error: insertError } = await supabase
    .from(USER_BRAND_ACCESS_TABLE)
    .insert(normalizedRows);

  if (insertError) {
    throw new Error(`Falha ao importar acessos para o Supabase. ${insertError.message}`);
  }

  return {
    importedCount: normalizedRows.length,
    skippedCount: rows.length - normalizedRows.length,
  };
};
