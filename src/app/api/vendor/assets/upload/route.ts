import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "zip",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
]);

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
    },
    {
      status,
      headers: noStoreHeaders(),
    }
  );
}

function jsonSuccess(data: Record<string, unknown>) {
  return NextResponse.json(data, {
    headers: noStoreHeaders(),
  });
}

async function getAuthedUserId() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error("[api/vendor/assets/upload] auth.getUser error:", error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("[api/vendor/assets/upload] getAuthedUserId exception:", error);
    return null;
  }
}

function safeName(name: string) {
  const original = (name || "").trim();

  const withoutExt = original.replace(/\.[^.]+$/, "");
  const ext = getExtension(original);

  const normalizedBase = withoutExt
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/\.+/g, "_");

  const safeBase = normalizedBase || "file";
  return ext ? `${safeBase}.${ext}` : safeBase;
}

function safeFolderName(folder: string) {
  const normalized = (folder || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/-+/g, "-");

  return normalized || "misc";
}

function getExtension(filename: string) {
  const name = (filename || "").trim();
  if (!name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() || "";
}

function isAllowedMimeType(file: File) {
  const mime = (file.type || "").toLowerCase().trim();
  if (!mime) return false;
  return ALLOWED_MIME_TYPES.has(mime);
}

function isAllowedExtension(file: File) {
  const ext = getExtension(file.name);
  if (!ext) return false;
  return ALLOWED_EXTENSIONS.has(ext);
}

function isAllowedFileType(file: File) {
  return isAllowedMimeType(file) || isAllowedExtension(file);
}

function guessContentType(file: File) {
  const explicit = (file.type || "").trim();
  if (explicit) return explicit;

  const ext = getExtension(file.name);

  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  if (ext === "zip") return "application/zip";
  if (ext === "doc") return "application/msword";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (ext === "ppt") return "application/vnd.ms-powerpoint";
  if (ext === "pptx") {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (ext === "txt") return "text/plain";

  return "application/octet-stream";
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const rawFolder = String(formData.get("folder") || "misc");

    if (!(file instanceof File)) {
      return jsonError("업로드할 파일이 없습니다.", 400);
    }

    if (!file.size) {
      return jsonError("빈 파일은 업로드할 수 없습니다.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("파일 크기는 25MB 이하만 업로드할 수 있습니다.", 400);
    }

    if (!isAllowedFileType(file)) {
      return jsonError(
        "허용되지 않는 파일 형식입니다. 이미지, PDF, 오피스 문서, ZIP, TXT만 업로드할 수 있습니다.",
        400
      );
    }

    const folder = safeFolderName(rawFolder);
    const admin = createSupabaseAdminClient();

    const ext = getExtension(file.name);
    const safeOriginalName = safeName(file.name || `file.${ext || "bin"}`);
    const timestamp = Date.now();
    const path = `${userId}/${folder}/${timestamp}-${safeOriginalName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = guessContentType(file);

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[api/vendor/assets/upload] upload error:", {
        message: uploadError.message,
        name: file.name,
        size: file.size,
        type: file.type,
        path,
      });

      return jsonError(
        uploadError.message || "파일 업로드에 실패했습니다.",
        500
      );
    }

    const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl || "";

    if (!publicUrl) {
      console.error("[api/vendor/assets/upload] public url missing:", { path });
      return jsonError("업로드는 되었지만 공개 URL 생성에 실패했습니다.", 500);
    }

    return jsonSuccess({
      ok: true,
      success: true,
      file: {
        bucket: BUCKET,
        folder,
        path,
        filename: file.name,
        safe_filename: safeOriginalName,
        extension: ext || "",
        content_type: contentType,
        size: file.size,
        public_url: publicUrl,
      },
    });
  } catch (error) {
    console.error("[api/vendor/assets/upload] exception:", error);

    return jsonError(
      error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.",
      500
    );
  }
}