import { CreditCard, ShieldCheck, TriangleAlert, Wallet, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getRowsCached } from "@/server/sheets";
import { computeBalancesMap } from "@/server/balances";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CardRow = {
  card_id: string;
  status: string;
  foto_cartao_url: string;
};

type LoadRow = {
  data_carga: string;
  valor_carga: string;
  card_id: string;
};

const parseNumber = (value: string) => {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const getLowBalanceThreshold = () => {
  const parsed = Number(env.LOW_BALANCE_THRESHOLD);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default async function DashboardPage() {
  const cards = (await getRowsCached("cards")) as CardRow[];
  const loads = (await getRowsCached("loads")) as LoadRow[];
  const balances = await computeBalancesMap();

  const statusCounts = {
    ESTOQUE: 0,
    ALOCADO: 0,
    BLOQUEADO: 0,
    INATIVO: 0,
  };

  for (const card of cards) {
    const key = card.status as keyof typeof statusCounts;
    if (statusCounts[key] !== undefined) {
      statusCounts[key] += 1;
    }
  }

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalLoadedMonth = loads
    .filter((load) => load.data_carga.startsWith(monthPrefix))
    .reduce((acc, load) => acc + parseNumber(load.valor_carga), 0);

  const cardsWithoutPhoto = cards.filter((card) => !card.foto_cartao_url).length;
  const lowBalanceThreshold = getLowBalanceThreshold();
  const lowBalanceCards = cards.filter(
    (card) => (balances.get(card.card_id) ?? 0) < lowBalanceThreshold
  ).length;

  const summaryCards = [
    {
      label: "Em estoque",
      value: statusCounts.ESTOQUE,
      caption: "Cartões disponíveis para novas alocações",
      icon: CreditCard,
    },
    {
      label: "Alocados",
      value: statusCounts.ALOCADO,
      caption: "Cartões vinculados a colaboradores",
      icon: Users,
    },
    {
      label: "Bloqueados",
      value: statusCounts.BLOQUEADO,
      caption: "Itens que exigem avaliação operacional",
      icon: ShieldCheck,
    },
    {
      label: "Saldo crítico",
      value: lowBalanceCards,
      caption: `Abaixo de ${currencyFormatter.format(lowBalanceThreshold)}`,
      icon: TriangleAlert,
    },
  ];

  return (
    <div className="page-section">
      <PageHeader
        eyebrow="Operação de provisórios"
        title="Dashboard"
        description="Painel executivo com visão consolidada de disponibilidade, saldo e pendências do ciclo operacional."
        actions={
          <Badge className="bg-background text-muted-foreground">
            Atualizado em tempo real
          </Badge>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="section-panel subtle-ring grid gap-4 p-5 md:grid-cols-2">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.label}
                className="rounded-2xl border border-border/80 bg-muted/20 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <p className="page-stat-label">{item.label}</p>
                    <div className="page-stat-value">{item.value}</div>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-background text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  {item.caption}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="section-panel subtle-ring p-6">
          <p className="page-copy-eyebrow">Resumo financeiro</p>
          <div className="mt-4 space-y-6">
            <div>
              <p className="page-stat-label">Total carregado no mês</p>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                {currencyFormatter.format(totalLoadedMonth)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sem foto</span>
                <span className="font-semibold text-foreground">{cardsWithoutPhoto}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inativos</span>
                <span className="font-semibold text-foreground">
                  {statusCounts.INATIVO}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base monitorada</span>
                <span className="font-semibold text-foreground">
                  {cards.length} cartões
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-background text-primary">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Governança operacional
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Priorize cartões sem foto e saldos abaixo do limite para reduzir risco
                    operacional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
