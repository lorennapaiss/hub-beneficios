import { notFound } from "next/navigation";
import { PrintDescriptiveButton } from "@/components/pjs/print-descriptive-button";
import { getPjHealthDescriptivePreview } from "@/server/pj-health-descriptive";

type RouteParams = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ competencia?: string }>;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default async function PjDescritivoPrintPage({
  params,
  searchParams,
}: RouteParams) {
  const { id } = await params;
  const { competencia } = await searchParams;

  if (!competencia) {
    notFound();
  }

  const preview = await getPjHealthDescriptivePreview(id, competencia);

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-background px-6 py-10 text-foreground print:max-w-none print:px-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Descritivo de desconto</h1>
          <p className="text-sm text-muted-foreground">{preview.arquivoNome}</p>
        </div>
        <PrintDescriptiveButton />
      </div>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm print:border-none print:shadow-none">
        <header className="space-y-3 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="text-lg font-semibold">{preview.empresa.razaoSocial}</div>
            <div className="text-sm text-muted-foreground">
              CNPJ {preview.empresa.cnpj} | {preview.empresa.endereco} | CEP {preview.empresa.cep}
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold uppercase tracking-[0.14em]">
              Descritivo de desconto - plano de saude
            </h2>
            <div className="text-sm text-muted-foreground">
              Competencia: {preview.competenciaLabel}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Info label="Prestador PJ" value={preview.prestador.nome} />
          <Info label="CPF" value={preview.prestador.cpf} />
          <Info label="CNPJ" value={preview.prestador.cnpj} />
        </section>

        <p className="text-sm leading-6 text-muted-foreground">{preview.textoIntrodutorio}</p>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Beneficiario</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor do plano</th>
                <th className="px-4 py-3 font-medium">Subsidio empresa</th>
                <th className="px-4 py-3 font-medium">Coparticipacao</th>
                <th className="px-4 py-3 font-medium">Valor devido</th>
              </tr>
            </thead>
            <tbody>
              {preview.linhas.map((linha) => (
                <tr key={`${linha.beneficiario}-${linha.tipo}`} className="border-b border-border">
                  <td className="px-4 py-3">{linha.beneficiario}</td>
                  <td className="px-4 py-3">
                    {linha.tipo}
                    {linha.vinculoDependente ? ` - ${linha.vinculoDependente}` : ""}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(linha.mensalidade)}</td>
                  <td className="px-4 py-3">{formatCurrency(linha.subsidioEmpresa)}</td>
                  <td className="px-4 py-3">{formatCurrency(linha.coparticipacao)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(linha.valorDevido)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/20">
              <tr>
                <td className="px-4 py-4 font-semibold" colSpan={5}>
                  Total a descontar na Nota Fiscal
                </td>
                <td className="px-4 py-4 text-base font-semibold">
                  {formatCurrency(preview.totais.totalDevido)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="space-y-2 text-sm text-muted-foreground">
          {preview.observacoes.map((item) => (
            <div key={item}>* {item}</div>
          ))}
        </section>

        {preview.inconsistencias.length > 0 ? (
          <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {preview.inconsistencias.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
