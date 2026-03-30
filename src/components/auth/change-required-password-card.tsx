"use client";

import { useState, useTransition, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangeRequiredPasswordCard() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/password/change-required", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Nao foi possivel alterar a senha.");
        return;
      }

      setSuccessMessage(
        payload.data?.message ?? "Senha alterada com sucesso. Entre novamente.",
      );
      setPassword("");
      setConfirmPassword("");
    });
  };

  return (
    <div className="glass-card shadow-glow w-full max-w-md rounded-[32px] p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Primeiro acesso
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Troca obrigatoria de senha</h2>
        </div>
        <span className="rounded-full bg-[#4DBFB3]/15 px-3 py-1 text-xs font-semibold text-[#0C3B6F]">
          Obrigatorio
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Esta conta foi criada com uma senha provisoria. Antes de continuar, defina sua senha
        pessoal.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Nova senha</span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-2xl border-white/60 bg-white/85 pl-10 pr-11"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Confirmar senha</span>
          <Input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-12 rounded-2xl border-white/60 bg-white/85"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4" />
              {successMessage}
            </div>
          </div>
        ) : null}

        <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>

      {successMessage ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-12 w-full rounded-2xl"
          onClick={() => {
            void signOut({ callbackUrl: "/" });
          }}
        >
          Sair e entrar novamente
        </Button>
      ) : null}
    </div>
  );
}
