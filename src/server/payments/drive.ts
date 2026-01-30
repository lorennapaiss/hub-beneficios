import { google } from "googleapis";
import { Readable } from "stream";
import { getGoogleAuth } from "@/server/payments/google";
import { logger } from "@/server/payments/logger";

export const getDriveClient = () =>
  google.drive({ version: "v3", auth: getGoogleAuth() });

const findFolderByName = async (
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string,
) => {
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${name.replace(/'/g, "\\'")}'`,
    `'${parentId}' in parents`,
    "trashed=false",
  ].join(" and ");

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data.files?.[0] ?? null;
};

const createFolder = async (
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string,
) => {
  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, name",
  });

  return response.data;
};

export const ensureDriveFolderPath = async (
  rootFolderId: string,
  pathParts: string[],
) => {
  try {
    if (!rootFolderId) {
      throw new Error("rootFolderId is required");
    }

    const drive = getDriveClient();
    let currentId = rootFolderId;

    for (const part of pathParts) {
      if (!part) continue;
      const existing = await findFolderByName(drive, part, currentId);
      if (existing?.id) {
        currentId = existing.id;
        continue;
      }

      const created = await createFolder(drive, part, currentId);
      if (!created.id) {
        throw new Error(`Failed to create folder: ${part}`);
      }
      currentId = created.id;
    }

    return currentId;
  } catch (error) {
    logger.error("[drive] ensureDriveFolderPath error", { error });
    throw error;
  }
};

export const uploadFileToDrive = async (
  folderId: string,
  file: Buffer | NodeJS.ReadableStream,
  filename: string,
  mimeType: string,
) => {
  try {
    if (!folderId) throw new Error("folderId is required");
    if (!file) throw new Error("file is required");
    if (!filename) throw new Error("filename is required");

    const drive = getDriveClient();
    const body =
      file instanceof Buffer ? Readable.from(file) : file;

    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType,
        body,
      },
      fields: "id, webViewLink",
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    if (!fileId || !webViewLink) {
      throw new Error("Drive upload did not return fileId or webViewLink");
    }

    return { fileId, webViewLink };
  } catch (error) {
    logger.error("[drive] uploadFileToDrive error", { error, filename });
    throw error;
  }
};
