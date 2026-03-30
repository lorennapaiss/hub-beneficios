import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const getDevLoginEmail = () => normalize(env.DEV_LOGIN_EMAIL);

export const resolveAuthenticatedEmail = (email?: string | null) =>
  normalize(email) || getDevLoginEmail();

export const isAllowedEmail = (email?: string | null) => {
  const normalizedEmail = resolveAuthenticatedEmail(email);
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
  const normalizedEmail = resolveAuthenticatedEmail(email);
  if (!normalizedEmail) return false;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean);

  if (adminEmails.length === 0) return false;
  return adminEmails.includes(normalizedEmail);
};

const hasSupabaseAuthConfig = () =>
  Boolean(env.SUPABASE_URL?.trim() && env.SUPABASE_SERVICE_ROLE_KEY?.trim());

const getSupabaseServerAuthClient = () => {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const hasManagedAccessInSupabase = async (email?: string | null) => {
  const normalizedEmail = normalize(email);
  if (!normalizedEmail) return false;

  const supabase = getSupabaseServerAuthClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from("indicator_user_brand_access")
      .select("id")
      .eq("user_email", normalizedEmail)
      .eq("is_active", true)
      .limit(1);

    if (error) return false;
    return Boolean(data?.length);
  } catch {
    return false;
  }
};

const canAccessApplication = async (email?: string | null) => {
  if (isAllowedEmail(email)) return true;
  return hasManagedAccessInSupabase(email);
};

const authenticateWithSupabasePassword = async (email: string, password: string) => {
  const supabase = getSupabaseServerAuthClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: normalize(data.user.email),
    name:
      (typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : undefined) ??
      (typeof data.user.user_metadata?.name === "string"
        ? data.user.user_metadata.name
        : undefined) ??
      data.user.email ??
      "Usuário",
    forcePasswordChange: data.user.user_metadata?.force_password_change === true,
  };
};

type AuthenticatedUserWithFlags = {
  forcePasswordChange?: boolean;
  email?: string | null;
  name?: string | null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = normalize(credentials?.email);
        const password = credentials?.password?.trim() ?? "";

        if (!email || !password) {
          return null;
        }

        const user = await authenticateWithSupabasePassword(email, password);
        if (!user) {
          return null;
        }

        if (!(await canAccessApplication(user.email))) {
          return null;
        }

        return user;
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user }) {
      return canAccessApplication(user.email);
    },
    async jwt({ token, user }) {
      const authUser = user as AuthenticatedUserWithFlags | undefined;
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      if ("forcePasswordChange" in (authUser ?? {})) {
        token.forcePasswordChange = Boolean(authUser?.forcePasswordChange);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string | null | undefined;
        session.user.name = token.name as string | null | undefined;
      }
      session.forcePasswordChange = Boolean(token.forcePasswordChange);
      return session;
    },
  },
};
