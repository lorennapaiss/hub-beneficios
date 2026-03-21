import { normalizeHeader, normalizeText } from "@/modules/coparticipacao/utils/normalize";
import { parseCurrency } from "@/modules/coparticipacao/utils/currency";
import { computeSimilarity } from "@/modules/coparticipacao/utils/similarity";
import {
  DEFAULT_ACTIVE_TOKENS,
  DEFAULT_AUTONOMOUS_TOKENS,
  getEventCode,
  MINIMUM_ELIGIBLE_SALARY,
} from "@/modules/coparticipacao/utils/mappings";
import type {
  Candidate,
  Collaborator,
  CopayConfig,
  CopayOwnerType,
  CopayRow,
  ProcessingResult,
  ProcessingSummary,
} from "@/modules/coparticipacao/types/copay.types";

type RawSheetRow = Record<string, unknown>;

const COLLABORATOR_FIELD_ALIASES = {
  chapa: ["CHAPA", "MATRICULA", "MATRICULA_FUNCIONAL"],
  nome: ["NOME", "NOME_COLABORADOR", "COLABORADOR"],
  situacao: ["SITUACAO", "SITUACAO_FUNCIONAL", "STATUS"],
  tipo: ["TIPO_FUNCIONARIO", "TIPO_DE_FUNCIONARIO", "TIPO", "VINCULO"],
  cargo: ["FUNCAO", "CARGO", "FUNCAO_CARGO"],
  salario: ["SALARIO", "SALARIO_BASE", "SALARIO_BRUTO"],
};

const COPAY_FIELD_ALIASES = {
  nomeTitular: ["NOME_TITULAR", "TITULAR", "NOME_DO_TITULAR"],
  nomeBeneficiario: ["NOME_BENEFICIARIO", "BENEFICIARIO", "NOME_DO_BENEFICIARIO"],
  valor: ["VALOR_COPAY", "VALOR", "COPARTICIPACAO", "VALOR_COPARTICIPACAO"],
  sinal: ["SINAL", "OPERACAO"],
  mesReferencia: ["MES_REFERENCIA", "MES", "COMPETENCIA", "REFERENCIA"],
};

const normalizeSheetRows = (rows: RawSheetRow[]) =>
  rows.map((row) => {
    const next: RawSheetRow = {};
    Object.entries(row).forEach(([key, value]) => {
      next[normalizeHeader(key)] = value;
    });
    return next;
  });

