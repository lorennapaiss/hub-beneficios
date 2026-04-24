import "server-only";

import { AppUserRole } from "@/lib/user-access";
import { createUuid } from "@/lib/uuid";

type SessionLike = { user?: { email?: string | null; name?: string | null } } | null;
import {
  buildUserAccessProfile,
  fetchUserAccessRows,
  normalizeEmail,
} from "@/server/user-access";
import { appendRow, getRowsCached } from "@/server/sheets";

export type IndicatorAccessScope = {
  email: string;
  isAdmin: boolean;
  userRole: AppUserRole;
  allowedBrands: string[];
  canAccess: boolean;
  reason: "ADMIN" | "ASSISTANT" | "BRAND_SCOPE" | "NO_BRAND_ACCESS";
};

type UserBrandAccessRow = {
  id?: string;
  user_id?: string;
  user_email?: string;
  brand_id?: string;
  brand_code?: string;
  brand_name?: string;
  role?: string;
  is_active?: string;
};

const USER_BRAND_ACCESS_SHEET = "user_brand_access";
const ACCESS_CACHE_TTL_MS = 60_000;
const GLOBAL_BRAND_SCOPE = "all";

export const normalizeBrandScopeValue = (value?: string | null) =>
  value
    ?.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase() ?? "";

const isGlobalBrandScope = (value?: string | null) => {
  const normalized = normalizeBrandScopeValue(value);
  return normalized === GLOBAL_BRAND_SCOPE || normalized === "*";
};

export const buildIndicatorAccessScope = (
  email: string,
  rows: UserBrandAccessRow[],
): IndicatorAccessScope => {
  const profile = buildUserAccessProfile(email, rows);
  const normalizedEmail = normalizeEmail(email);

  if (!profile) {
    return {
      email: normalizedEmail,
      isAdmin: false,
      userRole: "BRAND",
      allowedBrands: [],
      canAccess: false,
      reason: "NO_BRAND_ACCESS",
    };
  }

  if (profile.role === "ADMIN") {
    return {
      email: normalizedEmail,
      isAdmin: true,
      userRole: "ADMIN",
      allowedBrands: [],
      canAccess: true,
      reason: "ADMIN",
    };
  }

  if (profile.role === "BENEFITS_ASSISTANT") {
    return {
      email: normalizedEmail,
      isAdmin: false,
      userRole: "BENEFITS_ASSISTANT",
      allowedBrands: ["ALL"],
      canAccess: true,
      reason: "ASSISTANT",
    };
  }

  const allowedBrands = profile.allowedBrands.sort((a, b) => a.localeCompare(b, "pt-BR"));

  if (allowedBrands.length === 0) {
    return {
      email: normalizedEmail,
      isAdmin: false,
      userRole: "BRAND",
      allowedBrands: [],
      canAccess: false,
      reason: "NO_BRAND_ACCESS",
    };
  }

  return {
    email: normalizedEmail,
    isAdmin: false,
    userRole: "BRAND",
    allowedBrands,
    canAccess: true,
    reason: "BRAND_SCOPE",
  };
};

const listUserBrandAccess = async () => {
  try {
    const data = await fetchUserAccessRows();

    if (data.length > 0) {
      return data.map((row) => ({
        ...row,
        is_active:
          typeof row.is_active === "boolean"
            ? String(row.is_active)
            : (row.is_active ?? undefined),
      })) as UserBrandAccessRow[];
    }
  } catch {
    // Fall back to Sheets while Supabase is being adopted.
  }

  try {
    return (await getRowsCached(
      USER_BRAND_ACCESS_SHEET,
      ACCESS_CACHE_TTL_MS,
    )) as UserBrandAccessRow[];
  } catch {
    return [] as UserBrandAccessRow[];
  }
};

export const getIndicatorAccessScope = async (
  email?: string | null,
): Promise<IndicatorAccessScope | null> => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const rows = await listUserBrandAccess();
  return buildIndicatorAccessScope(normalizedEmail, rows);
};

export const isBrandAllowedForScope = (
  brand: string,
  scope: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
) => {
  if (scope.isAdmin) return true;
  if (scope.allowedBrands.some((allowedBrand) => isGlobalBrandScope(allowedBrand))) {
    return true;
  }
  const normalizedBrand = normalizeBrandScopeValue(brand);
  return scope.allowedBrands.some(
    (allowedBrand) => normalizeBrandScopeValue(allowedBrand) === normalizedBrand,
  );
};

export const filterBrandsForScope = <T extends { brand: string }>(
  rows: T[],
  scope: Pick<IndicatorAccessScope, "isAdmin" | "allowedBrands">,
) => {
  if (scope.isAdmin) return rows;
  return rows.filter((row) => isBrandAllowedForScope(row.brand, scope));
};

export const logIndicatorsAuthorizationEvent = async ({
  action,
  createdBy,
  metadata,
}: {
  action: "INDICATORS_ACCESS_GRANTED" | "INDICATORS_ACCESS_DENIED";
  createdBy: string;
  metadata: Record<string, unknown>;
}) => {
  try {
    await appendRow("audit_log", {
      audit_id: createUuid(),
      entity_type: "indicators_access",
      entity_id: createdBy,
      action,
      before_json: "",
      after_json: JSON.stringify(metadata),
      created_at: new Date().toISOString(),
      created_by: createdBy,
    });
  } catch {
    // Authorization logging must not block the request path.
  }
};

export const requireIndicatorsAccess = async () => ({
  session: null as SessionLike,
  scope: {
    email: "",
    isAdmin: true,
    userRole: "ADMIN" as AppUserRole,
    allowedBrands: [] as string[],
    canAccess: true,
    reason: "ADMIN" as const,
  },
  response: null,
});
