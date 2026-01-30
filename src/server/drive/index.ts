import "server-only";
import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import { env } from "@/lib/env";

type UploadInput = {
  bytesBase64: string;
  filename: string;
  mimeType: string;
};

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const sanitizeError = (error: unknown, message: string) => {
  if (error instanceof Error) {
    return new Error(`${message} ${error.message}`);
  }
  return new Error(message);
};

export const getDriveClient = async (): Promise<drive_v3.Drive> => {
  try {
    const auth = new google.auth.JWT({
      email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: env.GOOGLE_PRIVATE_KEY,
      scopes: SCOPES,
    });
    await auth.authorize();
    return google.drive({ version: "v3", auth });
  } catch (error) {
    throw sanitizeError(error, "Erro ao autenticar no Google Drive.");
  }
};

export const uploadFile = async ({
  bytesBase64,
  filename,
  mimeType,
}: UploadInput) => {
  try {
    const folderId = env.DRIVE_FOLDER_ID;
    const drive = await getDriveClient();
    const buffer = Buffer.from(bytesBase64, "base64");
    const stream = Readable.from(buffer);

    const createResponse = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = createResponse.data.id;
    if (!fileId) {
      throw new Error("Arquivo nao retornou id.");
    }

    try {
      await drive.permissions.create({
        supportsAllDrives: true,
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (error) {
      console.warn("Permissao publica nao aplicada no Drive.", error);
    }

    const file = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "id, webViewLink, webContentLink",
    });

    const url = file.data.webViewLink || file.data.webContentLink;
    if (!url) {
      throw new Error("Não foi possível gerar URL pública.");
    }

    return { url, fileId };
  } catch (error) {
    throw sanitizeError(error, "Erro ao enviar arquivo para o Drive.");
  }
};
