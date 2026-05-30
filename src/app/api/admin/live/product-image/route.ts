import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "파일 없음" });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `live-product/${Date.now()}-${file.name}`;

    // 🔥 Supabase Storage 업로드
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({
        ok: false,
        error: uploadError.message,
      });
    }

    // 🔥 공개 URL 생성
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    // 🔥 DB에 저장 (라이브 메인 섹션에 붙임)
    const { error: dbError } = await supabase
      .from("expo_home_slots")
      .update({
        content: {
          product_image_url: publicUrl,
        },
      })
      .eq("section_key", "live_show");

    if (dbError) {
      return NextResponse.json({
        ok: false,
        error: dbError.message,
      });
    }

    return NextResponse.json({
      ok: true,
      url: publicUrl,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: "server error",
    });
  }
}