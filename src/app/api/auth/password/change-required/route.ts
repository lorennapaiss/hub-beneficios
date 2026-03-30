import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError, z } from "zod";
import { authOptions, resolveAuthenticatedEmail } from "@/lib/auth";
import { handleApiError } from "@/server/api-utils";
import { getSupabaseAdminClient } from "@/server/supabase";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "A nova senha precisa ter pelo menos 8 caracteres.")
      .max(72, "A nova senha e longa demais."),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = resolveAuthenticatedEmail(session?.user?.email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      throw new Error(`Nao foi possivel localizar o usuario: ${listError.message}`);
    }

    const user = usersData.users.find(
      (currentUser) => currentUser.email?.trim().toLowerCase() === email,
    );

    if (!user?.id) {
      return NextResponse.json({ ok: false, error: "Usuario nao encontrado." }, { status: 404 });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: body.password,
      user_metadata: {
        ...(user.user_metadata && typeof user.user_metadata === "object"
          ? user.user_metadata
          : {}),
        force_password_change: false,
      },
    });

    if (updateError) {
      throw new Error(`Nao foi possivel atualizar a senha: ${updateError.message}`);
    }

    return NextResponse.json({
      ok: true,
      data: { message: "Senha alterada com sucesso. Entre novamente com a nova senha." },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Dados invalidos.", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleApiError(error, "auth-password-change-required");
  }
}
