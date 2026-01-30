import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail, isAllowedEmail } from "@/lib/auth";
import { getDriveClient } from "@/server/drive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email) || !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  try {
    const drive = await getDriveClient();
    const response = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name, driveId)",
      pageSize: 50,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      corpora: "allDrives",
    });

    return NextResponse.json({
      ok: true,
      folders: response.data.files ?? [],
    });
  } catch (error) {
    console.error("Erro ao diagnosticar Drive.", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao diagnosticar Drive." },
      { status: 500 }
    );
  }
}
