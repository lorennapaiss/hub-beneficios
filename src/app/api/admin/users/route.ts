import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getActorEmail, handleApiError, requireAdminUser } from "@/server/api-utils";
import { listManagedUsers, upsertManagedUser } from "@/server/admin/users";

export async function GET() {
  const { response } = await requireAdminUser();
  if (response) return response;

  try {
    const users = await listManagedUsers();
    return NextResponse.json({ ok: true, data: users });
  } catch (error) {
    return handleApiError(error, "admin-users:list");
  }
}

export async function POST(request: Request) {
  const { session, response } = await requireAdminUser();
  if (response) return response;

  try {
    const body = await request.json();
    const result = await upsertManagedUser(body);

    return NextResponse.json({
      ok: true,
      data: result,
      actor: getActorEmail(session),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "Dados invalidos.", details: error.flatten() },
        { status: 400 },
      );
    }

    return handleApiError(error, "admin-users:upsert");
  }
}
