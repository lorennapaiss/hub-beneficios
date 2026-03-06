import "server-only";
import { logger } from "@/server/payments/logger";
import type { SulamericaParsedRow } from "@/server/faturas/sulamerica-parser";

export type SulamericaContratoMetrics = {
  contrato_codigo: string;
  empresa_nome: string;
  competencia: string;
  vidas_ativas: number;
  custo_total: number;
  custo_por_contrato: number;
  status: "OK" | "DIVERGENCE";
  error_message?: string;
};

type MetricsInput = {
  contrato_codigo: string;
  empresa_nome: string;
  competencia: string;
  rows: SulamericaParsedRow[];
  total_geral_premio?: number;
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const computeSulamericaContratoMetrics = ({
  contrato_codigo,
  empresa_nome,
  competencia,
  rows,
  total_geral_premio,
}: MetricsInput): SulamericaContratoMetrics => {
  const vidasAtivas = rows.length;
  const custoTotal = roundCurrency(
    rows.reduce((sum, row) => sum + (row.premio || 0), 0),
  );

  let status: SulamericaContratoMetrics["status"] = "OK";
  let error_message: string | undefined;

  if (typeof total_geral_premio === "number") {
    const roundedTotal = roundCurrency(total_geral_premio);
    const diff = Math.abs(roundedTotal - custoTotal);
    if (diff > 0.01) {
      status = "DIVERGENCE";
      error_message = `Total geral divergente (planilha: ${roundedTotal.toFixed(
        2,
      )}, calculado: ${custoTotal.toFixed(2)}).`;
      logger.warn("[faturas] total geral divergente", {
        competencia,
        contrato_codigo,
        empresa_nome,
        total_planilha: roundedTotal,
        total_calculado: custoTotal,
      });
    }
  }

  return {
    contrato_codigo,
    empresa_nome,
    competencia,
    vidas_ativas: vidasAtivas,
    custo_total: custoTotal,
    custo_por_contrato: custoTotal,
    status,
    error_message,
  };
};
