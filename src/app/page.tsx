"use client";

import Link from "next/link";
import { CreditCard, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Pagamentos",
    description: "Controle completo de boletos e vencimentos.",
    icon: Wallet,
    gradient: "from-orange-300/70 via-orange-100 to-white",
  },
  {
    title: "Cartões provisórios",
    description: "Emissão, cargas e alocações em um fluxo.",
    icon: CreditCard,
    gradient: "from-sky-300/70 via-sky-100 to-white",
  },
  {
    title: "Governança",
    description: "Alertas e auditoria automatizados.",
    icon: ShieldCheck,
    gradient: "from-emerald-200/70 via-emerald-50 to-white",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -right-16 top-8 h-80 w-80 rounded-full bg-orange-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-14 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <Sparkles className="size-3 text-orange-500" />
              Hub de benefícios Raiz Educação
            </div>
            <h1 className="font-display text-4xl font-semibold text-slate-900 md:text-5xl">
              Portal interno para o time que cuida dos benefícios
            </h1>
            <p className="max-w-xl text-base text-slate-600">
              Acompanhamento de pagamentos e controle cartões provisórios em módulos separados, com
              uma experiência única para, auditoria e velocidade
              operacional.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="shadow-glow"
                onClick={() => signIn("google", { callbackUrl: "/hub" })}
              >
                Entrar com Google
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/hub">Ver módulos</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="glass-card rounded-2xl p-4"
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient}`}
                  >
                    <item.icon className="size-4 text-slate-700" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <svg
              className="pointer-events-none absolute -right-10 -top-16 hidden w-72 opacity-70 lg:block"
              viewBox="0 0 360 360"
              fill="none"
            >
              <defs>
                <linearGradient id="hubGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx="180" cy="180" r="140" fill="url(#hubGlow)" />
              <circle cx="120" cy="120" r="60" fill="#A7F3D0" fillOpacity="0.35" />
            </svg>
            <div className="glass-card shadow-glow relative w-full max-w-md rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Visão geral
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Painel operacional
                  </h2>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  Atualizado
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Pagamentos em aberto</span>
                    <span>12</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 w-3/5 rounded-full bg-gradient-to-r from-sky-500 to-orange-400" />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/80 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Cartões ativos</span>
                    <span>84</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {[70, 40, 58, 30, 48].map((h, idx) => (
                      <div
                        key={`bar-${idx}`}
                        className="w-4 rounded-full bg-sky-200"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card float-slow absolute -left-8 top-10 hidden w-44 rounded-2xl p-4 text-sm text-slate-600 shadow-glow lg:block">
              <div className="font-semibold text-slate-900">Cartões</div>
              <p className="text-xs text-slate-500">Alocacoes em dia</p>
            </div>
            <div className="glass-card float-delayed absolute -right-6 bottom-6 hidden w-48 rounded-2xl p-4 text-sm text-slate-600 shadow-glow lg:block">
              <div className="font-semibold text-slate-900">Pagamentos</div>
              <p className="text-xs text-slate-500">Próximos vencimentos</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Módulo de pagamentos",
              description:
                "Registro, auditoria e comprovantes organizados em um painel único.",
              accent: "from-orange-300/60 via-orange-100 to-white",
            },
            {
              title: "Módulo de cartões",
              description:
                "Gestão de cartões provisórios com cargas e eventos auditáveis.",
              accent: "from-sky-300/60 via-sky-100 to-white",
            },
            {
              title: "Governança em tempo real",
              description:
                "Indicadores e alertas para o time agir antes do vencimento.",
              accent: "from-emerald-200/60 via-emerald-50 to-white",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-card rounded-3xl p-6"
            >
              <div className={`h-16 rounded-2xl bg-gradient-to-br ${item.accent}`} />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
