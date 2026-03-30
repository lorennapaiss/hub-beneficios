import Link from "next/link";
import { ArrowRight, BarChart2, CreditCard, FileText, Wallet } from "lucide-react";
import { getServerSession } from "next-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { authOptions, resolveAuthenticatedEmail } from "@/lib/auth";
import { canAccessAppPath } from "@/lib/user-access";
import { getUserAccessProfile } from "@/server/user-access";

const features = [
  {
    title: "Controle de Pagamentos",
    description: "Módulo de pagamentos: boletos, status, auditorias e alertas.",
    href: "/beneficios/pagamentos",
    icon: Wallet,
  },
  {
    title: "Indicadores de custo",
    description:
      "Dashboards de Plano de Saúde, Odontológico, Vale Transporte e Vale Refeição via Google Sheets.",
    href: "/beneficios/indicadores",
    icon: BarChart2,
  },
  {
    title: "Políticas e Regras",
    description: "Defina fornecedores, categorias e lembretes.",
    href: "/beneficios/pagamentos/config",
    icon: FileText,
  },
  {
    title: "Cartões provisórios",
    description: "Módulo de cartões: emissão, cargas e alocações.",
    href: "/cards",
    icon: CreditCard,
  },
];

export default async function BeneficiosPage() {
  const session = await getServerSession(authOptions);
  const profile = await getUserAccessProfile(resolveAuthenticatedEmail(session?.user?.email));
  const role = profile?.role ?? "BENEFITS_ASSISTANT";
  const filteredFeatures = features.filter((feature) => canAccessAppPath(feature.href, role));

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Benefícios"
        title="Benefícios e processos"
        description="Centralize as frentes do time de benefícios em um único painel. Pagamentos, indicadores e cartões provisórios são módulos distintos."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="section-panel subtle-ring group p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-muted/25 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-5 text-base font-semibold text-foreground">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Abrir módulo
                <ArrowRight className="size-3 transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="section-panel subtle-ring p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Módulos separados, experiência única
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Todos os fluxos de benefícios ficam no mesmo hub para facilitar a rotina do time.
            </p>
          </div>
          <Button asChild>
            <Link href="/beneficios/indicadores">Abrir indicadores</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
