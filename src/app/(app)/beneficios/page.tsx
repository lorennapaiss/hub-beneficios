import Link from "next/link";

const features = [
  {
    title: "Controle de Pagamentos",
    description: "Módulo de pagamentos: boletos, status, auditorias e alertas.",
    href: "/beneficios/pagamentos",
    gradient: "from-orange-400/80 via-orange-200/80 to-amber-50",
  },
  {
    title: "Políticas e Regras",
    description: "Defina fornecedores, categorias e lembretes.",
    href: "/beneficios/pagamentos/config",
    gradient: "from-sky-400/80 via-sky-200/70 to-slate-50",
  },
  {
    title: "Cartões provisórios",
    description: "Módulo de cartões: emissão, cargas e alocações.",
    href: "/cards",
    gradient: "from-blue-400/70 via-blue-200/70 to-slate-50",
  },
];

export default function BeneficiosPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
          Hub interno
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Benefícios e processos
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Centralize as frentes do time de benefícios em um único painel. O
          módulo de pagamentos e o módulo de cartões provisórios são distintos,
          cada um com sua rotina e dados.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group glass-card rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className={`h-20 rounded-2xl bg-gradient-to-br ${feature.gradient}`} />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.description}
            </p>
            <span className="mt-4 inline-flex text-xs font-semibold text-orange-500">
              Abrir módulo
            </span>
          </Link>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Módulos separados, experiência única
            </h3>
            <p className="text-sm text-muted-foreground">
              Pagamentos e cartões provisórios são módulos diferentes, mas ficam
              reunidos aqui para facilitar o dia a dia do time.
            </p>
          </div>
          <Link
            href="/beneficios/pagamentos"
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Entrar no controle
          </Link>
        </div>
      </div>
    </div>
  );
}
