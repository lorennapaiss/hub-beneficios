import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminEmail, isAllowedEmail } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email = typeof token?.email === "string" ? token.email : undefined;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (!token || !isAllowedEmail(email)) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && !isAdminEmail(email)) {
    const url = new URL("/", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
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
    "/admin/:path*",
  ],
};
