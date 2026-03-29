"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <section className="space-y-5">
        <div>
          <p className="page-copy-eyebrow">Dados cadastrais</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Informações do colaborador
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Padronize os dados para facilitar alocação, rastreabilidade e filtros
            operacionais.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground md:col-span-2">
            Nome completo
            <Input {...register("nome")} />
            {errors.nome ? (
              <span className="text-xs text-destructive">{errors.nome.message}</span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Chapa/Matrícula
            <Input {...register("chapa_matricula")} />
            {errors.chapa_matricula ? (
              <span className="text-xs text-destructive">
                {errors.chapa_matricula.message}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Status
            <Select {...register("status")}>
              {PersonStatusEnum.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Marca
            <Input {...register("marca")} />
            {errors.marca ? (
              <span className="text-xs text-destructive">{errors.marca.message}</span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Unidade
            <Input {...register("unidade")} />
            {errors.unidade ? (
              <span className="text-xs text-destructive">{errors.unidade.message}</span>
            ) : null}
          </label>
        </div>
      </section>

      {serverError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-6">
        <Button type="submit" disabled={isSubmitting}>
          {mode === "create" ? "Criar pessoa" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/people")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
