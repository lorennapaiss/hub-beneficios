import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const isAllowedEmail = (email?: string | null) => {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) return false;

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean);

  const allowedDomainRaw = normalize(process.env.ALLOWED_DOMAIN);
  const allowedDomain = allowedDomainRaw.startsWith("@")
    ? allowedDomainRaw.slice(1)
    : allowedDomainRaw;

  if (allowedEmails.length > 0 && allowedEmails.includes(normalizedEmail)) {
    return true;
  }

  if (allowedDomain) {
    return normalizedEmail.endsWith(`@${allowedDomain}`);
  }

  return false;
};

export const isAdminEmail = (email?: string | null) => {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) return false;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean);

  if (adminEmails.length === 0) return false;
  return adminEmails.includes(normalizedEmail);
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      return isAllowedEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string | null | undefined;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
};
