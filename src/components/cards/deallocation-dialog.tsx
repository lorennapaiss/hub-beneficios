"use client";

import { useState } from "react";
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
  DeallocationInputSchema,
  type DeallocationInput,
} from "@/lib/schemas/allocation";

type DeallocationDialogProps = {
  cardId: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function DeallocationDialog({ cardId }: DeallocationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeallocationInput>({
    resolver: zodResolver(DeallocationInputSchema),
    defaultValues: {
      data_fim: today(),
      motivo: "",
    },
  });

  const onSubmit = async (values: DeallocationInput) => {
    setServerError(null);
    const response = await fetch(`/api/cards/${cardId}/deallocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.error ?? "Erro ao encerrar.");
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Encerrar alocação</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Encerrar alocação</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Data de fim
            <input
              type="date"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("data_fim")}
            />
            {errors.data_fim ? (
              <span className="text-xs text-destructive">{errors.data_fim.message}</span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Motivo
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
