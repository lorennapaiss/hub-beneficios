"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CardPhotoUploaderProps = {
  cardId: string;
  currentUrl?: string;
};

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

export function CardPhotoUploader({ cardId, currentUrl }: CardPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const bytesBase64 = await fileToBase64(file);
      const response = await fetch(`/api/cards/${cardId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          bytesBase64,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Erro no upload.");
      }

      setPreviewUrl(payload.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro no upload.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? "Enviando..." : "Upload"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => captureInputRef.current?.click()}
        >
          Capturar
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <img src={previewUrl} alt="Foto do cartao" className="w-full object-cover" />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          Nenhuma foto anexada.
        </div>
      )}
    </div>
  );
}