const findCell = (row: RawSheetRow, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const hasToken = (value: string, tokens: string[]) =>
  tokens.some((token) => value.includes(normalizeText(token)));

const buildCandidate = (
  collaborator: Collaborator,
  similarity: number,
): Candidate => ({
  chapa: collaborator.chapa,
  nome: collaborator.nome_raw,
  cargo: collaborator.cargo_raw,
  situacao: collaborator.situacao_raw,
  similarity,
  is_elegivel: collaborator.is_elegivel,
  motivos_inelegibilidade: collaborator.motivos_inelegibilidade,
});

const formatSalaryValue = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const buildIneligibilityReasons = (
  isAtivo: boolean,
  situacaoRaw: string,
  isAutonomo: boolean,
  tipoRaw: string,
  salario: number,
) => {
  const reasons: string[] = [];

  if (!isAtivo) {
    reasons.push(
      `Situacao "${situacaoRaw || "nao informada"}" fora dos status elegiveis.`,
    );
  }

  if (isAutonomo) {
    reasons.push(
      `Vinculo "${tipoRaw || "nao informado"}" classificado como autonomo/PJ/RPA.`,
    );
  }

  if (salario <= MINIMUM_ELIGIBLE_SALARY) {
    reasons.push(
      `Salario ${formatSalaryValue(salario)} menor ou igual a ${formatSalaryValue(MINIMUM_ELIGIBLE_SALARY)}.`,
    );
  }

  return reasons;
};

export const parseCollaborators = (rows: RawSheetRow[]) => {
  const warnings: string[] = [];
  const normalizedRows = normalizeSheetRows(rows);

  const collaborators = normalizedRows
    .map((row, index): Collaborator | null => {
      const chapa = String(findCell(row, COLLABORATOR_FIELD_ALIASES.chapa) ?? "").trim();
      const nome = String(findCell(row, COLLABORATOR_FIELD_ALIASES.nome) ?? "").trim();

      if (!chapa || !nome) {
        warnings.push(
          `Base de colaboradores: linha ${index + 2} ignorada por falta de chapa ou nome.`,
        );
        return null;
      }

      const situacaoRaw = String(
        findCell(row, COLLABORATOR_FIELD_ALIASES.situacao) ?? "",
      ).trim();
      const tipoRaw = String(findCell(row, COLLABORATOR_FIELD_ALIASES.tipo) ?? "").trim();
      const cargoRaw = String(findCell(row, COLLABORATOR_FIELD_ALIASES.cargo) ?? "").trim();
      const salario = parseCurrency(findCell(row, COLLABORATOR_FIELD_ALIASES.salario));

      const situacaoNorm = normalizeText(situacaoRaw);
      const tipoNorm = normalizeText(tipoRaw);
      const isAtivo = hasToken(situacaoNorm, DEFAULT_ACTIVE_TOKENS);
      const isAutonomo = hasToken(tipoNorm, DEFAULT_AUTONOMOUS_TOKENS);
      const motivos = buildIneligibilityReasons(
        isAtivo,
        situacaoRaw,
        isAutonomo,
        tipoRaw,
        salario,
      );

      return {
        chapa,
        nome_raw: nome,
        nome_norm: normalizeText(nome),
        situacao_raw: situacaoRaw,
        tipo_funcionario_raw: tipoRaw,
        cargo_raw: cargoRaw,
        salario,
        is_ativo: isAtivo,
        is_autonomo: isAutonomo,
        is_elegivel: motivos.length === 0,
        motivos_inelegibilidade: motivos,
      };
    })
    .filter((row): row is Collaborator => Boolean(row));

  return {
    collaborators,
    warnings,
  };
};

export const parseCopayRows = (
  rows: RawSheetRow[],
  config: CopayConfig,
) => {
  const warnings: string[] = [];
  const normalizedRows = normalizeSheetRows(rows);

  const parsedRows = normalizedRows.map((row, index): CopayRow => {
    const titularRaw = String(findCell(row, COPAY_FIELD_ALIASES.nomeTitular) ?? "").trim();
    const beneficiarioRaw = String(
      findCell(row, COPAY_FIELD_ALIASES.nomeBeneficiario) ?? "",
    ).trim();
    const valor = parseCurrency(findCell(row, COPAY_FIELD_ALIASES.valor));
    const sinalRaw = String(findCell(row, COPAY_FIELD_ALIASES.sinal) ?? "").trim();
    const mesReferencia = String(
      findCell(row, COPAY_FIELD_ALIASES.mesReferencia) ?? "",
    ).trim();

    const nomeTitularNorm = normalizeText(titularRaw);
    const nomeBeneficiarioNorm = normalizeText(beneficiarioRaw || titularRaw);
    const ownerType: CopayOwnerType =
      nomeTitularNorm === nomeBeneficiarioNorm ? "TITULAR" : "DEPENDENTE";

    let signedValue = Math.abs(valor);
    const sinal =
      sinalRaw === "+" || sinalRaw === "-"
        ? (sinalRaw as "+" | "-")
        : valor < 0
          ? "-"
          : valor > 0
            ? "+"
            : null;

    if (sinal === "-") {
      signedValue *= -1;
    }

    const invalid = !nomeTitularNorm || !nomeBeneficiarioNorm || signedValue === 0;
    if (invalid) {
      warnings.push(
        `Coparticipacao: linha ${index + 2} marcada como invalida por campos obrigatorios ausentes ou valor zerado.`,
      );
    }

    return {
      id: `copay-${index + 1}`,
      nome_titular_raw: titularRaw,
      nome_titular_norm: nomeTitularNorm,
      nome_beneficiario_raw: beneficiarioRaw || titularRaw,
      nome_beneficiario_norm: nomeBeneficiarioNorm,
      valor_copay: signedValue,
      sinal,
      mes_referencia_raw: mesReferencia,
      status: invalid ? "INVALIDO" : "NAO_ENCONTRADO",
      titular_ou_dependente: ownerType,
      codigo_evento: getEventCode(config.operadora, ownerType),
      motivo: invalid ? "Linha sem dados minimos para processamento." : undefined,
      match_candidates: [],
      source_row_number: index + 2,
    };
  });

  return {
    rows: parsedRows,
    warnings,
  };
};

const resolveRow = (
  row: CopayRow,
  collaborators: Collaborator[],
  config: CopayConfig,
) => {
  if (row.status === "INVALIDO") {
    return row;
  }

  const exactMatches = collaborators.filter(
    (collaborator) => collaborator.nome_norm === row.nome_titular_norm,
  );

  if (exactMatches.length === 1) {
    const exact = exactMatches[0];
    if (!exact.is_elegivel) {
      return {
        ...row,
        status: "INELEGIVEL" as const,
        motivo: exact.motivos_inelegibilidade.join(" "),
        chapa_resolvida: exact.chapa,
        match_candidates: [buildCandidate(exact, 1)],
        info_colaborador: {
          nome: exact.nome_raw,
          cargo: exact.cargo_raw,
          situacao: exact.situacao_raw,
        },
      };
    }

    return {
      ...row,
      status: "OK" as const,
      chapa_resolvida: exact.chapa,
      motivo: undefined,
      match_candidates: [buildCandidate(exact, 1)],
      info_colaborador: {
        nome: exact.nome_raw,
        cargo: exact.cargo_raw,
        situacao: exact.situacao_raw,
      },
    };
  }

  if (exactMatches.length > 1) {
    return {
      ...row,
      status: "AMBIGUO" as const,
      motivo: "Homonimos encontrados na base de colaboradores.",
      match_candidates: exactMatches.map((item) => buildCandidate(item, 1)),
    };
  }

  const scored = collaborators
    .map((collaborator) => ({
      collaborator,
      similarity: computeSimilarity(row.nome_titular_norm, collaborator.nome_norm),
    }))
    .filter((item) => item.similarity >= 0.6)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, 5);

  const aboveThreshold = scored.filter(
    (item) => item.collaborator.is_elegivel && item.similarity >= config.similarity_threshold,
  );

  if (aboveThreshold.length >= 1) {
    return {
      ...row,
      status: "AMBIGUO" as const,
      motivo: "Match aproximado acima do limiar; revisar manualmente.",
      match_candidates: scored.map((item) =>
        buildCandidate(item.collaborator, item.similarity),
      ),
    };
  }

  return {
    ...row,
    status: "NAO_ENCONTRADO" as const,
    motivo: "Nenhum colaborador elegivel encontrado para o titular.",
    match_candidates: scored.map((item) =>
      buildCandidate(item.collaborator, item.similarity),
    ),
  };
};

