import "server-only";
import { logger } from "@/server/payments/logger";
import { resolveFolderIdByCompetencia, listFaturaFilesByCompetencia } from "@/server/faturas/drive";
import { downloadXlsx } from "@/server/faturas/download";
import { parseSulamericaXlsx } from "@/server/faturas/sulamerica-parser";
import { computeSulamericaContratoMetrics } from "@/server/faturas/metrics";
import { appendFaturasExecucao } from "@/server/faturas/executions";
import { parseUnimedPoaXlsx } from "@/server/faturas/unimed-poa-parser";
import { parseSinproXlsx } from "@/server/faturas/sinpro-parser";

export type FaturasContratoResultado = {
  operadora: "SULAMERICA" | "UNIMED_POA" | "SINPRO";
  contrato_codigo: string;
  empresa_nome: string;
  competencia: string;
  vidas_ativas: number;
  custo_total: number;
  custo_por_contrato: number;
  status: "OK" | "ERRO";
  error_message?: string;
  file_id?: string;
  file_name?: string;
  modified_time?: string;
  web_view_link?: string;
  beneficiarios?: {
    identificacao: string;
    nome: string;
    parentesco: string;
    premio: number;
    cpf_titular?: string;
    cpf_beneficiario?: string;
  }[];
};

export type FaturasResumoCompetencia = {
  competencia: string;
  total_vidas: number;
  total_custo: number;
  contratos_ok: number;
  contratos_erro: number;
};

export type FaturasProcessamentoResultado = {
  competencia: string;
  resumo: FaturasResumoCompetencia;
  contratos: FaturasContratoResultado[];
};

const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const buildErrorResult = ({
  operadora,
  competencia,
  contrato_codigo,
  empresa_nome,
  error_message,
  file_id,
  file_name,
  modified_time,
  web_view_link,
}: {
  operadora: "SULAMERICA" | "UNIMED_POA" | "SINPRO";
  competencia: string;
  contrato_codigo: string;
  empresa_nome: string;
  error_message: string;
  file_id?: string;
  file_name?: string;
  modified_time?: string;
  web_view_link?: string;
}): FaturasContratoResultado => ({
  operadora,
  contrato_codigo,
  empresa_nome,
  competencia,
  vidas_ativas: 0,
  custo_total: 0,
  custo_por_contrato: 0,
  status: "ERRO",
  error_message,
  file_id,
  file_name,
  modified_time,
  web_view_link,
});

