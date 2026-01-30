"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  CardInputSchema,
  CardStatusEnum,
  type CardFormValues,
} from "@/lib/schemas/card";

type CardFormProps = {
  mode: "create" | "edit";
  cardId?: string;
  initialValues?: Partial<CardFormValues>;
};

const defaultValues: CardFormValues = {
  numero_cartao: "",
  marca: "",
  unidade: "",
  status: "ESTOQUE",
  foto_cartao_url: "",
  observacoes: "",
};

export function CardForm({ mode, cardId, initialValues }: CardFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(CardInputSchema) as Resolver<CardFormValues>,
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const onSubmit = async (values: CardFormValues) => {
    setServerError(null);
    const endpoint = mode === "create" ? "/api/cards" : `/api/cards/${cardId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.error ?? "Erro ao salvar.");
      return;
    }

    const targetId = payload.data?.card_id ?? cardId;
    if (targetId) {
      router.push(`/cards/${targetId}`);
    } else {
      router.push("/cards");
    }
    router.refresh();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-foreground">
          Numero do cartao
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("numero_cartao")}
          />
          {errors.numero_cartao ? (
            <span className="text-xs text-destructive">
              {errors.numero_cartao.message}
            </span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Marca
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("marca")}
          />
          {errors.marca ? (
            <span className="text-xs text-destructive">{errors.marca.message}</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Unidade
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("unidade")}
          />
          {errors.unidade ? (
            <span className="text-xs text-destructive">
              {errors.unidade.message}
            </span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Status
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("status")}
          >
            {CardStatusEnum.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground md:col-span-2">
          Foto do cartao (URL)
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("foto_cartao_url")}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground md:col-span-2">
          Observacoes
          <textarea
            className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("observacoes")}
          />
        </label>
      </div>

      {serverError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar cartao" : "Salvar alteracoes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/cards")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
