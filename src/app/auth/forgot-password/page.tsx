import { LifeBuoy, Sparkles } from "lucide-react";
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card";

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#4DBFB3]/20 blur-3xl" />
        <div className="absolute -right-16 top-8 h-80 w-80 rounded-full bg-[#F9A825]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-14 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4DBFB3]/30 bg-[#4DBFB3]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0C3B6F]">
              <Sparkles className="size-3 text-[#F9A825]" />
              Recuperação de acesso
            </div>
            <h1 className="font-display text-4xl font-semibold text-slate-900 md:text-5xl">
              Precisa criar uma nova senha?
            </h1>
            <p className="max-w-xl text-base text-slate-600">
              Enviaremos um novo link para seu email corporativo, caso sua conta esteja ativa e
              liberada no sistema.
            </p>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F9A825]/30 via-[#FFB347]/10 to-white">
                <LifeBuoy className="size-4 text-slate-700" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Quando usar</h3>
              <p className="mt-1 text-xs text-slate-500">
                Use esta opção se você já completou o cadastro antes e esqueceu a senha atual.
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <ForgotPasswordCard />
          </div>
        </section>
      </div>
    </div>
  );
}
