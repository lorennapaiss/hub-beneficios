import "server-only";

import {
  AppUserAccessProfile,
  AppUserRole,
  normalizeAppUserRole,
} from "@/lib/user-access";
import { isAdminEmail, isAllowedEmail } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/server/supabase";

type UserBrandAccessRow = {
  user_email?: string | null;
  user_id?: string | null;
  brand_id?: string | null;
  brand_code?: string | null;
  brand_name?: string | null;
  role?: string | null;
  is_active?: boolean | string | null;
};

const USER_BRAND_ACCESS_TABLE = "indicator_user_brand_access";

export const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const normalizeBrand = (value?: string | null) =>
  value
    ?.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase() ?? "";

const isGlobalBrand = (value?: string | null) => {
  const normalized = normalizeBrand(value);
  return normalized === "all" || normalized === "*";
};

const isActiveRow = (value?: boolean | string | null) => {
  if (typeof value === "boolean") return value;
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return ["true", "1", "sim", "yes", "ativo", "active"].includes(normalized);
};

const getRolePriority = (role: AppUserRole) => {
  if (role === "ADMIN") return 3;
  if (role === "BENEFITS_ASSISTANT") return 2;
  return 1;
};

const getRowIdentity = (row: UserBrandAccessRow) =>
  normalizeEmail(row.user_email || row.user_id);

const getRowBrand = (row: UserBrandAccessRow) =>
  row.brand_name?.trim() || row.brand_code?.trim() || row.brand_id?.trim() || "";

export const fetchUserAccessRows = async () => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from(USER_BRAND_ACCESS_TABLE)
      .select("user_email, user_id, brand_id, brand_code, brand_name, role, is_active");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as UserBrandAccessRow[];
  } catch {
    return [] as UserBrandAccessRow[];
  }
};

export const buildUserAccessProfile = (
  email: string,
  rows: UserBrandAccessRow[],
): AppUserAccessProfile | null => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  if (isAdminEmail(normalizedEmail)) {
    return {
      email: normalizedEmail,
      role: "ADMIN",
      allowedBrands: ["ALL"],
      hasGlobalBrandAccess: true,
    };
  }

  const matchingRows = rows.filter(
    (row) => isActiveRow(row.is_active) && getRowIdentity(row) === normalizedEmail,
  );

  if (matchingRows.length === 0) {
    if (!isAllowedEmail(normalizedEmail)) {
      return null;
    }

    return {
      email: normalizedEmail,
      role: "BENEFITS_ASSISTANT",
      allowedBrands: ["ALL"],
      hasGlobalBrandAccess: true,
    };
  }

  let highestRole: AppUserRole = "BRAND";
  const brands = new Map<string, string>();

  for (const row of matchingRows) {
    const role = normalizeAppUserRole(row.role);
    if (getRolePriority(role) > getRolePriority(highestRole)) {
      highestRole = role;
    }

    const brand = getRowBrand(row);
    if (!brand) continue;
    brands.set(normalizeBrand(brand), brand);
  }

  const allowedBrands = Array.from(brands.values());
  const hasGlobalBrandAccess =
    highestRole !== "BRAND" || allowedBrands.some((brand) => isGlobalBrand(brand));

  return {
    email: normalizedEmail,
    role: highestRole,
    allowedBrands:
      hasGlobalBrandAccess && allowedBrands.length === 0 ? ["ALL"] : allowedBrands,
    hasGlobalBrandAccess,
  };
};

export const getUserAccessProfile = async (email?: string | null) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const rows = await fetchUserAccessRows();
  return buildUserAccessProfile(normalizedEmail, rows);
};
