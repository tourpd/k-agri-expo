import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function clean(v: string | null) {
  return (v ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const boothId = clean(url.searchParams.get("booth_id"));
    const status = clean(url.searchParams.get("status"));
    const q = clean(url.searchParams.get("q"));

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("expo_inquiries")
      .select(
        `
        inquiry_id,
        booth_id,
        farmer_name,
        phone,
        email,
        message,
        status,
        source,
        memo,
        created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (boothId) {
      query = query.eq("booth_id", boothId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        [
          `farmer_name.ilike.%${q}%`,
          `phone.ilike.%${q}%`,
          `email.ilike.%${q}%`,
          `message.ilike.%${q}%`,
          `memo.ilike.%${q}%`,
          `source.ilike.%${q}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed to load inquiries" },
      { status: 500 }
    );
  }
}