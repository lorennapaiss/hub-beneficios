"use client";

import { useMemo } from "react";
import type {
  CopayFilterState,
  CopayRow,
} from "@/modules/coparticipacao/types/copay.types";

const STATUS_ORDER: Record<CopayRow["status"], number> = {
  OK: 0,
  OK_MANUAL: 1,
  AMBIGUO: 2,
  NAO_ENCONTRADO: 3,
  INELEGIVEL: 4,
  INVALIDO: 5,
};

export const useCopayFilters = (rows: CopayRow[], filters: CopayFilterState) =>
  useMemo(() => {
    const search = filters.search.trim().toUpperCase();

    return rows
      .filter((row) => {
        if (filters.status !== "TODOS" && row.status !== filters.status) return false;
        if (filters.tipo !== "TODOS" && row.titular_ou_dependente !== filters.tipo) {
          return false;
        }
        if (!search) return true;

        const target = [
          row.nome_titular_raw,
          row.nome_beneficiario_raw,
          row.chapa_resolvida ?? "",
          row.info_colaborador?.nome ?? "",
        ]
          .join(" ")
          .toUpperCase();

        return target.includes(search);
      })
      .sort((left, right) => {
        if (filters.sortBy === "nome") {
          return left.nome_titular_raw.localeCompare(right.nome_titular_raw, "pt-BR");
        }
        if (filters.sortBy === "valor") {
          return right.valor_copay - left.valor_copay;
        }
        return STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
      });
  }, [rows, filters]);
