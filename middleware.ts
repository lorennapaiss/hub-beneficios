import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getDevLoginEmail, isAllowedEmail } from "@/lib/auth";
import { canAccessAppPath, normalizeAppUserRole } from "@/lib/user-access";

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const fetchRoleFromSupabase = async (email: string) => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  const response = await fetch(
    `${url}/rest/v1/indicator_user_brand_access?select=role&user_email=eq.${encodeURIComponent(email)}&is_active=eq.true`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return null;

  const rows = (await response.json()) as Array<{ role?: string | null }>;
  if (rows.length === 0) return null;

  const normalizedRoles = rows.map((row) => normalizeAppUserRole(row.role));
  if (normalizedRoles.includes("ADMIN")) return "ADMIN";
  if (normalizedRoles.includes("BENEFITS_ASSISTANT")) return "BENEFITS_ASSISTANT";
  return "BRAND";
};

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email = typeof token?.email === "string" ? token.email : undefined;
  const resolvedEmail = email || getDevLoginEmail();
  const pathname = request.nextUrl.pathname;
  const requiresPasswordChange = token?.forcePasswordChange === true;
  const role = resolvedEmail
    ? (await fetchRoleFromSupabase(normalizeEmail(resolvedEmail))) ?? null
    : null;

  if ((!token && !resolvedEmail) || (!isAllowedEmail(resolvedEmail) && !role)) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", pathname);
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  if (
    requiresPasswordChange &&
    pathname !== "/auth/change-password" &&
    !pathname.startsWith("/api/auth/password/change-required")
  ) {
    return NextResponse.redirect(new URL("/auth/change-password", request.url));
  }

  const effectiveRole = role ?? "BENEFITS_ASSISTANT";
  if (!canAccessAppPath(pathname, effectiveRole)) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", pathname);
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/cards/:path*",
    "/people/:path*",
    "/loads/:path*",
    "/beneficios/:path*",
    "/faturas/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/indicators/:path*",
    "/auth/change-password",
    "/api/auth/password/change-required",
  ],
};
