import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";

const requestSchema = z.object({
  benefit: z.enum(["health", "dental", "transport", "meal"]),
  context: z.record(z.string(), z.unknown()),
});

const normalizeSectionsText = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/^\s*(\d+)\.\s+/gm, "$1) ")
    .replace(/^\s*(\d+)\s*-\s+/gm, "$1) ");

const cleanModelName = (value: string) => value.replace(/^models\//, "").trim();

const listGeminiModels = async (apiKey: string) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );
  if (!response.ok) return [];

  const json = (await response.json()) as {
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  };

  return (json.models ?? [])
    .filter((model) => (model.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((model) => cleanModelName(model.name ?? ""))
    .filter(Boolean);
};

const extractGeminiResult = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const first = data.candidates?.[0];
  const parts = first?.content?.parts ?? [];
  const text = parts
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
  return { text, finishReason: first?.finishReason ?? null };
};

const compactContext = (context: Record<string, unknown>) => {
  const compactEntries = Object.entries(context).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.slice(0, 8)];
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const limited = Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.slice(0, 8) : v,
        ]),
      );
      return [key, limited];
    }
    return [key, value];
  });
  return Object.fromEntries(compactEntries);
};

const sectionExists = (text: string, sectionNumber: number) =>
  new RegExp(`(^|\\n)\\s*${sectionNumber}\\)`, "m").test(normalizeSectionsText(text));

const missingSections = (text: string) => {
  const missing: number[] = [];
  for (const section of [1, 2, 3, 4]) {
    if (!sectionExists(text, section)) missing.push(section);
  }
  return missing;
};

const extractSectionBlocks = (text: string) => {
  const normalized = normalizeSectionsText(text);
  const pattern = /(^|\n)\s*([1-4])\)\s*/g;
  const matches = Array.from(normalized.matchAll(pattern));
  if (matches.length === 0) return new Map<number, string>();

  const blocks = new Map<number, string>();
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const section = Number(current[2]);
    const start = current.index ?? 0;
    const end = next?.index ?? normalized.length;
    const chunk = normalized.slice(start, end).trim();
    if (section >= 1 && section <= 4 && chunk) {
      blocks.set(section, chunk);
    }
  }
  return blocks;
};

