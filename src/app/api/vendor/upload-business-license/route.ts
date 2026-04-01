import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "vendor-documents";

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function sanitizeFilename(filename: string) {
  const ext = path.extname(filename || "").toLowerCase();
  const base = path
    .basename(filename || "business-license", ext)
    .replace(/[^\w\-가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "business-license"}${ext || ".jpg"}`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return jsonError("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.", 500);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.", 500);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("업로드 파일이 없습니다.");
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("사업자등록증은 이미지 파일(JPG/PNG 등)만 업로드 가능합니다.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength === 0) {
      return jsonError("빈 파일은 업로드할 수 없습니다.");
    }

    if (buffer.byteLength > 6 * 1024 * 1024) {
      return jsonError("파일 용량은 6MB 이하만 업로드 가능합니다.");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const safeName = sanitizeFilename(file.name);
    const objectPath = `business-licenses/${yyyy}/${mm}/${dd}/${randomUUID()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      return jsonError(error.message || "파일 업로드에 실패했습니다.", 500);
    }

    return Response.json({
      success: true,
      bucket: BUCKET,
      path: objectPath,
      fileName: file.name,
      mimeType: file.type,
      size: buffer.byteLength,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.",
      500
    );
  }
}