"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { formatCurrency } from "@/lib/schema";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

type FaturasContratoResultado = {
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
  }[];
};

type FaturasResumoCompetencia = {
  competencia: string;
  total_vidas: number;
  total_custo: number;
  contratos_ok: number;
  contratos_erro: number;
};

type FaturasExecucao = {
  competencia: string;
  processed_at: string;
  actor_email: string;
  actor_name: string;
  status: string;
  duration_ms: number;
  contratos_ok: number;
  contratos_erro: number;
  total_vidas: number;
  total_custo: number;
};

type FaturasProcessamentoResultado = {
  competencia: string;
  resumo: FaturasResumoCompetencia;
  contratos: FaturasContratoResultado[];
};

const getCurrentCompetence = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

const statusBadge = (status: "OK" | "ERRO") => {
  if (status === "OK") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700">
        OK
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-500/15 text-rose-700">
      ERRO
    </Badge>
  );
};

const groupByParentesco = (rows: FaturasContratoResultado["beneficiarios"]) => {
  const summary = new Map<string, { count: number; total: number }>();
  (rows ?? []).forEach((row) => {
    const key = row.parentesco || "Sem parentesco";
    const existing = summary.get(key) ?? { count: 0, total: 0 };
    summary.set(key, {
      count: existing.count + 1,
      total: existing.total + (row.premio || 0),
    });
  });
  return Array.from(summary.entries()).map(([key, value]) => ({
    parentesco: key,
    count: value.count,
    total: value.total,
  }));
};

const buildCsv = (
  competencia: string,
  rows: FaturasContratoResultado[],
) => {
  const header = [
    "competencia",
    "operadora",
    "contrato_codigo",
    "empresa_nome",
    "vidas_ativas",
    "custo_total",
    "custo_por_contrato",
    "status",
  ];

  const lines = rows.map((item) => [
    competencia,
    item.operadora ?? "SULAMERICA",
    item.contrato_codigo,
    item.empresa_nome,
    String(item.vidas_ativas),
    String(item.custo_total),
    String(item.custo_por_contrato),
    item.status,
  ]);

  const escapeValue = (value: string) =>
    value.includes(",") || value.includes("\"") || value.includes("\n")
      ? `"${value.replace(/"/g, "\"\"")}"`
      : value;

  return [header, ...lines]
    .map((row) => row.map((value) => escapeValue(String(value))).join(","))
    .join("\n");
};

