"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  PersonInputSchema,
  PersonStatusEnum,
  type PersonFormValues,
} from "@/lib/schemas/person";

type PersonFormProps = {
  mode: "create" | "edit";
  personId?: string;
  initialValues?: Partial<PersonFormValues>;
};

const defaultValues: PersonFormValues = {
  nome: "",
  chapa_matricula: "",
  marca: "",
  unidade: "",
  status: "ATIVO",
};

export function PersonForm({ mode, personId, initialValues }: PersonFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(PersonInputSchema) as Resolver<PersonFormValues>,
    defaultValues: { ...defaultValues, ...initialValues },
  });

  const onSubmit = async (values: PersonFormValues) => {
    setServerError(null);
    const endpoint = mode === "create" ? "/api/people" : `/api/people/${personId}`;
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

    const targetId = payload.data?.person_id ?? personId;
    if (targetId) {
      router.push(`/people?highlight=${targetId}`);
    } else {
      router.push("/people");
    }
    router.refresh();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-foreground md:col-span-2">
          Nome
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("nome")}
          />
          {errors.nome ? (
            <span className="text-xs text-destructive">{errors.nome.message}</span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Chapa/Matrícula
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("chapa_matricula")}
          />
          {errors.chapa_matricula ? (
            <span className="text-xs text-destructive">
              {errors.chapa_matricula.message}
            </span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-foreground">
          Status
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            {...register("status")}
          >
            {PersonStatusEnum.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
            <span className="text-xs text-destructive">{errors.unidade.message}</span>
          ) : null}
        </label>
      </div>

      {serverError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar pessoa" : "Salvar alteracoes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/people")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
