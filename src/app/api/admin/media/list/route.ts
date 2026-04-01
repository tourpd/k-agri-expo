import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Item = {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = String(searchParams.get("kind") || "media");
    const bucket = kind === "docs" ? "expo-docs" : "expo-media";

    const monthsToCheck: { year: number; month: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsToCheck.push({
        year: d.getFullYear(),
        month: String(d.getMonth() + 1).padStart(2, "0"),
      });
    }

    const results: Array<{
      bucket: string;
      path: string;
      url: string;
      name: string;
      updated_at?: string | null;
      created_at?: string | null;
      size?: number;
      mimetype?: string;
    }> = [];

    for (const item of monthsToCheck) {
      const folder = `${item.year}/${item.month}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) continue;

      for (const file of (data || []) as Item[]) {
        const path = `${folder}/${file.name}`;
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

        results.push({
          bucket,
          path,
          url: publicData.publicUrl,
          name: file.name,
          updated_at: file.updated_at,
          created_at: file.created_at,
          size: file.metadata?.size,
          mimetype: file.metadata?.mimetype,
        });
      }
    }

    results.sort((a, b) => {
      const at = new Date(a.updated_at || a.created_at || 0).getTime();
      const bt = new Date(b.updated_at || b.created_at || 0).getTime();
      return bt - at;
    });

    return NextResponse.json({
      success: true,
      items: results,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}