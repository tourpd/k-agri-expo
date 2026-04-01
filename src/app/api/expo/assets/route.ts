import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AssetRow = {
  id: string;
  deal_id: string;
  kind: "image" | "brochure" | "youtube";
  title: string | null;
  storage_path: string | null;
  url: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deal_id = (searchParams.get("deal_id") || "").trim();

  if (!deal_id) {
    return NextResponse.json({ ok: false, error: "MISSING_DEAL_ID" }, { status: 400 });
  }

  // ✅ 입장객 검증(쿠키가 있어도 실제 visitor 존재 확인)
  const cookieStore = await cookies();
  const visitor_key = cookieStore.get("visitor_key")?.value;
  if (!visitor_key) {
    return NextResponse.json({ ok: false, error: "NO_VISITOR" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: visitor } = await supabase
    .from("expo_visitors")
    .select("id")
    .eq("visitor_key", visitor_key)
    .maybeSingle();

  if (!visitor) {
    return NextResponse.json({ ok: false, error: "VISITOR_NOT_FOUND" }, { status: 401 });
  }

  // ✅ 딜 자산 목록 조회
  const { data: assets, error } = await supabase
    .from("deal_assets")
    .select("id,deal_id,kind,title,storage_path,url,sort_order,is_active")
    .eq("deal_id", deal_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const bucket = "expo-assets";
  const expiresIn = 60 * 5; // 5분

  const out = await Promise.all(
    (assets as AssetRow[]).map(async (a) => {
      // youtube는 url 그대로
      if (a.kind === "youtube") {
        return { id: a.id, kind: a.kind, title: a.title, url: a.url, signedUrl: null };
      }

      // image/brochure는 storage_path로 signed 발급
      if (!a.storage_path) {
        return { id: a.id, kind: a.kind, title: a.title, url: null, signedUrl: null };
      }

      const { data: signed, error: sErr } = await admin.storage
        .from(bucket)
        .createSignedUrl(a.storage_path, expiresIn);

      if (sErr) {
        return { id: a.id, kind: a.kind, title: a.title, url: null, signedUrl: null, error: sErr.message };
      }

      return { id: a.id, kind: a.kind, title: a.title, url: null, signedUrl: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ ok: true, assets: out });
}