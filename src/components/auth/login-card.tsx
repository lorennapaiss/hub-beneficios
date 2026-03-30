"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, KeyRound, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginCardProps = {
  callbackUrl?: string;
  error?: string;
  showGoogleLogin?: boolean;
};

const mapErrorMessage = (error?: string) => {
  if (!error) return "";
  if (error === "CredentialsSignin") {
    return "Email ou senha inválidos, ou usuário ainda não liberado no sistema.";
  }
  if (error === "AccessDenied") {
    return "Seu usuário não tem permissão para acessar este ambiente.";
  }
  return "Não foi possível entrar. Tente novamente.";
};

export function LoginCard({
  callbackUrl = "/hub",
  error,
  showGoogleLogin = false,
}: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isPending, startTransition] = useTransition();
  const errorMessage = useMemo(
    () => localError || mapErrorMessage(error),
    [error, localError],
  );

  const handleCredentialsLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result) {
        setLocalError("Não foi possível iniciar sua sessão.");
        return;
      }

      if (result.error) {
        setLocalError(mapErrorMessage(result.error));
        return;
      }

      window.location.href = result.url ?? callbackUrl;
    });
  };

  return (
    <div className="glass-card shadow-glow relative w-full max-w-md rounded-[32px] p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Acesso
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Entrar no hub</h2>
        </div>
        <span className="rounded-full bg-[#4DBFB3]/15 px-3 py-1 text-xs font-semibold text-[#0C3B6F]">
          Seguro
        </span>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleCredentialsLogin}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email corporativo</span>
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Senha</span>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="h-12 rounded-2xl border-white/60 bg-white/85 pl-10 pr-11"
              autoComplete="current-password"
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

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-2xl shadow-glow"
          disabled={isPending}
        >
          <LogIn className="size-4" />
          {isPending ? "Entrando..." : "Entrar com email"}
        </Button>
      </form>

      {showGoogleLogin ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-12 w-full rounded-2xl bg-white/85"
          onClick={() => {
            void signIn("google", { callbackUrl });
          }}
        >
          Entrar com Google
        </Button>
      ) : null}

      <div className="mt-4 text-right text-sm">
        <Link
          href="/auth/forgot-password"
          className="font-medium text-[#0C3B6F] underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-600">
        Se você recebeu um convite por email, primeiro conclua a criação da senha pelo link do
        convite e depois volte aqui para entrar.
      </div>
    </div>
  );
}
