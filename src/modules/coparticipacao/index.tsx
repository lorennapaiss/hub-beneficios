"use client";

import { startTransition, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, Download, LoaderCircle, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopayConfigStep } from "@/modules/coparticipacao/components/CopayConfigStep";
import { CopayReviewTable } from "@/modules/coparticipacao/components/CopayReviewTable";
import { CopaySummaryStep } from "@/modules/coparticipacao/components/CopaySummaryStep";
import { CopayUploadStep } from "@/modules/coparticipacao/components/CopayUploadStep";
import { useCopayFilters } from "@/modules/coparticipacao/hooks/useCopayFilters";
import {
  buildCopayTxt,
  buildInconsistenciesCsv,
  buildProcessingSummaryCsv,
  triggerDownload,
} from "@/modules/coparticipacao/services/exportService";
import {
  buildSummary,
  processCopayExecution,
} from "@/modules/coparticipacao/services/copayProcessor";
import type {
  Candidate,
  Collaborator,
  CopayConfig,
  CopayFilterState,
  CopayRow,
  ProcessingResult,
} from "@/modules/coparticipacao/types/copay.types";

const readWorkbookRows = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    throw new Error(`O arquivo ${file.name} nao possui planilhas validas.`);
  }

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    throw new Error(`O arquivo ${file.name} esta vazio.`);
  }

  return rows;
};

const getDefaultConfig = (): CopayConfig => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return {
    competencia: `${now.getFullYear()}-${month}-${day}`,
    operadora: "UNIMED",
    formato_data: "DDMMAAAA",
    similarity_threshold: 0.82,
  };
};

const defaultFilters: CopayFilterState = {
  search: "",
  status: "TODOS",
  tipo: "TODOS",
  sortBy: "status",
};

export function CoparticipacaoModule() {
  const [collaboratorFile, setCollaboratorFile] = useState<File | null>(null);
  const [copayFile, setCopayFile] = useState<File | null>(null);
  const [config, setConfig] = useState<CopayConfig>(getDefaultConfig);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CopayFilterState>(defaultFilters);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [originalRows, setOriginalRows] = useState<CopayRow[]>([]);

  const filteredRows = useCopayFilters(result?.rows ?? [], filters);

  const warnings = result?.warnings ?? [];
  const hasFiles = Boolean(collaboratorFile && copayFile);
  const canProcess = hasFiles && Boolean(config.competencia);

  const collaboratorMap = useMemo(
    () =>
      new Map<string, Collaborator>(
        (result?.collaborators ?? []).map((collaborator) => [collaborator.chapa, collaborator]),
      ),
    [result?.collaborators],
  );

  const updateRows = (updater: (rows: CopayRow[]) => CopayRow[]) => {
    setResult((current) => {
      if (!current) return current;
      const rows = updater(current.rows);
      return {
        ...current,
        rows,
        summary: buildSummary(rows),
      };
    });
  };

  const handleProcess = async () => {
    if (!collaboratorFile || !copayFile) {
      setError("Envie os dois arquivos obrigatorios antes de processar.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const [collaboratorRows, copayRows] = await Promise.all([
        readWorkbookRows(collaboratorFile),
        readWorkbookRows(copayFile),
      ]);

      startTransition(() => {
        const nextResult = processCopayExecution(collaboratorRows, copayRows, config);
        setOriginalRows(nextResult.rows);
        setResult(nextResult);
        setFilters(defaultFilters);
      });
    } catch (nextError) {
      setResult(null);
      setOriginalRows([]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Falha ao processar os arquivos informados.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleResolveManual = (rowId: string, chapa: string, candidate?: Candidate) => {
    updateRows((rows) =>
      rows.map((row) => {
        if (row.id !== rowId) return row;

        const collaborator = collaboratorMap.get(chapa);

        return {
          ...row,
          status: "OK_MANUAL",
          chapa_resolvida: chapa,
          motivo: candidate
            ? `Resolvido manualmente a partir do candidato ${candidate.nome}.`
            : "Resolvido manualmente pelo operador.",
          info_colaborador: collaborator
            ? {
                nome: collaborator.nome_raw,
                cargo: collaborator.cargo_raw,
                situacao: collaborator.situacao_raw,
              }
            : row.info_colaborador,
        };
      }),
    );
  };

  const handleResetManual = (rowId: string) => {
    updateRows((rows) =>
      rows.map((row) => originalRows.find((item) => item.id === rowId) ?? row),
    );
  };

  const handleRestart = () => {
    setCollaboratorFile(null);
    setCopayFile(null);
    setConfig(getDefaultConfig());
    setFilters(defaultFilters);
    setProcessing(false);
    setError(null);
    setResult(null);
    setOriginalRows([]);
  };

  const handleExportTxt = () => {
    if (!result) return;
    const file = buildCopayTxt(result.rows, config);
    triggerDownload(file.filename, file.content, "text/plain;charset=utf-8;");
  };

  const handleExportInconsistencies = () => {
    if (!result) return;
    const file = buildInconsistenciesCsv(result.rows, config);
    triggerDownload(file.filename, file.content, "text/csv;charset=utf-8;");
  };

  const handleExportSummary = () => {
    if (!result) return;
    const file = buildProcessingSummaryCsv(result, config);
    triggerDownload(file.filename, file.content, "text/csv;charset=utf-8;");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coparticipacao"
        description="Processe arquivos de coparticipacao, revise pendencias e exporte o TXT final da folha."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleRestart}>
              <RefreshCcw className="size-4" />
              Reiniciar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportSummary}
              disabled={!result}
            >
              <Download className="size-4" />
              Exportar resumo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportInconsistencies}
              disabled={!result}
            >
              <Download className="size-4" />
              Exportar inconsistencias
            </Button>
            <Button type="button" size="sm" onClick={handleExportTxt} disabled={!result}>
              <Download className="size-4" />
              Exportar TXT
            </Button>
          </div>
        }
      />

      <CopayUploadStep
        collaboratorFile={collaboratorFile}
        copayFile={copayFile}
        onCollaboratorFileSelect={setCollaboratorFile}
        onCopayFileSelect={setCopayFile}
        error={error}
      />

      <CopayConfigStep config={config} onChange={setConfig} />

      <Card>
        <CardHeader>
          <CardTitle>3. Processamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleProcess} disabled={!canProcess || processing}>
              {processing ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Iniciar processamento"
              )}
            </Button>
            {!hasFiles ? (
              <span className="text-sm text-muted-foreground">
                O fluxo so avanca depois do upload dos dois arquivos obrigatorios.
              </span>
            ) : null}
          </div>

          {warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle className="size-4" />
                Avisos de parsing
              </div>
              <ul className="space-y-1 text-sm text-amber-700">
                {warnings.slice(0, 8).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <>
          <CopaySummaryStep summary={result.summary} />

          <Card>
            <CardHeader>
              <CardTitle>4. Revisao operacional</CardTitle>
            </CardHeader>
            <CardContent>
              <CopayReviewTable
                rows={filteredRows}
                filters={filters}
                onFiltersChange={setFilters}
                onResolveManual={handleResolveManual}
                onResetManual={handleResetManual}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
