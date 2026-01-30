import { z } from "zod";

export const PersonStatusEnum = z.enum(["ATIVO", "INATIVO"]);

export const PersonInputSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  chapa_matricula: z.string().min(1, "Informe a chapa/matricula."),
  marca: z.string().min(1, "Informe a marca."),
  unidade: z.string().min(1, "Informe a unidade."),
  status: PersonStatusEnum.default("ATIVO"),
});

export type PersonInput = z.infer<typeof PersonInputSchema>;
export type PersonFormValues = z.infer<typeof PersonInputSchema>;
