import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({
        ok: false,
        error: "업로드할 파일이 없습니다.",
      });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({
        ok: false,
        error: "이미지 파일만 업로드할 수 있습니다.",
      });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const safeName = `live/event-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({
        ok: false,
        error: uploadError.message,
      });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(safeName);

    return NextResponse.json({
      ok: true,
      url: data.publicUrl,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "이미지 업로드 실패",
    });
  }
}