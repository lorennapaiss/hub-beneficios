import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  RASCUNHO: "border-muted text-muted-foreground",
  EM_ACOMPANHAMENTO: "border-blue-200 bg-blue-50 text-blue-700",
  AGUARDANDO_PAGAMENTO: "border-amber-200 bg-amber-50 text-amber-700",
  PAGO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ATRASADO: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusLabels: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  AGUARDANDO_PAGAMENTO: "Aguardando",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("font-medium", statusStyles[status] ?? "")}>
      {statusLabels[status] ?? status}
    </Badge>
  );
}
