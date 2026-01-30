import { PageHeader } from "@/components/page-header";
import { CreditCard, Shield, Users, Wallet } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral do controle de cartões provisórios."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Em estoque</div>
              <div className="text-2xl font-semibold">{statusCounts.ESTOQUE}</div>
            </div>
            <div className="rounded-full bg-sky-100 p-2 text-sky-700">
              <CreditCard className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span className="h-2 w-2 rounded-full bg-orange-300" />
            <span className="h-2 w-2 rounded-full bg-orange-200" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Alocados</div>
              <div className="text-2xl font-semibold">{statusCounts.ALOCADO}</div>
            </div>
            <div className="rounded-full bg-orange-100 p-2 text-orange-700">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-1">
            {[18, 26, 38, 28, 22, 34].map((h, idx) => (
              <div
                key={`alloc-${idx}`}
                className="h-8 rounded-full bg-gradient-to-b from-sky-400 to-orange-300"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Bloqueados</div>
              <div className="text-2xl font-semibold">{statusCounts.BLOQUEADO}</div>
            </div>
            <div className="rounded-full bg-slate-100 p-2 text-slate-700">
              <Shield className="size-5" />
            </div>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-slate-400"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((statusCounts.BLOQUEADO / Math.max(cards.length, 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Inativos</div>
              <div className="text-2xl font-semibold">{statusCounts.INATIVO}</div>
            </div>
            <div className="rounded-full bg-sky-50 p-2 text-sky-700">
              <Wallet className="size-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {cards.length ? "Base ativa monitorada." : "Sem dados."}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase text-muted-foreground">
            Total carregado no mes
          </div>
          <div className="mt-1 text-2xl font-semibold">
            R$ {totalLoadedMonth.toFixed(2)}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-sky-500 to-orange-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase text-muted-foreground">Sem foto</div>
          <div className="mt-1 text-2xl font-semibold">{cardsWithoutPhoto}</div>
          <div className="mt-3 text-xs text-muted-foreground">
            Priorize fotos para rastreabilidade.
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase text-muted-foreground">
            Saldo abaixo do limite
          </div>
          <div className="mt-1 text-2xl font-semibold">{lowBalanceCards}</div>
          <div className="text-xs text-muted-foreground">
            Limite: R$ {lowBalanceThreshold.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
