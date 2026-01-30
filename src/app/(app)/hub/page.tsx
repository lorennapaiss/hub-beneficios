import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Novo pagamento",
    description: "Registrar boleto ou nota fiscal.",
    href: "/beneficios/pagamentos/new",
  },
  {
    title: "Nova pessoa",
    description: "Cadastrar colaborador para alocação.",
    href: "/people/new",
  },
  {
    title: "Novo cartão",
    description: "Cadastrar cartão provisório.",
    href: "/cards/new",
  },
  {
    title: "Nova carga",
    description: "Programar carga de saldo.",
    href: "/loads",
  },
];

const modules = [
  {
    title: "Pagamentos",
    description: "Controle de boletos, status e auditorias.",
    href: "/beneficios/pagamentos",
    color: "from-orange-400/80 via-orange-200/80 to-amber-50",
  },
  {
    title: "Cartões provisórios",
    description: "Gestão de cartões, cargas e eventos operacionais.",
    href: "/cards",
    color: "from-sky-400/80 via-sky-200/80 to-slate-50",
  },
  {
    title: "Pessoas",
    description: "Base de colaboradores e dados cadastrais.",
    href: "/people",
    color: "from-blue-400/80 via-blue-200/80 to-slate-50",
  },
  {
    title: "Cargas",
    description: "Controle de cargas programadas.",
    href: "/loads",
    color: "from-emerald-300/80 via-emerald-100/70 to-white",
  },
  {
    title: "Dashboard",
    description: "Visão geral das operações do portal.",
    href: "/dashboard",
    color: "from-slate-400/70 via-slate-200/60 to-white",
  },
];

export default function HubPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
          Hub interno
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Portal do time de benefícios
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Acesse rapidamente as rotinas de pagamentos e cartões provisórios,
          que são módulos diferentes. Selecione um módulo ou use os atalhos.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Acesso rápido
              </h2>
              <p className="text-sm text-muted-foreground">
                Execute tarefas comuns com um clique.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/beneficios">Ver todas as frentes</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-2xl border border-white/60 bg-white/70 px-4 py-3 transition hover:border-orange-300/70 hover:shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {action.title}
                </div>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                  Abrir <ArrowRight className="size-3 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Guia rápido do time
          </h3>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>1. Cadastre a pessoa antes de emitir o cartão provisório.</li>
            <li>2. Registre cargas e valide saldo disponível.</li>
            <li>3. Lance pagamentos e acompanhe vencimentos.</li>
          </ol>
          <Button asChild className="mt-4 w-full">
            <Link href="/dashboard">Abrir visão geral</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="group glass-card rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className={`h-16 rounded-2xl bg-gradient-to-br ${module.color}`} />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {module.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {module.description}
            </p>
            <span className="mt-4 inline-flex text-xs font-semibold text-orange-500">
              Abrir módulo
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
