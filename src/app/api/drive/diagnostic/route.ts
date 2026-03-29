import { NextResponse } from "next/server";
import { requireAdminUser, handleApiError } from "@/server/api-utils";
import { getDriveClient } from "@/server/drive";

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) return response;

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
    return handleApiError(error, "drive:diagnostic");
  }
}