export const buildSummary = (rows: CopayRow[]): ProcessingSummary => {
  const summary: ProcessingSummary = {
    total: rows.length,
    ok: 0,
    ok_manual: 0,
    pendencias: 0,
    inelegiveis: 0,
    invalidos: 0,
    nao_encontrados: 0,
    ambiguos: 0,
    aprovados: 0,
    valor_total_aprovado: 0,
  };

  rows.forEach((row) => {
    if (row.status === "OK") summary.ok += 1;
    if (row.status === "OK_MANUAL") summary.ok_manual += 1;
    if (row.status === "INELEGIVEL") summary.inelegiveis += 1;
    if (row.status === "INVALIDO") summary.invalidos += 1;
    if (row.status === "NAO_ENCONTRADO") summary.nao_encontrados += 1;
    if (row.status === "AMBIGUO") summary.ambiguos += 1;
    if (row.status === "OK" || row.status === "OK_MANUAL") {
      summary.aprovados += 1;
      summary.valor_total_aprovado += row.valor_copay;
    }
  });

  summary.pendencias =
    summary.nao_encontrados + summary.ambiguos + summary.inelegiveis + summary.invalidos;

  return summary;
};

export const processCopayExecution = (
  collaboratorRows: RawSheetRow[],
  copayRows: RawSheetRow[],
  config: CopayConfig,
): ProcessingResult => {
  const collaboratorParsing = parseCollaborators(collaboratorRows);
  const copayParsing = parseCopayRows(copayRows, config);

  const resolvedRows = copayParsing.rows.map((row) =>
    resolveRow(row, collaboratorParsing.collaborators, config),
  );

  return {
    collaborators: collaboratorParsing.collaborators,
    rows: resolvedRows,
    summary: buildSummary(resolvedRows),
    warnings: [...collaboratorParsing.warnings, ...copayParsing.warnings],
  };
};