export const processarCompetenciaSulamerica = async (
  competencia: string,
  actor?: { email?: string | null; name?: string | null },
): Promise<FaturasProcessamentoResultado> => {
  const start = Date.now();
  await resolveFolderIdByCompetencia(competencia);
  const files = await listFaturaFilesByCompetencia(competencia);
  const contratos: FaturasContratoResultado[] = [];

  for (const file of files) {
    const contractStart = Date.now();
    const fileInfo = {
      file_id: file.file_id,
      file_name: file.file_name,
      modified_time: file.modified_time,
      web_view_link: file.web_view_link,
    };

    const download = await downloadXlsx(file.file_id, {
      competencia,
      contrato_codigo: file.contrato_codigo,
    });

    if (!download.ok) {
      contratos.push(
        buildErrorResult({
          operadora: "SULAMERICA",
          competencia,
          contrato_codigo: file.contrato_codigo,
          empresa_nome: file.empresa_nome,
          ...fileInfo,
          error_message: download.error.message,
        }),
      );
      logger.warn("[faturas] contrato processado", {
        competencia,
        contrato_codigo: file.contrato_codigo,
        file_id: file.file_id,
        status: "ERRO",
        tempo_ms: Date.now() - contractStart,
      });
      continue;
    }

    const parsedSul = parseSulamericaXlsx(download.buffer);
    const parsedUni = !parsedSul.ok
      ? parseUnimedPoaXlsx(download.buffer)
      : null;
    const parsedSin =
      !parsedSul.ok && (!parsedUni || !parsedUni.ok)
        ? parseSinproXlsx(download.buffer)
        : null;

    if (
      !parsedSul.ok &&
      (!parsedUni || !parsedUni.ok) &&
      (!parsedSin || !parsedSin.ok)
    ) {
      const message =
        parsedSin?.ok
          ? "Falha ao interpretar o arquivo."
          : parsedSin?.error?.message ??
            parsedUni?.error?.message ??
            parsedSul.error.message;

      contratos.push(
        buildErrorResult({
          operadora: "SULAMERICA",
          competencia,
          contrato_codigo: file.contrato_codigo,
          empresa_nome: file.empresa_nome,
          ...fileInfo,
          error_message: message,
        }),
      );
      logger.warn("[faturas] contrato processado", {
        competencia,
        contrato_codigo: file.contrato_codigo,
        file_id: file.file_id,
        status: "ERRO",
        tempo_ms: Date.now() - contractStart,
      });
      continue;
    }

    const operadora = parsedSul.ok
      ? "SULAMERICA"
      : parsedUni?.ok
        ? "UNIMED_POA"
        : "SINPRO";
    const rows =
      operadora === "SULAMERICA"
        ? parsedSul.ok
          ? parsedSul.rows
          : []
        : operadora === "UNIMED_POA"
          ? parsedUni && parsedUni.ok
            ? parsedUni.rows
            : []
          : parsedSin && parsedSin.ok
            ? parsedSin.rows
            : [];

    if (operadora === "UNIMED_POA") {
      const grouped = new Map<
        string,
        { empresa_nome: string; rows: typeof rows }
      >();

      for (const row of rows) {
        const key = row.contrato_codigo || file.contrato_codigo;
        const existing = grouped.get(key);
        if (!existing) {
          grouped.set(key, {
            empresa_nome: row.empresa_nome || file.empresa_nome,
            rows: [row],
          });
        } else {
          existing.rows.push(row);
        }
      }

      for (const [contratoCodigo, group] of grouped.entries()) {
        const beneficiarios = group.rows;
        const vidasAtivas = beneficiarios.length;
        const custoTotal = beneficiarios.reduce(
          (sum, row) => sum + (row.premio || 0),
          0,
        );

        const metrics = {
          contrato_codigo: contratoCodigo,
          empresa_nome: group.empresa_nome,
          competencia,
          vidas_ativas: vidasAtivas,
          custo_total: custoTotal,
          custo_por_contrato: custoTotal,
          status: "OK" as const,
          error_message: undefined,
        };

        contratos.push({
          ...metrics,
          operadora,
          contrato_codigo: contratoCodigo,
          empresa_nome: group.empresa_nome,
          status: "OK",
          error_message: metrics.error_message,
          ...fileInfo,
          beneficiarios: beneficiarios.map((row) => ({
            identificacao: row.identificacao,
            nome: row.nome,
            parentesco: row.parentesco,
            premio: row.premio,
            cpf_titular: row.cpf_titular,
            cpf_beneficiario: row.cpf_beneficiario,
          })),
        });
      }
    } else if (operadora === "SINPRO") {
      const grouped = new Map<
        string,
        { empresa_nome: string; rows: typeof rows }
      >();

      for (const row of rows) {
        const key = row.contrato_codigo || file.contrato_codigo;
        const existing = grouped.get(key);
        if (!existing) {
          grouped.set(key, {
            empresa_nome: row.empresa_nome || file.empresa_nome,
            rows: [row],
          });
        } else {
          existing.rows.push(row);
        }
      }

      for (const [contratoCodigo, group] of grouped.entries()) {
        const uniqueBenef = new Map<string, typeof group.rows[number]>();
        for (const row of group.rows) {
          const key = row.identificacao || row.nome;
          if (!key) continue;
          if (!uniqueBenef.has(key)) {
            uniqueBenef.set(key, row);
          }
        }

        const vidasAtivas =
          uniqueBenef.size > 0 ? uniqueBenef.size : group.rows.length;
        const custoTotal = group.rows.reduce(
          (sum, row) => sum + (row.premio || 0),
          0,
        );

        const metrics = {
          contrato_codigo: contratoCodigo,
          empresa_nome: group.empresa_nome,
          competencia,
          vidas_ativas: vidasAtivas,
          custo_total: custoTotal,
          custo_por_contrato: custoTotal,
          status: "OK" as const,
          error_message: undefined,
        };

        contratos.push({
          ...metrics,
          operadora,
          contrato_codigo: contratoCodigo,
          empresa_nome: group.empresa_nome,
          status: "OK",
          error_message: metrics.error_message,
          ...fileInfo,
          beneficiarios: group.rows.map((row) => ({
            identificacao: row.identificacao,
            nome: row.nome,
            parentesco: row.parentesco,
            premio: row.premio,
          })),
        });
      }
    } else {
      const contratoCodigo = file.contrato_codigo;
      const empresaNome = file.empresa_nome;
      const metrics = computeSulamericaContratoMetrics({
        contrato_codigo: contratoCodigo,
        empresa_nome: empresaNome,
        competencia,
        rows,
        total_geral_premio: parsedSul.ok ? parsedSul.total_geral_premio : undefined,
      });

      contratos.push({
        ...metrics,
        operadora,
        contrato_codigo: contratoCodigo,
        empresa_nome: empresaNome,
        status: "OK",
        error_message: metrics.error_message,
        ...fileInfo,
        beneficiarios: rows.map((row) => ({
          identificacao: row.identificacao,
          nome: row.nome,
          parentesco: row.parentesco,
          premio: row.premio,
        })),
      });
    }

    logger.info("[faturas] contrato processado", {
      competencia,
      contrato_codigo: file.contrato_codigo,
      file_id: file.file_id,
      status: "OK",
      tempo_ms: Date.now() - contractStart,
    });
  }

  const resumo = contratos.reduce<FaturasResumoCompetencia>(
    (acc, item) => {
      if (item.status === "OK") {
        acc.total_vidas += item.vidas_ativas;
        acc.total_custo += item.custo_total;
        acc.contratos_ok += 1;
      } else {
        acc.contratos_erro += 1;
      }
      return acc;
    },
    {
      competencia,
      total_vidas: 0,
      total_custo: 0,
      contratos_ok: 0,
      contratos_erro: 0,
    },
  );

  resumo.total_custo = roundCurrency(resumo.total_custo);

  const hasErrors = contratos.some((item) => item.status === "ERRO");
  const durationMs = Date.now() - start;
  if (hasErrors) {
    logger.warn("[faturas] processamento competencia concluido com erros", {
      competencia,
      contratos_ok: resumo.contratos_ok,
      contratos_erro: resumo.contratos_erro,
      tempo_ms: durationMs,
    });
  } else {
    logger.info("[faturas] processamento competencia concluido", {
      competencia,
      contratos_ok: resumo.contratos_ok,
      contratos_erro: resumo.contratos_erro,
      tempo_ms: durationMs,
    });
  }

  try {
    await appendFaturasExecucao({
      competencia,
      processed_at: new Date().toISOString(),
      actor_email: actor?.email ?? "",
      actor_name: actor?.name ?? "",
      status: hasErrors ? "ERRO" : "OK",
      duration_ms: durationMs,
      contratos_ok: resumo.contratos_ok,
      contratos_erro: resumo.contratos_erro,
      total_vidas: resumo.total_vidas,
      total_custo: resumo.total_custo,
    });
  } catch (error) {
    logger.error("[faturas] falha ao registrar execucao", {
      competencia,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }

  return {
    competencia,
    resumo,
    contratos,
  };
};
