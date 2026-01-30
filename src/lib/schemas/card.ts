import { z } from "zod";

export const CardStatusEnum = z.enum([
  "ESTOQUE",
  "ALOCADO",
  "BLOQUEADO",
  "INATIVO",
]);

export const CardInputSchema = z.object({
  numero_cartao: z.string().min(1, "Informe o numero do cartao."),
  marca: z.string().min(1, "Informe a marca."),
  unidade: z.string().min(1, "Informe a unidade."),
  status: CardStatusEnum.default("ESTOQUE"),
  foto_cartao_url: z.string().optional(),
  observacoes: z.string().optional(),
});

export type CardInput = z.infer<typeof CardInputSchema>;
export type CardFormValues = z.infer<typeof CardInputSchema>;
