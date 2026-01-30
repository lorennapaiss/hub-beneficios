import { z } from "zod";

export const AllocationInputSchema = z.object({
  person_id: z.string().min(1, "Selecione uma pessoa."),
  data_inicio: z.string().min(1, "Informe a data de inicio."),
  motivo: z.string().optional(),
});

export const DeallocationInputSchema = z.object({
  data_fim: z.string().min(1, "Informe a data de fim."),
  motivo: z.string().optional(),
});

export type AllocationInput = z.infer<typeof AllocationInputSchema>;
export type DeallocationInput = z.infer<typeof DeallocationInputSchema>;
