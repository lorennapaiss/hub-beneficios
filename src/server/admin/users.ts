import "server-only";

import { z } from "zod";
import { APP_USER_ROLES, AppUserRole, normalizeAppUserRole } from "@/lib/user-access";
import { getSupabaseAdminClient } from "@/server/supabase";

const ADMIN_USERS_PER_PAGE = 200;

const accessRoleSchema = z.enum(APP_USER_ROLES);

const managedUserSchema = z.object({
  email: z.email("Informe um email valido."),
  fullName: z.string().trim().min(2, "Informe o nome do usuario."),
  accessRole: accessRoleSchema,
  brands: z.string().trim().min(1, "Informe ao menos uma marca ou ALL."),
  temporaryPassword: z
    .string()
    .max(72, "A senha provisoria e longa demais."),
});

type ManagedUserInput = z.infer<typeof managedUserSchema>;

type IndicatorUserBrandAccessRow = {
  id: string;
  user_email: string;
  brand_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
};

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  accessRole: AppUserRole;
  brands: string[];
  status: "active" | "access-only";
  mustChangePassword: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const parseBrands = (rawValue: string) => {
  const values = rawValue
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (values.some((item) => item.toUpperCase() === "ALL" || item === "*")) {
    return ["ALL"];
  }

  return [...new Set(values)];
};

const getUserName = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object") return "";
  const rawName =
    ("full_name" in metadata && typeof metadata.full_name === "string"
      ? metadata.full_name
      : undefined) ??
    ("name" in metadata && typeof metadata.name === "string" ? metadata.name : undefined);

  return rawName?.trim() ?? "";
};

const getMetadataAccessRole = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object") return "BENEFITS_ASSISTANT" as const;
  const rawRole =
    ("app_role" in metadata && typeof metadata.app_role === "string"
      ? metadata.app_role
      : undefined) ??
    ("access_role" in metadata && typeof metadata.access_role === "string"
      ? metadata.access_role
      : undefined);
  return normalizeAppUserRole(rawRole);
};

const getMetadataMustChangePassword = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object") return false;
  return (
    "force_password_change" in metadata &&
    metadata.force_password_change === true
  );
};

const compareUsers = (left: ManagedUser, right: ManagedUser) => {
  const leftDate = left.createdAt ?? "";
  const rightDate = right.createdAt ?? "";
  return rightDate.localeCompare(leftDate) || left.email.localeCompare(right.email);
};

const fetchAllAuthUsers = async () => {
  const supabase = getSupabaseAdminClient();
  const users: Array<{
    id: string;
    email?: string;
    created_at?: string | null;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    user_metadata?: unknown;
  }> = [];

  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: ADMIN_USERS_PER_PAGE,
    });

    if (error) {
      throw new Error(`Nao foi possivel listar usuarios do Supabase: ${error.message}`);
    }

    users.push(...data.users);

    if (!data.nextPage || data.users.length < ADMIN_USERS_PER_PAGE) {
      break;
    }

    page = data.nextPage;
  }

  return users;
};

