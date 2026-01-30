import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { CardPhotoUploader } from "@/components/cards/card-photo-uploader";
import { AllocationDialog } from "@/components/cards/allocation-dialog";
import { DeallocationDialog } from "@/components/cards/deallocation-dialog";
import { LoadDialog } from "@/components/cards/load-dialog";
import { getCardById } from "@/server/cards";
import { getActiveAllocationByCard } from "@/server/allocations";
import { listPeople } from "@/server/people";
import { listLoads } from "@/server/loads";
import { computeCardBalance } from "@/server/balances";
import { getEventsByCard } from "@/server/events";
import { EventTimeline } from "@/components/cards/event-timeline";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";
export const revalidate = 0;


type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CardDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) {
    notFound();
  }
  const activeAllocation = await getActiveAllocationByCard(card.card_id);
  const people = await listPeople({ limit: 1000, offset: 0 });
  const person =
    activeAllocation?.person_id &&
    people.rows.find((row) => row.person_id === activeAllocation.person_id);
  const loadsResult = await listLoads({ limit: 5, offset: 0 });
  const cardLoads = loadsResult.rows.filter((load) => load.card_id === card.card_id);
  const balance = await computeCardBalance(card.card_id);
  const events = await getEventsByCard(card.card_id);
  const cardIdValid = isUuid(card.card_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cartao ${card.numero_cartao}`}
        description="Detalhes principais do cartao."
        actions={
          <Button asChild variant="outline">
            <Link href={`/cards/${card.card_id}/edit`}>Editar</Link>
          </Button>
        }
      />

      <div className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Numero</div>
          <div className="text-sm font-medium">{card.numero_cartao}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Status</div>
          <div className="text-sm font-medium">{card.status}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Saldo atual</div>
          <div className="text-lg font-semibold text-foreground">
            R$ {balance.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Marca</div>
          <div className="text-sm font-medium">{card.marca}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground">Unidade</div>
          <div className="text-sm font-medium">{card.unidade}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs uppercase text-muted-foreground">Foto</div>
          <div className="mt-3">
            <CardPhotoUploader
              cardId={card.card_id}
              currentUrl={card.foto_cartao_url}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs uppercase text-muted-foreground">Observacoes</div>
          <div className="text-sm text-muted-foreground">
            {card.observacoes || "-"}
          </div>
        </div>
      </div>

      {!cardIdValid ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          O card_id deste cartao nao parece ser um UUID valido. Confira se a coluna
          <strong> card_id</strong> no Sheets esta formatada como texto e contem o
          valor completo com hifens.
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Associação</div>
            <div className="text-sm text-muted-foreground">
              {activeAllocation
                ? "Cartao alocado"
                : "Sem alocação ativa"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeAllocation ? (
              <DeallocationDialog cardId={card.card_id} />
            ) : (
              <AllocationDialog cardId={card.card_id} people={people.rows} />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Pessoa</div>
            <div className="text-sm font-medium">
              {person ? `${person.nome} (${person.chapa_matricula})` : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Status</div>
            <div className="text-sm font-medium">
              {activeAllocation?.status ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Data inicio</div>
            <div className="text-sm font-medium">
              {activeAllocation?.data_inicio ?? "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Cargas</div>
            <div className="text-sm text-muted-foreground">
              Ultimas cargas registradas para este cartao.
            </div>
          </div>
          <LoadDialog cardId={card.card_id} />
        </div>

        <div className="mt-6 space-y-3">
          {cardLoads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Nenhuma carga registrada.
            </div>
          ) : (
            cardLoads.map((load) => (
              <div
                key={load.load_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm"
              >
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Data</div>
                  <div className="font-medium">{load.data_carga}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Valor</div>
                  <div className="font-medium">R$ {load.valor_carga}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase text-muted-foreground">Observacoes</div>
                  <div className="text-sm text-muted-foreground">
                    {load.observacoes || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">
                    Comprovante
                  </div>
                  {load.comprovante_url ? (
                    <a
                      className="text-sm font-medium text-primary hover:underline"
                      href={load.comprovante_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Historico</div>
            <div className="text-sm text-muted-foreground">
              Eventos e alteracoes do cartao.
            </div>
          </div>
        </div>
        <div className="mt-6">
          <EventTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
