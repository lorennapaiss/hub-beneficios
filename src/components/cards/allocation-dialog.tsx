"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AllocationInputSchema,
  type AllocationInput,
} from "@/lib/schemas/allocation";

type PersonOption = {
  person_id: string;
  nome: string;
  chapa_matricula: string;
};

type AllocationDialogProps = {
  cardId: string;
  people: PersonOption[];
};

const today = () => new Date().toISOString().slice(0, 10);

export function AllocationDialog({ cardId, people }: AllocationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AllocationInput>({
    resolver: zodResolver(AllocationInputSchema),
    defaultValues: {
      person_id: "",
      data_inicio: today(),
      motivo: "",
    },
  });

  const peopleOptions = useMemo(
    () =>
      people.map((person) => ({
        id: person.person_id,
        label: `${person.nome} (${person.chapa_matricula})`,
      })),
    [people]
  );

  const onSubmit = async (values: AllocationInput) => {
    setServerError(null);
    const response = await fetch(`/api/cards/${cardId}/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.error ?? "Erro ao alocar.");
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Alocar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alocar cartao</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Pessoa
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              list="people-options"
              placeholder="Digite o nome ou chapa"
              onChange={(event) => {
                const value = event.target.value;
                const match = peopleOptions.find((option) => option.label === value);
                if (match) {
                  setValue("person_id", match.id, { shouldValidate: true });
                } else {
                  setValue("person_id", "");
                }
              }}
            />
            <datalist id="people-options">
              {peopleOptions.map((person) => (
                <option key={person.id} value={person.label} />
              ))}
            </datalist>
            {errors.person_id ? (
              <span className="text-xs text-destructive">{errors.person_id.message}</span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Data de inicio
            <input
              type="date"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("data_inicio")}
            />
            {errors.data_inicio ? (
              <span className="text-xs text-destructive">
                {errors.data_inicio.message}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Motivo/observação
            <textarea
              className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("motivo")}
            />
          </label>

          {serverError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
