import { requireAllowedUser } from "@/server/api-utils";
import { getPjImportCsvTemplate } from "@/server/pj-import";

export async function GET() {
  const { response } = await requireAllowedUser();
  if (response) return response;

  return new Response(getPjImportCsvTemplate(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template_import_pjs.csv"',
    },
  });
}
