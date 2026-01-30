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
import { LoadInputSchema, type LoadInput } from "@/lib/schemas/load";

type LoadDialogProps = {
  cardId: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, base64] = result.split(",");
        resolve(base64 ?? "");
      } else {
        reject(new Error("Falha ao ler arquivo."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });

export function LoadDialog({ cardId }: LoadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoadInput>({
    resolver: zodResolver(LoadInputSchema),
    defaultValues: {
      data_carga: today(),
      valor_carga: 0,
      observacoes: "",
      comprovante_base64: "",
      comprovante_nome: "",
      comprovante_mime: "",
    },
  });

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setServerError(null);
    try {
      const bytes = await fileToBase64(file);
      setValue("comprovante_base64", bytes, { shouldValidate: true });
      setValue("comprovante_nome", file.name, { shouldValidate: true });
      setValue("comprovante_mime", file.type || "image/jpeg", {
        shouldValidate: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao ler arquivo.";
      setServerError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: LoadInput) => {
    setServerError(null);
    const response = await fetch(`/api/cards/${cardId}/loads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.error ?? "Erro ao registrar carga.");
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Registrar carga</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar carga</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Data da carga
            <input
              type="date"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("data_carga")}
            />
            {errors.data_carga ? (
              <span className="text-xs text-destructive">
                {errors.data_carga.message}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Valor da carga
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("valor_carga", { valueAsNumber: true })}
            />
            {errors.valor_carga ? (
              <span className="text-xs text-destructive">
                {errors.valor_carga.message}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Observacoes
            <textarea
              className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              {...register("observacoes")}
            />
          </label>

          <div className="space-y-2 text-sm font-medium text-foreground">
            Comprovante
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`load-file-${cardId}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id={`load-capture-${cardId}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => {
                  const input = document.getElementById(`load-file-${cardId}`);
                  input?.click();
                }}
              >
                {isUploading ? "Carregando..." : "Upload"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => {
                  const input = document.getElementById(`load-capture-${cardId}`);
                  input?.click();
                }}
              >
                Capturar
              </Button>
            </div>
            {errors.comprovante_base64 ? (
              <span className="text-xs text-destructive">
                {errors.comprovante_base64.message}
              </span>
            ) : null}
          </div>

          {serverError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
