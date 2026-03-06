import "server-only";
import { logger } from "@/server/payments/logger";
import { getDriveClient } from "@/server/payments/drive";

export type DownloadXlsxError = {
  code:
    | "INVALID_FILE_ID"
    | "PERMISSION_DENIED"
    | "FILE_NOT_FOUND"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";
  message: string;
};

export type DownloadXlsxResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; error: DownloadXlsxError };

type DownloadContext = {
  competencia?: string;
  contrato_codigo?: string;
};

const normalizeDownloadError = (error: unknown): DownloadXlsxError => {
  const status = (error as { response?: { status?: number } })?.response?.status;

  if (status === 403) {
    return {
      code: "PERMISSION_DENIED",
      message: "Sem permissão para acessar o arquivo no Drive.",
    };
  }
  if (status === 404) {
    return {
      code: "FILE_NOT_FOUND",
      message: "Arquivo não encontrado no Drive.",
    };
  }
  if (status === 429) {
    return {
      code: "RATE_LIMITED",
      message: "Limite de requisições atingido. Tente novamente.",
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Erro inesperado ao baixar o arquivo.",
  };
};

export const downloadXlsx = async (
  fileId: string,
  context?: DownloadContext,
): Promise<DownloadXlsxResult> => {
  if (!fileId) {
    return {
      ok: false,
      error: {
        code: "INVALID_FILE_ID",
        message: "file_id inválido para download.",
      },
    };
  }

  logger.info("[faturas] downloadXlsx start", {
    competencia: context?.competencia,
    contrato_codigo: context?.contrato_codigo,
    file_id: fileId,
  });

  try {
    const drive = getDriveClient();
    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "arraybuffer" },
    );

    const raw = response.data as ArrayBuffer | Buffer;
    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

    logger.info("[faturas] downloadXlsx success", {
      competencia: context?.competencia,
      contrato_codigo: context?.contrato_codigo,
      file_id: fileId,
    });

    return { ok: true, buffer };
  } catch (error) {
    const normalized = normalizeDownloadError(error);
    logger.warn("[faturas] downloadXlsx failure", {
      competencia: context?.competencia,
      contrato_codigo: context?.contrato_codigo,
      file_id: fileId,
      code: normalized.code,
      message: normalized.message,
    });

    return { ok: false, error: normalized };
  }
};
