import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  RASCUNHO: "border-muted text-muted-foreground",
  EM_ACOMPANHAMENTO: "border-blue-200 bg-blue-50 text-blue-700",
  AGUARDANDO_PAGAMENTO: "border-amber-200 bg-amber-50 text-amber-700",
  PAGO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ATRASADO: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("uppercase tracking-wide", statusStyles[status] ?? "")}>{status}</Badge>
  );
}
