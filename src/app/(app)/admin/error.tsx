"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm">
      <div className="text-sm font-semibold text-foreground">Erro ao carregar.</div>
      <div className="mt-2 text-muted-foreground">{error.message}</div>
      <Button className="mt-4" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