const buildLocalInsights = (
  benefit: "health" | "dental" | "transport" | "meal",
  context: Record<string, unknown>,
) => {
  const getNumber = (key: string) => {
    const value = context[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  const getString = (key: string) => {
    const value = context[key];
    return typeof value === "string" ? value : null;
  };

  const total = getNumber("totalCost") ?? getNumber("custoAcumulado") ?? getNumber("total");
  const avgMonth = getNumber("avgMonthlyCost") ?? getNumber("mediaMensal");
  const avgPerPerson = getNumber("avgCostPerPerson") ?? getNumber("mediaPorColaborador");
  const active = getNumber("activeLives") ?? getNumber("activeCollaborators") ?? getNumber("optantes");
  const topBrand = getString("topBrand");

  const lines: string[] = [];
  lines.push("Resumo automático (modo local):");
  if (total !== null) lines.push(`- Custo total no recorte: R$ ${total.toLocaleString("pt-BR")}.`);
  if (avgMonth !== null) lines.push(`- Custo médio mensal: R$ ${avgMonth.toLocaleString("pt-BR")}.`);
  if (avgPerPerson !== null) lines.push(`- Custo médio por pessoa: R$ ${avgPerPerson.toLocaleString("pt-BR")}.`);
  if (active !== null) lines.push(`- Base ativa no recorte: ${active.toLocaleString("pt-BR")} pessoas.`);
  if (topBrand) lines.push(`- Maior concentração por marca: ${topBrand}.`);

  lines.push("- Ação sugerida: comparar os 2 últimos meses com foco na maior marca e no maior cargo.");
  lines.push(`- Contexto analisado: ${benefit.toUpperCase()}.`);
  return lines.join("\n");
};

export async function POST(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const payloadSize = JSON.stringify(parsed.context).length;
    if (payloadSize > 80_000) {
      return NextResponse.json(
        { error: "Contexto muito grande para analise de insights." },
        { status: 413 },
      );
    }

    const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
    if (!apiKey) {
      const local = buildLocalInsights(parsed.benefit, parsed.context);
      return NextResponse.json({
        data: { insight: local, provider: "local", reason: "gemini_api_key_missing" },
      });
    }

    const systemPrompt = [
      "Você é um analista sênior de benefícios corporativos.",
      "Responda em portugues brasileiro, tom executivo e objetivo.",
      "Nao use saudacoes (ex.: 'Prezados').",
      "Nao invente dados; use apenas o contexto fornecido.",
      "Formato obrigatorio da resposta:",
      "1) Resumo Executivo (2 a 3 linhas).",
      "2) Principais Insights (5 bullets).",
      "3) Riscos e Alertas (3 bullets).",
      "4) Acoes Recomendadas (3 bullets priorizadas).",
      "Se houver limitacao de dados, explicite em uma linha final.",
    ].join(" ");
    const userPrompt = [
      `Beneficio: ${parsed.benefit}`,
      "Objetivo: gerar leitura executiva acionavel para lideranca.",
      "Contexto (JSON):",
      JSON.stringify(parsed.context),
    ].join("\n");

    const preferredModel = cleanModelName(process.env.GEMINI_MODEL ?? "gemini-2.0-flash");
    const availableModels = await listGeminiModels(apiKey);
    const defaults = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    const candidateModels = Array.from(
      new Set([preferredModel, ...defaults, ...availableModels]),
    );

    let lastFailureReason = "gemini_unknown_error";
    for (const model of candidateModels) {
      const buildBody = (
        userPromptText: string,
        maxOutputTokens: number,
      ) =>
        JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPromptText }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens,
          },
        });

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: buildBody(userPrompt, 1200),
        },
      );

      if (!aiResponse.ok) {
        const errorPayload = (await aiResponse.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        lastFailureReason =
          errorPayload?.error?.message ??
          `gemini_http_${aiResponse.status}_model_${model}`;
        continue;
      }

      const json = (await aiResponse.json()) as unknown;
      const primaryResult = extractGeminiResult(json);
      let insight = primaryResult.text;
      let finishReason = primaryResult.finishReason;

      // Retry once when Gemini stops early or returns too little text.
      if (
        (!insight || insight.length < 320 || finishReason === "MAX_TOKENS") &&
        parsed.context
      ) {
        const compact = compactContext(parsed.context);
        const retryPrompt = [
          "A resposta anterior veio incompleta.",
          "Gere novamente de forma completa e finalizada.",
          `Beneficio: ${parsed.benefit}`,
          "Contexto resumido (JSON):",
          JSON.stringify(compact),
        ].join("\n");

        const retryResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: buildBody(retryPrompt, 1800),
          },
        );

        if (retryResponse.ok) {
          const retryJson = (await retryResponse.json()) as unknown;
          const retryResult = extractGeminiResult(retryJson);
          if (retryResult.text && retryResult.text.length > insight.length) {
            insight = retryResult.text;
            finishReason = retryResult.finishReason;
          }
        }
      }

      if (insight && insight.length >= 120) {
        // If final sections are missing, ask Gemini to continue only missing parts.
        const missing = missingSections(insight);
        if (missing.length > 0) {
          const missingSet = new Set<number>(missing);
          const continuationPrompt = [
            "Continue a resposta anterior sem repetir o que ja foi dito.",
            `Complete APENAS as secoes faltantes: ${missing.map((s) => `${s})`).join(", ")}`,
            `Comece exatamente pela secao ${missing[0]}) e nao inclua secoes anteriores.`,
            "Mantenha exatamente o mesmo formato e lingua.",
            "Resposta parcial anterior:",
            insight,
          ].join("\n");

          const continuationResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: buildBody(continuationPrompt, 1200),
            },
          );

          if (continuationResponse.ok) {
            const continuationJson = (await continuationResponse.json()) as unknown;
            const continuation = extractGeminiResult(continuationJson).text;
            if (continuation) {
              const baseBlocks = extractSectionBlocks(insight);
              const continuationBlocks = extractSectionBlocks(continuation);

              const merged = new Map<number, string>(baseBlocks);
              for (const [section, block] of continuationBlocks.entries()) {
                if (missingSet.has(section)) {
                  merged.set(section, block);
                }
              }

              if (merged.size > baseBlocks.size) {
                insight = [1, 2, 3, 4]
                  .map((section) => merged.get(section))
                  .filter((value): value is string => Boolean(value))
                  .join("\n\n")
                  .trim();
              }
            }
          }
        }

        return NextResponse.json({
          data: {
            insight,
            provider: "gemini",
            model,
            finishReason,
            availableModelCount: availableModels.length,
          },
        });
      }

      lastFailureReason = `gemini_empty_output_model_${model}`;
    }

    const local = buildLocalInsights(parsed.benefit, parsed.context);
    return NextResponse.json({
      data: {
        insight: local,
        provider: "local",
        reason: lastFailureReason,
        availableModelCount: availableModels.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return handleApiError(error);
  }
}
