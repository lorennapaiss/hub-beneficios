import { CreditCard, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";

const highlights = [
  {
    title: "Pagamentos",
    description: "Controle completo de boletos e vencimentos.",
    icon: Wallet,
    gradient: "from-[#F9A825]/30 via-[#FFB347]/10 to-white",
  },
  {
    title: "Cartões provisórios",
    description: "Emissão, cargas e alocações em um fluxo.",
    icon: CreditCard,
    gradient: "from-[#4DBFB3]/35 via-[#C8E9E5]/30 to-white",
  },
  {
    title: "Governança",
    description: "Alertas, indicadores e auditoria automatizados.",
    icon: ShieldCheck,
    gradient: "from-[#0C3B6F]/15 via-[#4A90E2]/10 to-white",
  },
];

type HomePageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl ?? "/hub";
  const error = params.error;

  return (
    <div className="relative min-h-screen overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#4DBFB3]/20 blur-3xl" />
        <div className="absolute -right-16 top-8 h-80 w-80 rounded-full bg-[#F9A825]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0C3B6F]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-14 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4DBFB3]/30 bg-[#4DBFB3]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#0C3B6F]">
              <Sparkles className="size-3 text-[#F9A825]" />
              Hub de benefícios Raiz Educação
            </div>
            <h1 className="font-display text-4xl font-semibold text-slate-900 md:text-5xl">
              Portal interno com acesso por perfil e marca
            </h1>
            <p className="max-w-xl text-base text-slate-600">
              Pagamentos, indicadores e operações internas em módulos separados, com acesso
              controlado para ADM, Assistente de Benefícios e usuários de Marcas.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="glass-card rounded-2xl p-4">
                  <div
                    className={`flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient}`}
                  >
                    <item.icon className="size-4 text-slate-700" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
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
                  <stop offset="0%" stopColor="#4DBFB3" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F9A825" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx="180" cy="180" r="140" fill="url(#hubGlow)" />
              <circle cx="120" cy="120" r="60" fill="#C8E9E5" fillOpacity="0.45" />
            </svg>

            <LoginCard
              callbackUrl={callbackUrl}
              error={error}
              showGoogleLogin={false}
            />

            <div className="glass-card float-slow absolute -left-8 top-10 hidden w-44 rounded-2xl p-4 text-sm text-slate-600 shadow-glow lg:block">
              <div className="font-semibold text-slate-900">Marcas</div>
              <p className="text-xs text-slate-500">Acesso só aos indicadores permitidos</p>
            </div>
            <div className="glass-card float-delayed absolute -right-6 bottom-6 hidden w-48 rounded-2xl p-4 text-sm text-slate-600 shadow-glow lg:block">
              <div className="font-semibold text-slate-900">ADM</div>
              <p className="text-xs text-slate-500">Gestão completa de usuários e módulos</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Acesso por perfis",
              description:
                "Permissões separadas para operação completa, apoio de benefícios e consulta por marca.",
              accent: "from-[#F9A825]/35 via-[#FFB347]/15 to-white",
            },
            {
              title: "Convite por email",
              description:
                "O administrador cria o usuário, envia o convite e define o escopo de marcas.",
              accent: "from-[#4DBFB3]/40 via-[#C8E9E5]/20 to-white",
            },
            {
              title: "Governança em tempo real",
              description:
                "Indicadores e trilha de acesso para manter o ambiente controlado.",
              accent: "from-[#0C3B6F]/15 via-[#4A90E2]/10 to-white",
            },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-3xl p-6">
              <div className={`h-16 rounded-2xl bg-gradient-to-br ${item.accent}`} />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
