import { NextResponse } from "next/server";
import { getClient } from "@/server/sheets";
import { getDriveClient } from "@/server/drive";
import { getSheetsClient as getPaymentsSheetsClient } from "@/server/payments/sheets";
import { getDriveClient as getPaymentsDriveClient } from "@/server/payments/drive";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const sheets = await getClient();
    await sheets.spreadsheets.get({ spreadsheetId: env.SHEETS_SPREADSHEET_ID });

    const drive = await getDriveClient();
    await drive.files.get({
      fileId: env.DRIVE_FOLDER_ID,
      fields: "id, name",
      supportsAllDrives: true,
    });

    let paymentsSheets = "skipped";
    let paymentsDrive = "skipped";

    if (env.PAYMENTS_SHEETS_ID) {
      const paymentsSheetsClient = getPaymentsSheetsClient();
      await paymentsSheetsClient.spreadsheets.get({
        spreadsheetId: env.PAYMENTS_SHEETS_ID,
      });
      paymentsSheets = "ok";
    }

    if (env.PAYMENTS_DRIVE_FOLDER_ID) {
      const paymentsDriveClient = getPaymentsDriveClient();
      await paymentsDriveClient.files.get({
        fileId: env.PAYMENTS_DRIVE_FOLDER_ID,
        fields: "id, name",
        supportsAllDrives: true,
      });
      paymentsDrive = "ok";
    }

    return NextResponse.json({
      ok: true,
      sheets: "ok",
      drive: "ok",
      paymentsSheets,
      paymentsDrive,
    });
  } catch (error) {
    console.error("Health check Sheets falhou.", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao conectar em servicos Google." },
      { status: 502 }
    );
  }
}
