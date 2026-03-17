"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type ImportResponse = {
  total: number;
  imported: number;
  errors: number;
  results: Array<{
    row: number;
    nome?: string;
    status: "IMPORTED" | "ERROR";
    message: string;
    pj_id?: string;
  }>;
};

export function PjImportDialog() {
  const router = useRouter();
  const { pushToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!file) {
      setError("Selecione um arquivo CSV.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/pjs/import", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Erro ao importar CSV.");
      return;
    }

    setResult(payload.data);
    pushToast({
      title: "Importacao concluida",
      description: `${payload.data.imported} importados, ${payload.data.errors} com erro.`,
      variant: payload.data.errors > 0 ? "info" : "success",
    });
    router.refresh();
  };

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar PJs via CSV</DialogTitle>
          <DialogDescription>
            Use o template para manter os headers esperados. Dependentes de plano de saude devem ir
            em <code>beneficios.plano_saude.dependentes_json</code> como JSON array.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/api/pjs/import/template">Baixar template CSV</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pjs/manual/csv">Manual do CSV</Link>
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block text-sm text-foreground"
            />
          </div>

          {file ? (
            <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm">
              Arquivo selecionado: <strong>{file.name}</strong>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Linhas lidas" value={String(result.total)} />
                <Metric label="Importados" value={String(result.imported)} />
                <Metric label="Erros" value={String(result.errors)} />
              </div>

              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Linha</th>
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item) => (
                      <tr key={`${item.row}-${item.nome ?? "sem-nome"}`} className="border-b border-border">
                        <td className="px-4 py-3">{item.row}</td>
                        <td className="px-4 py-3">{item.nome || "-"}</td>
                        <td className="px-4 py-3">{item.status}</td>
                        <td className="px-4 py-3">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={reset}>
            Limpar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Importando..." : "Importar arquivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
