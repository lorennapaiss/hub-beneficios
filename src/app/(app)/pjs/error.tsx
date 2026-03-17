"use client";

export default function PjsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <div className="text-sm font-semibold text-destructive">
        Erro ao carregar modulo de PJs
      </div>
      <div className="text-sm text-muted-foreground">{error.message}</div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border px-3 py-2 text-sm font-medium"
      >
        Tentar novamente
      </button>
    </div>
  );
}
