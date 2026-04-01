import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-가-힣]+/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const kind = String(formData.get("kind") || "media"); // media | docs

    if (!file) {
      return NextResponse.json(
        { success: false, error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    const bucket = kind === "docs" ? "expo-docs" : "expo-media";
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const safeName = sanitizeFileName(file.name);
    const path = `${y}/${m}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      success: true,
      bucket,
      path,
      url: publicData.publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}