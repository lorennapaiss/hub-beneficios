export const APP_USER_ROLES = ["ADMIN", "BENEFITS_ASSISTANT", "BRAND"] as const;

export type AppUserRole = (typeof APP_USER_ROLES)[number];

export type AppUserAccessProfile = {
  email: string;
  role: AppUserRole;
  allowedBrands: string[];
  hasGlobalBrandAccess: boolean;
};

export const normalizeAppUserRole = (value?: string | null): AppUserRole => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "BRAND") return "BRAND";
  return "BENEFITS_ASSISTANT";
};

export const getAppUserRoleLabel = (role: AppUserRole) => {
  if (role === "ADMIN") return "ADM";
  if (role === "BRAND") return "Marcas";
  return "Assistente de Beneficios";
};

export const canAccessAppPath = (pathname: string, role: AppUserRole) => {
  if (pathname.startsWith("/api/auth")) return true;

  if (role === "ADMIN") {
    return true;
  }

  if (role === "BENEFITS_ASSISTANT") {
    return !pathname.startsWith("/admin") && !pathname.startsWith("/api/admin");
  }

  return (
    pathname === "/hub" ||
    pathname === "/beneficios" ||
    pathname.startsWith("/beneficios/indicadores") ||
    pathname.startsWith("/api/indicators")
  );
};