const fetchAllAccessRows = async () => {
  const supabase = getSupabaseAdminClient();
  const pageSize = 1_000;
  const rows: IndicatorUserBrandAccessRow[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("indicator_user_brand_access")
      .select("id, user_email, brand_name, role, is_active, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Nao foi possivel ler permissoes de marcas: ${error.message}`);
    }

    rows.push(...((data ?? []) as IndicatorUserBrandAccessRow[]));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
};

export const listManagedUsers = async () => {
  const [authUsers, accessRows] = await Promise.all([fetchAllAuthUsers(), fetchAllAccessRows()]);
  const accessByEmail = new Map<
    string,
    { brands: string[]; accessRole: AppUserRole; createdAt: string | null }
  >();

  for (const row of accessRows) {
    if (!row.is_active) continue;
    const email = normalizeEmail(row.user_email);
    if (!email) continue;

    const current = accessByEmail.get(email) ?? {
      brands: [],
      accessRole: "BRAND" as const,
      createdAt: row.created_at,
    };

    if (row.brand_name && !current.brands.includes(row.brand_name)) {
      current.brands.push(row.brand_name);
    }

    const nextRole = normalizeAppUserRole(row.role);
    current.accessRole =
      current.accessRole === "ADMIN" || nextRole === "ADMIN"
        ? "ADMIN"
        : current.accessRole === "BENEFITS_ASSISTANT" || nextRole === "BENEFITS_ASSISTANT"
          ? "BENEFITS_ASSISTANT"
          : "BRAND";
    current.createdAt = current.createdAt ?? row.created_at;

    accessByEmail.set(email, current);
  }

  const users: ManagedUser[] = authUsers
    .filter((user) => Boolean(user.email))
    .map((user) => {
      const email = normalizeEmail(user.email ?? "");
      const access = accessByEmail.get(email);
      accessByEmail.delete(email);

      return {
        id: user.id,
        email,
        fullName: getUserName(user.user_metadata),
        accessRole: access?.accessRole ?? getMetadataAccessRole(user.user_metadata),
        brands: access?.brands.length ? access.brands : ["ALL"],
        status: "active",
        mustChangePassword: getMetadataMustChangePassword(user.user_metadata),
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
      };
    });

  for (const [email, access] of accessByEmail.entries()) {
    users.push({
      id: `access:${email}`,
      email,
      fullName: "",
      accessRole: access.accessRole,
      brands: access.brands.length ? access.brands : ["ALL"],
      status: "access-only",
      mustChangePassword: false,
      createdAt: access.createdAt,
      lastSignInAt: null,
      emailConfirmedAt: null,
    });
  }

  return users.sort(compareUsers);
};

export const upsertManagedUser = async (payload: ManagedUserInput) => {
  const parsed = managedUserSchema.parse(payload);
  const email = normalizeEmail(parsed.email);
  const brands =
    parsed.accessRole === "BRAND"
      ? parseBrands(parsed.brands)
      : parseBrands(parsed.brands || "ALL");
  const supabase = getSupabaseAdminClient();

  if (parsed.accessRole === "BRAND" && brands.some((brand) => brand.toUpperCase() === "ALL")) {
    throw new Error("Usuario de Marcas precisa ter uma ou mais marcas especificas.");
  }

  const existingUsers = await fetchAllAuthUsers();
  const existingUser = existingUsers.find((user) => normalizeEmail(user.email ?? "") === email);
  const normalizedTemporaryPassword = parsed.temporaryPassword.trim();
  const shouldResetPassword = normalizedTemporaryPassword.length > 0;

  if (!existingUser && normalizedTemporaryPassword.length < 8) {
    throw new Error("Informe uma senha provisoria com pelo menos 8 caracteres.");
  }

  if (existingUser && shouldResetPassword && normalizedTemporaryPassword.length < 8) {
    throw new Error("A nova senha provisoria precisa ter pelo menos 8 caracteres.");
  }

  const existingMetadata =
    existingUser?.user_metadata && typeof existingUser.user_metadata === "object"
      ? existingUser.user_metadata
      : {};
  const userMetadata = {
    full_name: parsed.fullName.trim(),
    app_role: parsed.accessRole,
    access_role: parsed.accessRole,
    brands,
    force_password_change:
      shouldResetPassword ||
      ("force_password_change" in existingMetadata &&
        existingMetadata.force_password_change === true),
  };

  let userId = existingUser?.id ?? "";
  let message = "Usuario criado com senha provisoria.";

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      ...(shouldResetPassword
        ? {
            password: normalizedTemporaryPassword,
            email_confirm: true,
          }
        : {}),
      user_metadata: {
        ...existingMetadata,
        ...userMetadata,
      },
    });

    if (error) {
      throw new Error(`Nao foi possivel atualizar o usuario existente: ${error.message}`);
    }

    userId = data.user.id;
    message = shouldResetPassword
      ? "Usuario atualizado. A nova senha provisoria vai exigir troca no proximo login."
      : "Usuario atualizado com sucesso.";
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: normalizedTemporaryPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      throw new Error(`Nao foi possivel criar o usuario: ${error?.message ?? "erro desconhecido"}`);
    }

    userId = data.user.id;
  }

  const { error: deleteError } = await supabase
    .from("indicator_user_brand_access")
    .delete()
    .eq("user_email", email);

  if (deleteError) {
    throw new Error(`Nao foi possivel limpar acessos antigos: ${deleteError.message}`);
  }

  const rows = brands.map((brandName) => ({
    user_id: userId || null,
    user_email: email,
    brand_id: null,
    brand_code: null,
    brand_name: brandName,
    role: parsed.accessRole,
    is_active: true,
  }));

  const { error: insertError } = await supabase
    .from("indicator_user_brand_access")
    .insert(rows);

  if (insertError) {
    throw new Error(`Nao foi possivel salvar as permissoes do usuario: ${insertError.message}`);
  }

  return {
    email,
    fullName: parsed.fullName.trim(),
    accessRole: parsed.accessRole,
    brands,
    message,
  };
};
