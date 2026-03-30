import Link from "next/link";
import { ArrowRight, CreditCard, FileText, Receipt, Users, Wallet } from "lucide-react";
import { getServerSession } from "next-auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authOptions, resolveAuthenticatedEmail } from "@/lib/auth";
import { canAccessAppPath } from "@/lib/user-access";
import { getUserAccessProfile } from "@/server/user-access";

const quickActions = [
  {
    title: "Novo pagamento",
    description: "Registrar boleto ou nota fiscal com rastreabilidade.",
    href: "/beneficios/pagamentos/new",
  },
  {
    title: "Nova pessoa",
    description: "Cadastrar colaborador para alocação e histórico.",
    href: "/people/new",
  },
  {
    title: "Novo cartão",
    description: "Abrir novo cadastro operacional de cartão provisório.",
    href: "/cards/new",
  },
  {
    title: "Nova carga",
    description: "Registrar carregamento e saldo com controle centralizado.",
    href: "/loads",
  },
];

const modules = [
  {
    title: "Pagamentos",
    description: "Fluxo financeiro com status, vencimentos e acompanhamento operacional.",
    href: "/beneficios/pagamentos",
    icon: Wallet,
  },
  {
    title: "Cartões provisórios",
    description: "Inventário, saldo e movimentações da base de provisórios.",
    href: "/cards",
    icon: CreditCard,
  },
  {
    title: "Pessoas",
    description: "Cadastro mestre dos colaboradores usados nas rotinas do portal.",
    href: "/people",
    icon: Users,
  },
  {
    title: "Cargas",
    description: "Execução e conferência das recargas operacionais.",
    href: "/loads",
    icon: Receipt,
  },
  {
    title: "Faturas",
    description: "Análise documental e acompanhamento das faturas do benefício.",
    href: "/faturas/analise",
    icon: FileText,
  },
];

export default async function HubPage() {
  const session = await getServerSession(authOptions);
  const profile = await getUserAccessProfile(resolveAuthenticatedEmail(session?.user?.email));
  const role = profile?.role ?? "BENEFITS_ASSISTANT";
  const filteredModules = modules.filter((module) => canAccessAppPath(module.href, role));
  const filteredQuickActions =
    role === "BRAND"
      ? [
          {
            title: "Abrir indicadores",
            description: "Acompanhar somente os indicadores liberados para suas marcas.",
            href: "/beneficios/indicadores",
          },
        ]
      : quickActions;

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Portal corporativo"
        title="Hub do time de benefícios"
        description="Ponto de entrada das operações de cartões, pagamentos e rotinas administrativas com acesso rápido às frentes mais críticas."
        actions={<Badge className="bg-background">Ambiente interno</Badge>}
      />

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="section-panel subtle-ring p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-copy-eyebrow">Atalhos operacionais</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                Tarefas recorrentes do time
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Acesse rapidamente os fluxos mais usados sem navegar por múltiplas telas.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/beneficios">Ver frentes</Link>
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {filteredQuickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-2xl border border-border/80 bg-muted/20 px-4 py-4 transition hover:border-primary/20 hover:bg-muted/35"
              >
                <div className="text-sm font-semibold text-foreground">
                  {action.title}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Acessar
                  <ArrowRight className="size-3 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="section-panel subtle-ring p-6">
          <p className="page-copy-eyebrow">Fluxo recomendado</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Sequência operacional
          </h3>
          <div className="mt-5 space-y-4">
            {[
              "Cadastre a pessoa antes de emitir ou alocar o cartão provisório.",
              "Registre cargas e valide o saldo disponível para a operação.",
              "Lance pagamentos e acompanhe prazos, status e pendências.",
            ].map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background text-sm font-semibold text-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
          <Button asChild className="mt-5 w-full">
            <Link href={role === "BRAND" ? "/beneficios/indicadores" : "/dashboard"}>
              {role === "BRAND" ? "Abrir indicadores" : "Abrir visão geral"}
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.title}
              href={module.href}
              className="section-panel subtle-ring group p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-muted/25 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                {module.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {module.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Abrir módulo
                <ArrowRight className="size-3 transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
