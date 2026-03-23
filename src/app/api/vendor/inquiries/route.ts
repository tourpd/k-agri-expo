import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json({ ok: false, error: "Vendor not found" }, { status: 404 });
    }

    const { data: booths } = await supabase
      .from("booths")
      .select("booth_id")
      .eq("vendor_id", vendor.id);

    const boothIds = (booths ?? []).map((b: any) => String(b.booth_id));

    if (boothIds.length === 0) {
      return NextResponse.json({ ok: true, inquiries: [] });
    }

    const { data: inquiries, error } = await supabase
      .from("expo_inquiries")
      .select("*")
      .in("booth_id", boothIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      inquiries: inquiries ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed to load inquiries" },
      { status: 500 }
    );
  }
}