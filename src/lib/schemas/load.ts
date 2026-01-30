import { z } from "zod";

export const LoadInputSchema = z.object({
  data_carga: z
    .string()
    .min(1, "Informe a data da carga.")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Data da carga invalida.",
    }),
  valor_carga: z.number().positive("Informe um valor maior que zero."),
  observacoes: z.string().optional(),
  comprovante_base64: z.string().min(1, "Envie o comprovante."),
  comprovante_nome: z.string().min(1, "Arquivo do comprovante invalido."),
  comprovante_mime: z.string().min(1, "Arquivo do comprovante invalido."),
});

export type LoadInput = z.infer<typeof LoadInputSchema>;
