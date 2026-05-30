import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function makeFileName(name: string) {
  return name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_\.]/g, "")
    .toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: "관리자 인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "업로드 파일이 없습니다.",
        },
        { status: 400 }
      );
    }

    const originalName = safe(file.name);

    const ext =
      originalName.split(".").pop()?.toLowerCase() || "png";

    const fileName = `${Date.now()}-${makeFileName(
      originalName
    )}`;

    const path = `products/${fileName}`;

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          success: false,
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      image_url: data.publicUrl,
      path,
      file_name: fileName,
      ext,
      message: "이미지 업로드 완료",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          e?.message || "이미지 업로드 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}