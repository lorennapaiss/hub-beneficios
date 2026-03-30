import { ShieldCheck, Sparkles } from "lucide-react";
import { ChangeRequiredPasswordCard } from "@/components/auth/change-required-password-card";

export default function ChangePasswordPage() {
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
              Segurança de acesso
            </div>
            <h1 className="font-display text-4xl font-semibold text-slate-900 md:text-5xl">
              Defina sua senha pessoal
            </h1>
            <p className="max-w-xl text-base text-slate-600">
              Para continuar no portal, troque a senha provisoria criada pelo administrador por
              uma senha pessoal.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Senha provisoria",
                  description: "Seu acesso inicial foi liberado com uma senha temporaria.",
                },
                {
                  title: "Troca obrigatoria",
                  description: "A navegacao completa fica liberada depois que a nova senha e salva.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-card rounded-2xl p-4">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4DBFB3]/35 via-[#C8E9E5]/30 to-white">
                    <ShieldCheck className="size-4 text-slate-700" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <ChangeRequiredPasswordCard />
          </div>
        </section>
      </div>
    </div>
  );
}
