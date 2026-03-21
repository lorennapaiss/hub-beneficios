import { describe, expect, it } from "vitest";
import {
  buildSummary,
  processCopayExecution,
} from "@/modules/coparticipacao/services/copayProcessor";
import {
  buildCopayTxt,
  buildInconsistenciesCsv,
} from "@/modules/coparticipacao/services/exportService";
import type { CopayConfig, CopayRow } from "@/modules/coparticipacao/types/copay.types";

const config: CopayConfig = {
  competencia: "2026-02-20",
  operadora: "SULAMERICA",
  formato_data: "DDMMAAAA",
  similarity_threshold: 0.82,
};

describe("copay processor", () => {
  it("processes exact matches and operator event codes", () => {
    const result = processCopayExecution(
      [
        {
          CHAPA: "1001",
          NOME: "Maria Silva",
          SITUACAO: "Ativo",
          TIPO_FUNCIONARIO: "CLT",
          CARGO: "Analista",
          SALARIO: "2500,00",
        },
      ],
      [
        {
          NOME_TITULAR: "Maria Silva",
          NOME_BENEFICIARIO: "Joao Silva",
          VALOR_COPAY: "125,90",
          SINAL: "+",
          MES_REFERENCIA: "02/2026",
        },
      ],
      config,
    );

    expect(result.rows[0]?.status).toBe("OK");
    expect(result.rows[0]?.chapa_resolvida).toBe("1001");
    expect(result.rows[0]?.codigo_evento).toBe("9497");
    expect(result.summary.aprovados).toBe(1);
  });

  it("marks homonyms as ambiguous", () => {
    const result = processCopayExecution(
      [
        {
          CHAPA: "1001",
          NOME: "Maria Silva",
          SITUACAO: "Ativo",
          TIPO_FUNCIONARIO: "CLT",
          CARGO: "Analista",
          SALARIO: "2500,00",
        },
        {
          CHAPA: "1002",
          NOME: "Maria Silva",
          SITUACAO: "Ativo",
          TIPO_FUNCIONARIO: "CLT",
          CARGO: "Coordenadora",
          SALARIO: "3500,00",
        },
      ],
      [
        {
          NOME_TITULAR: "Maria Silva",
          NOME_BENEFICIARIO: "Maria Silva",
          VALOR_COPAY: "10,00",
          SINAL: "+",
          MES_REFERENCIA: "02/2026",
        },
      ],
      config,
    );

    expect(result.rows[0]?.status).toBe("AMBIGUO");
    expect(result.rows[0]?.motivo).toContain("Homonimos");
  });

  it("classifies ineligible collaborators", () => {
    const result = processCopayExecution(
      [
        {
          CHAPA: "2001",
          NOME: "Carlos Lima",
          SITUACAO: "Ativo",
          TIPO_FUNCIONARIO: "PJ",
          CARGO: "Consultor",
          SALARIO: "5000,00",
        },
      ],
      [
        {
          NOME_TITULAR: "Carlos Lima",
          NOME_BENEFICIARIO: "Carlos Lima",
          VALOR_COPAY: "10,00",
          SINAL: "+",
          MES_REFERENCIA: "02/2026",
        },
      ],
      config,
    );

    expect(result.rows[0]?.status).toBe("INELEGIVEL");
    expect(result.rows[0]?.motivo).toContain('Vinculo "PJ"');
    expect(result.summary.inelegiveis).toBe(1);
  });

  it("explains ineligibility reasons with concrete field values", () => {
    const result = processCopayExecution(
      [
        {
          CHAPA: "3001",
          NOME: "Ana Souza",
          SITUACAO: "Afastado",
          TIPO_FUNCIONARIO: "CLT",
          CARGO: "Analista",
          SALARIO: "5,00",
        },
      ],
      [
        {
          NOME_TITULAR: "Ana Souza",
          NOME_BENEFICIARIO: "Ana Souza",
          VALOR_COPAY: "10,00",
          SINAL: "+",
          MES_REFERENCIA: "02/2026",
        },
      ],
      config,
    );

    expect(result.rows[0]?.status).toBe("INELEGIVEL");
    expect(result.rows[0]?.motivo).toContain('Situacao "Afastado"');
    expect(result.rows[0]?.motivo).toMatch(/Salario R\$\s*5,00/);
  });

  it("builds txt and inconsistencies export", () => {
    const rows: CopayRow[] = [
      {
        id: "1",
        nome_titular_raw: "Maria Silva",
        nome_titular_norm: "MARIA SILVA",
        nome_beneficiario_raw: "Joao Silva",
        nome_beneficiario_norm: "JOAO SILVA",
        valor_copay: 125.9,
        sinal: "+",
        mes_referencia_raw: "02/2026",
        status: "OK" as const,
        chapa_resolvida: "1001",
        titular_ou_dependente: "DEPENDENTE" as const,
        codigo_evento: "9497",
        match_candidates: [],
        source_row_number: 2,
      },
      {
        id: "2",
        nome_titular_raw: "Outro Nome",
        nome_titular_norm: "OUTRO NOME",
        nome_beneficiario_raw: "Outro Nome",
        nome_beneficiario_norm: "OUTRO NOME",
        valor_copay: 99.5,
        sinal: "+",
        mes_referencia_raw: "02/2026",
        status: "NAO_ENCONTRADO" as const,
        titular_ou_dependente: "TITULAR" as const,
        codigo_evento: "9496",
        motivo: "Sem match",
        match_candidates: [],
        source_row_number: 3,
      },
    ];

    const txt = buildCopayTxt(rows, config);
    const inconsistencies = buildInconsistenciesCsv(rows, config);
    const summary = buildSummary(rows);

    expect(txt.content).toContain("1001;20022026;9497;000:00;0,00;125,90;0,00;N;");
    expect(inconsistencies.content).toContain("Outro Nome");
    expect(summary.aprovados).toBe(1);
  });
});
