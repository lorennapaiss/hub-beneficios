import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAllowedUser, handleApiError } from "@/server/payments/api-utils";
import { SHEETS } from "@/config/payments-constants";
import {
  PAYMENTS_COLUMNS,
  AUDIT_LOG_COLUMNS,
  rowToPayment,
} from "@/server/payments/sheets-schema";
import {
  findPaymentRowById,
  updatePaymentRow,
  appendAuditLog,
} from "@/server/payments/sheets";
import { getSheetRange, getRowRange } from "@/server/payments/sheets-utils";
import { ensureDriveFolderPath, uploadFileToDrive } from "@/server/payments/drive";
import { checkRateLimit } from "@/server/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response, actorRole } = await requireAllowedUser();
  if (response) return response;

  const limiter = checkRateLimit(request, {
    key: "payments-upload",
    limit: 10,
    windowMs: 60_000,
  });
  if (!limiter.ok) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const { id } = await params;
    const range = getSheetRange(SHEETS.PAYMENTS, PAYMENTS_COLUMNS.length);
    const result = await findPaymentRowById(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      range,
      id,
    );

    if (!result?.row || !result.rowNumber) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payment = rowToPayment(result.row as string[]);
    const rootFolderId = process.env.PAYMENTS_DRIVE_FOLDER_ID ?? "";
    const folderId = await ensureDriveFolderPath(rootFolderId, [
      payment.category ?? "sem-categoria",
      payment.competence ?? "sem-competencia",
      payment.id ?? id,
    ]);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await uploadFileToDrive(
      folderId,
      buffer,
      file.name,
      file.type || "application/octet-stream",
    );

    const now = new Date().toISOString();
    const updated = {
      ...payment,
      drive_file_id: uploadResult.fileId,
      drive_link: uploadResult.webViewLink,
      drive_filename: file.name,
      updated_at: now,
    };

    const rowRange = getRowRange(
      SHEETS.PAYMENTS,
      result.rowNumber,
      PAYMENTS_COLUMNS.length,
    );

    await updatePaymentRow(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      rowRange,
      updated,
    );

    await appendAuditLog(
      process.env.PAYMENTS_SHEETS_ID ?? "",
      getSheetRange(SHEETS.AUDIT_LOGS, AUDIT_LOG_COLUMNS.length),
      {
        id: randomUUID(),
        entity_type: "PAYMENT",
        entity_id: updated.id,
        action: "UPLOAD",
        before: JSON.stringify({ ...payment, drive_file_id: undefined }),
        after: JSON.stringify({ ...updated, drive_file_id: undefined }),
        actor_email: session?.user?.email ?? "",
        actor_role: actorRole,
        created_at: now,
      },
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
