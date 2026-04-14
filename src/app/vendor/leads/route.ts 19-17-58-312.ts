import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const boothId = url.searchParams.get("booth_id");
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from("deal_leads")
      .select(
        `
        id,
        booth_id,
        name,
        phone,
        email,
        message,
        source,
        status,
        memo,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (boothId) {
      query = query.eq("booth_id", boothId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%,memo.ilike.%${q}%`
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
      { ok: false, error: e?.message || "failed to load leads" },
      { status: 500 }
    );
  }
}