const downloadFile = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadXlsx = (filename: string, rows: Record<string, string | number>[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiarios");
  XLSX.writeFile(workbook, filename, { compression: true });
};

type AnaliseClientProps = {
  isAdmin: boolean;
};

export function AnaliseFaturasClient({ isAdmin }: AnaliseClientProps) {
  const { request } = useApi();
  const [competencia, setCompetencia] = useState(getCurrentCompetence());
  const [result, setResult] = useState<FaturasProcessamentoResultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<FaturasExecucao[]>([]);
  const [loadingExec, setLoadingExec] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [parentescoFilter, setParentescoFilter] = useState("Todos");
  const [minPremio, setMinPremio] = useState("");
  const [maxPremio, setMaxPremio] = useState("");

  const resumo = result?.resumo;
  const contratos = result?.contratos ?? [];

  const handleProcess = async () => {
    setLoading(true);
    setStage("Processando competência...");
    setError(null);
    try {
      const response = await request<{ data: FaturasProcessamentoResultado }>(
        `/api/faturas/competencias/${encodeURIComponent(competencia)}/processar`,
        { method: "POST" },
      );
      setResult(response.data);
      if (response.data.contratos.length === 0) {
        setStage("Nenhum arquivo encontrado para a competência.");
      } else {
        setStage(null);
      }
      const execResponse = await request<{ data: FaturasExecucao[] }>(
        `/api/faturas/competencias/${encodeURIComponent(competencia)}/execucoes`,
      );
      setExecutions(execResponse.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Falha ao processar competência.";
      setError(message);
      setStage(null);
    } finally {
      setLoading(false);
    }
  };

  const emptyState = useMemo(
    () => !loading && !error && result && contratos.length === 0,
    [loading, error, result, contratos.length],
  );

  const beneficiariosFlat = useMemo(() => {
    return contratos.flatMap((contrato) =>
      (contrato.beneficiarios ?? []).map((row) => ({
        ...row,
        contrato_codigo: contrato.contrato_codigo,
        empresa_nome: contrato.empresa_nome,
        competencia: contrato.competencia,
      })),
    );
  }, [contratos]);

  const parentescosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    beneficiariosFlat.forEach((row) => {
      if (row.parentesco) set.add(row.parentesco);
    });
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [beneficiariosFlat]);

  const filteredBeneficiarios = useMemo(() => {
    const search = beneficiarySearch.trim().toLowerCase();
    const min = minPremio ? Number(minPremio) : null;
    const max = maxPremio ? Number(maxPremio) : null;
    return beneficiariosFlat.filter((row) => {
      if (parentescoFilter !== "Todos" && row.parentesco !== parentescoFilter) {
        return false;
      }
      if (search) {
        const target = `${row.identificacao} ${row.nome} ${row.contrato_codigo} ${row.empresa_nome}`
          .toLowerCase();
        if (!target.includes(search)) return false;
      }
      if (min !== null && row.premio < min) return false;
      if (max !== null && row.premio > max) return false;
      return true;
    });
  }, [beneficiariosFlat, beneficiarySearch, parentescoFilter, minPremio, maxPremio]);

  useEffect(() => {
    let mounted = true;
    const loadExecutions = async () => {
      setLoadingExec(true);
      try {
        const response = await request<{ data: FaturasExecucao[] }>(
          `/api/faturas/competencias/${encodeURIComponent(competencia)}/execucoes`,
        );
        if (mounted) {
          setExecutions(response.data ?? []);
        }
      } catch {
        if (mounted) {
          setExecutions([]);
        }
      } finally {
        if (mounted) setLoadingExec(false);
      }
    };

    loadExecutions();
    return () => {
      mounted = false;
    };
  }, [competencia, request]);

  const handleExportCsv = () => {
    if (!result || contratos.length === 0) return;
    const csv = buildCsv(result.competencia, contratos);
    downloadFile(
      `analise-faturas-${result.competencia}.csv`,
      csv,
      "text/csv;charset=utf-8;",
    );
  };

  const handleExportBeneficiariosCsv = () => {
    if (!result || filteredBeneficiarios.length === 0) return;
    const header = [
      "competencia",
      "contrato_codigo",
      "empresa_nome",
      "identificacao",
      "nome",
      "parentesco",
      "premio",
    ];
    const lines = filteredBeneficiarios.map((row) => [
      result.competencia,
      row.contrato_codigo,
      row.empresa_nome,
      row.identificacao,
      row.nome,
      row.parentesco,
      String(row.premio),
    ]);
    const escapeValue = (value: string) =>
      value.includes(",") || value.includes("\"") || value.includes("\n")
        ? `"${value.replace(/"/g, "\"\"")}"`
        : value;
    const csv = [header, ...lines]
      .map((row) => row.map((value) => escapeValue(String(value))).join(","))
      .join("\n");
    downloadFile(
      `beneficiarios-${result.competencia}.csv`,
      csv,
      "text/csv;charset=utf-8;",
    );
  };

  const handleExportBeneficiariosXlsx = () => {
    if (!result || filteredBeneficiarios.length === 0) return;
    const rows = filteredBeneficiarios.map((row) => ({
      competencia: result.competencia,
      contrato_codigo: row.contrato_codigo,
      empresa_nome: row.empresa_nome,
      identificacao: row.identificacao,
      nome: row.nome,
      parentesco: row.parentesco,
      premio: row.premio,
    }));
    downloadXlsx(`beneficiarios-${result.competencia}.xlsx`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Análise de Faturas"
        description="Processamento e leitura de faturas por competência."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">VIEW</Badge>
            {isAdmin ? <Badge>ADMIN</Badge> : null}
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              disabled={!result || contratos.length === 0}
            >
              Exportar CSV
            </Button>
            {isAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/faturas/analise/config">Configurações</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Processamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="competence">Competência (mês)</Label>
              <Input
                id="competence"
                name="competence"
                type="month"
                value={competencia}
                onChange={(event) => setCompetencia(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleProcess} disabled={loading}>
                {loading ? "Processando..." : "Processar"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              <span className="inline-flex size-5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
              {stage ?? "Processando..."}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {emptyState ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum arquivo XLSX encontrado para a competência selecionada.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Vidas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCount(resumo?.total_vidas ?? 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Custo total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(resumo?.total_custo ?? 0)}
            </div>
            <p className="text-sm text-muted-foreground">Somatório das faturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold">
                {formatCount(resumo?.contratos_ok ?? 0)}
              </div>
              <p className="text-sm text-muted-foreground">OK</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold">
                {formatCount(resumo?.contratos_erro ?? 0)}
              </div>
              <p className="text-sm text-muted-foreground">Erro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos processados</CardTitle>
        </CardHeader>
        <CardContent>
          {contratos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Os contratos processados aparecerão aqui.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Vidas ativas</TableHead>
                  <TableHead>Custo total</TableHead>
                  <TableHead>Custo por contrato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Arquivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((item, index) => (
                  <TableRow
                    key={`${item.contrato_codigo}-${item.file_id ?? "no-file"}-${index}`}
                  >
                    <TableCell className="font-medium">
                      {item.contrato_codigo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.empresa_nome || "-"}</div>
                      {item.error_message ? (
                        <p className="mt-1 text-xs text-rose-600">
                          {item.error_message}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatCount(item.vidas_ativas)}</TableCell>
                    <TableCell>{formatCurrency(item.custo_total)}</TableCell>
                    <TableCell>
                      {formatCurrency(item.custo_por_contrato)}
                    </TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.web_view_link ? (
                        <a
                          href={item.web_view_link}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "text-sm font-semibold text-sky-600 hover:text-sky-700",
                          )}
                        >
                          Abrir
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beneficiários (detalhado)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border bg-white/60 p-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Buscar</Label>
              <Input
                value={beneficiarySearch}
                onChange={(event) => setBeneficiarySearch(event.target.value)}
                placeholder="Nome, identificação, contrato..."
              />
            </div>
            <div>
              <Label>Parentesco</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={parentescoFilter}
                onChange={(event) => setParentescoFilter(event.target.value)}
              >
                {parentescosDisponiveis.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Prêmio (mín / máx)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={minPremio}
                  onChange={(event) => setMinPremio(event.target.value)}
                  placeholder="Mín"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={maxPremio}
                  onChange={(event) => setMaxPremio(event.target.value)}
                  placeholder="Máx"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {filteredBeneficiarios.length} beneficiário(s) encontrados
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportBeneficiariosCsv}
                disabled={!result || filteredBeneficiarios.length === 0}
              >
                Exportar beneficiários CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportBeneficiariosXlsx}
                disabled={!result || filteredBeneficiarios.length === 0}
              >
                Exportar beneficiários XLSX
              </Button>
            </div>
          </div>
          {contratos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Os beneficiários aparecerão aqui após o processamento.
            </div>
          ) : (
            contratos.map((item, index) => {
              const beneficiarios = item.beneficiarios ?? [];
              const parentescos = groupByParentesco(beneficiarios);

              return (
                <details
                  key={`beneficiarios-${item.contrato_codigo}-${item.file_id ?? "no-file"}-${index}`}
                  className="rounded-2xl border border-border bg-white/70 p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          Contrato {item.contrato_codigo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.empresa_nome || "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Vidas: {formatCount(item.vidas_ativas)}
                        </span>
                        <span className="text-muted-foreground">
                          Total: {formatCurrency(item.custo_total)}
                        </span>
                        {statusBadge(item.status)}
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 space-y-4">
                    {parentescos.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-3">
                        {parentescos.map((parentesco) => (
                          <div
                            key={`${item.contrato_codigo}-${parentesco.parentesco}`}
                            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
                          >
                            <div className="font-semibold">
                              {parentesco.parentesco}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {parentesco.count} vidas
                            </div>
                            <div className="text-sm">
                              {formatCurrency(parentesco.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {beneficiarios.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                        Nenhum beneficiário válido encontrado.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Identificação</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Parentesco</TableHead>
                            <TableHead>Prêmio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {beneficiarios.map((row, index) => (
                            <TableRow
                              key={`${item.contrato_codigo}-${row.identificacao}-${index}`}
                            >
                              <TableCell className="font-medium">
                                {row.identificacao || "-"}
                              </TableCell>
                              <TableCell>{row.nome}</TableCell>
                              <TableCell>{row.parentesco || "-"}</TableCell>
                              <TableCell>
                                {formatCurrency(row.premio)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </details>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Execuções</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExec ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              Carregando execuções...
            </div>
          ) : executions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              Nenhuma execução registrada para esta competência.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((exec) => (
                  <TableRow
                    key={`${exec.processed_at}-${exec.actor_email || "anon"}`}
                  >
                    <TableCell>
                      {new Date(exec.processed_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {exec.actor_name || exec.actor_email || "Usuário"}
                      </div>
                      {exec.actor_email ? (
                        <div className="text-xs text-muted-foreground">
                          {exec.actor_email}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {statusBadge(exec.status === "OK" ? "OK" : "ERRO")}
                    </TableCell>
                    <TableCell>
                      {exec.contratos_ok} OK / {exec.contratos_erro} ERRO
                    </TableCell>
                    <TableCell>{Math.round(exec.duration_ms / 1000)}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
