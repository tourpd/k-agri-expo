import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "vendor-documents";

type BusinessLicenseOcrResult = {
  company_name: string;
  representative_name: string;
  business_number: string;
  business_address: string;
  biz_type: string;
  biz_item: string;
  open_date: string;
  confidence: number;
  warnings: string[];
};

function jsonError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

function sanitizeFilename(filename: string) {
  const ext = path.extname(filename || "").toLowerCase() || ".jpg";

  const base = path
    .basename(filename || "business-license", ext)
    .replace(/[^\w\-가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "business-license"}${ext}`;
}

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}이 설정되지 않았습니다.`);
  return value;
}

function normalizeBusinessNo(value: string) {
  return String(value || "")
    .replace(/[^\d]/g, "")
    .slice(0, 10);
}

function normalizeOpenDate(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/[^\d]/g, "");

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return raw;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseOcrJson(text: string): BusinessLicenseOcrResult {
  let parsed: Record<string, unknown> = {};

  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    }
  }

  const warningsRaw = parsed.warnings;
  const warnings = Array.isArray(warningsRaw)
    ? warningsRaw.map((item) => String(item)).filter(Boolean)
    : [];

  return {
    company_name: safeString(parsed.company_name),
    representative_name: safeString(parsed.representative_name),
    business_number: normalizeBusinessNo(safeString(parsed.business_number)),
    business_address: safeString(parsed.business_address),
    biz_type: safeString(parsed.biz_type),
    biz_item: safeString(parsed.biz_item),
    open_date: normalizeOpenDate(safeString(parsed.open_date)),
    confidence: Math.max(0, Math.min(1, safeNumber(parsed.confidence, 0))),
    warnings,
  };
}

async function analyzeBusinessLicenseWithOpenAI(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<BusinessLicenseOcrResult> {
  const apiKey = getEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_OCR_MODEL?.trim() || "gpt-4.1-mini";

  const client = new OpenAI({ apiKey });

  const base64 = params.buffer.toString("base64");
  const dataUrl = `data:${params.mimeType};base64,${base64}`;

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "이 이미지는 한국 사업자등록증입니다. " +
              "이미지에서 보이는 정보만 추출하세요. 추측하지 마세요. " +
              "반드시 JSON 형식으로만 답하세요. " +
              "필드명은 company_name, representative_name, business_number, business_address, biz_type, biz_item, open_date, confidence, warnings 입니다. " +
              "business_number는 숫자 10자리만 반환하세요. " +
              "open_date는 YYYY-MM-DD 형식으로 반환하세요. " +
              "업태는 biz_type, 종목은 biz_item에 넣으세요. " +
              "안 보이는 항목은 빈 문자열로 두세요. " +
              "confidence는 0부터 1 사이 숫자입니다. " +
              "warnings는 문자열 배열입니다.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
          },
        ],
      },
    ] as any,
  });

  return parseOcrJson(response.output_text || "{}");
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("업로드 파일이 없습니다.");
    }

    if (!file.type.startsWith("image/")) {
      return jsonError("사업자등록증은 이미지 파일(JPG/PNG/WEBP)만 업로드 가능합니다.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength === 0) {
      return jsonError("빈 파일은 업로드할 수 없습니다.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const safeName = sanitizeFilename(file.name);
    const objectPath = `business-licenses/${yyyy}/${mm}/${dd}/${randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      return jsonError(uploadError.message || "파일 업로드에 실패했습니다.", 500);
    }

    let extracted: BusinessLicenseOcrResult | null = null;
    let ocrError: string | null = null;

    try {
      extracted = await analyzeBusinessLicenseWithOpenAI({
        buffer,
        mimeType: file.type || "image/jpeg",
      });
    } catch (error) {
      console.error("[upload-business-license] OCR error:", error);
      ocrError =
        error instanceof Error
          ? error.message
          : "사업자등록증 OCR 분석에 실패했습니다.";
    }

    return Response.json({
      success: true,
      ok: true,

      bucket: BUCKET,
      path: objectPath,
      fileName: file.name,
      mimeType: file.type,
      size: buffer.byteLength,

      extracted,
      ocr_success: !!extracted && !ocrError,
      ocr_error: ocrError,
    });
  } catch (error) {
    console.error("[upload-business-license] unexpected error:", error);

    return jsonError(
      error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.",
      500
    );
  }
}