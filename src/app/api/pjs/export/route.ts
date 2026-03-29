import { requireAllowedUser } from "@/server/api-utils";
import { listPjs } from "@/server/pjs";

export async function GET(request: Request) {
  const { response } = await requireAllowedUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const result = await listPjs({
    search: searchParams.get("search") ?? undefined,
    status_vinculo: searchParams.get("status_vinculo") ?? undefined,
    marca: searchParams.get("marca") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    gestor_responsavel: searchParams.get("gestor_responsavel") ?? undefined,
    centro_custo: searchParams.get("centro_custo") ?? undefined,
    status_documental: searchParams.get("status_documental") ?? undefined,
    benefit_status: searchParams.get("benefit_status") ?? undefined,
    limit: 5000,
    offset: 0,
  });

  const headers = [
    "pj_id",
    "nome_completo",
    "cpf",
    "cnpj",
    "status_vinculo",
    "marca",
    "area",
    "gestor_responsavel",
    "centro_custo",
    "status_documental",
    "status_beneficio",
    "custo_total_mensal",
    "pendencias",
  ];

  const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const lines = [
    headers.join(","),
    ...result.rows.map((row) =>
      [
        row.pj_id,
        row.nome_completo,
        row.cpf,
        row.cnpj,
        row.status_vinculo,
        row.marca,
        row.area,
        row.gestor_responsavel,
        row.centro_custo,
        row.status_documental,
        row.status_beneficio,
        row.custo_total_mensal,
        row.pendencias.join(" | "),
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pjs-export.csv"',
    },
  });
}
