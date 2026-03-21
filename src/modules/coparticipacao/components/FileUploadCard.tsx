"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FileUploadCardProps = {
  title: string;
  description: string;
  file: File | null;
  accept?: string;
  onFileSelect: (file: File | null) => void;
};

export function FileUploadCard({
  title,
  description,
  file,
  accept = ".xlsx,.xls,.csv",
  onFileSelect,
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="border-dashed bg-white/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-background/80 px-4 py-8 text-center transition hover:border-sky-300 hover:bg-sky-50/40"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Upload className="size-5" />
          </span>
          <span className="text-sm font-medium">
            {file ? "Trocar arquivo" : "Selecionar arquivo"}
          </span>
          <span className="text-xs text-muted-foreground">.xlsx, .xls ou .csv</span>
        </button>

        {file ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Arquivo carregado: <span className="font-semibold">{file.name}</span>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Nenhum arquivo selecionado.
          </div>
        )}

        {file ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onFileSelect(null)}>
            Remover
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
