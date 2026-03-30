"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Não foi possível enviar o email de recuperação.");
        return;
      }

      setSuccessMessage(
        payload.data?.message ??
          "Se o email existir, você receberá instruções para redefinir sua senha.",
      );
      setEmail("");
    });
  };

  return (
    <div className="glass-card shadow-glow w-full max-w-md rounded-[32px] p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Recuperação
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Esqueci minha senha</h2>
        </div>
        <span className="rounded-full bg-[#4DBFB3]/15 px-3 py-1 text-xs font-semibold text-[#0C3B6F]">
          Email
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Informe seu email corporativo. Se ele estiver cadastrado, enviaremos um link para criar
        uma nova senha.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@empresa.com"
              className="h-12 rounded-2xl border-white/60 bg-white/85 pl-10"
              autoComplete="email"
              required
            />
          </div>
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isPending}>
          <KeyRound className="size-4" />
          {isPending ? "Enviando..." : "Enviar link de recuperação"}
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
