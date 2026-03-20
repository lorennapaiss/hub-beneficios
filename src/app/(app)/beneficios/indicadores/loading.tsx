export default function IndicadoresLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-8 w-72 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-200/70" />
      </div>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6 h-44 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="xl:col-span-3 h-44 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="xl:col-span-3 h-44 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="xl:col-span-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-200/70"
            />
          ))}
        </div>
      </section>

      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-36 animate-pulse rounded-xl bg-slate-200/70"
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl bg-slate-200/70"
          />
        ))}
      </div>
    </div>
  );
}
