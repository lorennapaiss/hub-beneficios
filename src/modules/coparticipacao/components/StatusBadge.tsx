import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/modules/coparticipacao/utils/mappings";
import type { ProcessingStatus } from "@/modules/coparticipacao/types/copay.types";

const STATUS_CLASSNAME: Record<ProcessingStatus, string> = {
  OK: "bg-emerald-500/15 text-emerald-700",
  OK_MANUAL: "bg-sky-500/15 text-sky-700",
  NAO_ENCONTRADO: "bg-amber-500/15 text-amber-700",
  AMBIGUO: "bg-orange-500/15 text-orange-700",
  INELEGIVEL: "bg-rose-500/15 text-rose-700",
  INVALIDO: "bg-slate-200 text-slate-700",
};

type StatusBadgeProps = {
  status: ProcessingStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge className={STATUS_CLASSNAME[status]}>{STATUS_LABELS[status]}</Badge>;
}
