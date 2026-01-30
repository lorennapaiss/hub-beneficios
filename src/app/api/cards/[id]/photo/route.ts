import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAllowedEmail } from "@/lib/auth";
import { attachCardPhoto } from "@/server/cards";
import { uploadFile } from "@/server/drive";
import { checkRateLimit } from "@/server/rate-limit";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const resolveId = async (request: Request, params: RouteParams["params"]) => {
  try {
    const awaited = await params;
    if (awaited?.id) return awaited.id;
  } catch {
    // ignore
  }
  const pathname = new URL(request.url).pathname;
  return pathname.split("/").pop() ?? "";
};

type UploadPayload = {
  filename: string;
  mimeType: string;
  bytesBase64: string;
};

const getActorEmail = (email?: string | null) => email ?? "unknown";

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!isAllowedEmail(session?.user?.email)) {
    return NextResponse.json({ ok: false, error: "Acesso negado." }, { status: 403 });
  }

  const rate = checkRateLimit(request, {
    key: "cards:photo",
    limit: 10,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Muitas requisicoes. Tente novamente." },
      { status: 429 }
    );
  }

  let body: UploadPayload;
  try {
    body = (await request.json()) as UploadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalido." },
      { status: 400 }
    );
  }

  if (!body?.bytesBase64 || !body?.filename || !body?.mimeType) {
    return NextResponse.json(
      { ok: false, error: "Dados incompletos para upload." },
      { status: 400 }
    );
  }

  try {
    const id = (await resolveId(request, params)).trim();
    const uploadResult = await uploadFile(body);
    const updated = await attachCardPhoto(
      id,
      uploadResult.url,
      getActorEmail(session?.user?.email)
    );
    return NextResponse.json({ ok: true, data: updated, url: uploadResult.url });
  } catch (error) {
    console.error("Erro ao anexar foto do cartao.", error);
    const message =
      error instanceof Error ? error.message : "Erro ao anexar foto do cartao.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
