import "server-only";

import { z } from "zod";
import { getSupabaseAdminClient } from "@/server/supabase";

const passwordActionTypeSchema = z.enum(["invite", "recovery"]);

const completePasswordSetupSchema = z
  .object({
    tokenHash: z.string().min(1, "Token inválido."),
    type: passwordActionTypeSchema,
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .max(72, "A senha informada é longa demais."),
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email: z.email("Informe um email válido."),
    redirectTo: z.url("URL de redirecionamento inválida."),
  })
  .strict();

export type PasswordActionType = z.infer<typeof passwordActionTypeSchema>;

export const completePasswordSetup = async (payload: unknown) => {
  const parsed = completePasswordSetupSchema.parse(payload);
  const supabase = getSupabaseAdminClient();

  const { data: verificationData, error: verificationError } = await supabase.auth.verifyOtp({
    token_hash: parsed.tokenHash,
    type: parsed.type,
  });

  if (verificationError || !verificationData.user?.id) {
    throw new Error("O link é inválido ou já expirou. Solicite um novo email.");
  }

  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    verificationData.user.id,
    {
      password: parsed.password,
      email_confirm: true,
    },
  );

  if (updateError || !updatedUser.user?.email) {
    throw new Error("Não foi possível salvar sua nova senha.");
  }

  return {
    email: updatedUser.user.email,
    message:
      parsed.type === "invite"
        ? "Cadastro concluído. Você já pode entrar com email e senha."
        : "Senha atualizada com sucesso. Você já pode entrar novamente.",
  };
};

export const sendPasswordRecoveryEmail = async (payload: unknown) => {
  const parsed = forgotPasswordSchema.parse(payload);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
    redirectTo: parsed.redirectTo,
  });

  if (error) {
    throw new Error(`Não foi possível enviar o email de recuperação: ${error.message}`);
  }

  return {
    message: "Se o email existir e estiver liberado no sistema, enviaremos as instruções.",
  };
};
