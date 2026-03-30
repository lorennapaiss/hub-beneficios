"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompletePasswordCardProps = {
  tokenHash?: string;
  type?: "invite" | "recovery";
};

const titleByType = {
  invite: "Definir senha e concluir cadastro",
  recovery: "Criar nova senha",
};

const descriptionByType = {
  invite: "Escolha a senha do seu acesso para entrar no portal.",
  recovery: "Defina uma nova senha para voltar a acessar o portal.",
};

export function CompletePasswordCard({ tokenHash, type }: CompletePasswordCardProps) {
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

    if (!tokenHash || !type) {
      setError("O link é inválido ou já expirou. Solicite um novo email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/auth/password/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenHash,
          type,
          password,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Não foi possível concluir a definição de senha.");
        return;
      }

      setSuccessMessage(
        payload.data?.message ?? "Senha salva com sucesso. Volte para o login.",
      );
      setPassword("");
      setConfirmPassword("");
    });
  };

  if (!tokenHash || !type) {
    return (
      <div className="glass-card shadow-glow w-full max-w-md rounded-[32px] p-6 sm:p-7">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          O link é inválido ou já expirou.
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <Button asChild className="rounded-2xl">
            <Link href="/auth/forgot-password">Solicitar novo email</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card shadow-glow w-full max-w-md rounded-[32px] p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Segurança
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{titleByType[type]}</h2>
        </div>
        <span className="rounded-full bg-[#4DBFB3]/15 px-3 py-1 text-xs font-semibold text-[#0C3B6F]">
          Protegido
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">{descriptionByType[type]}</p>

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
          {isPending ? "Salvando..." : "Salvar senha"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-slate-500">
        <Link href="/" className="font-medium text-[#0C3B6F] underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
