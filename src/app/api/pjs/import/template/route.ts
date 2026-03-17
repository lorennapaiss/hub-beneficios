import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { getPjImportCsvTemplate } from "@/server/pj-import";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return new Response("Acesso negado.", { status: 403 });
  }

  return new Response(getPjImportCsvTemplate(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template_import_pjs.csv"',
    },
  });
}
