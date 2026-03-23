import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kind, path } = body as {
      kind?: "media" | "docs";
      path?: string;
    };

    if (!path) {
      return NextResponse.json(
        { success: false, error: "path가 필요합니다." },
        { status: 400 }
      );
    }

    const bucket = kind === "docs" ? "expo-docs" : "expo-media";

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "삭제되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}