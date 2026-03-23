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
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorError) {
      return NextResponse.json(
        { ok: false, error: vendorError.message },
        { status: 500 }
      );
    }

    if (!vendor) {
      return NextResponse.json(
        { ok: false, error: "Vendor not found." },
        { status: 404 }
      );
    }

    const { data: booths, error: boothError } = await supabase
      .from("booths")
      .select("booth_id, name")
      .eq("vendor_id", vendor.id);

    if (boothError) {
      return NextResponse.json(
        { ok: false, error: boothError.message },
        { status: 500 }
      );
    }

    const boothIds = (booths ?? []).map((b: any) => String(b.booth_id));

    if (boothIds.length === 0) {
      return NextResponse.json({ ok: true, leads: [] });
    }

    const boothNameMap = new Map<string, string>();
    for (const booth of booths ?? []) {
      boothNameMap.set(String(booth.booth_id), booth.name ?? "부스");
    }

    const { data: leads, error: leadsError } = await supabase
      .from("expo_leads")
      .select("*")
      .in("booth_id", boothIds)
      .order("last_inquiry_at", { ascending: false });

    if (leadsError) {
      return NextResponse.json(
        { ok: false, error: leadsError.message },
        { status: 500 }
      );
    }

    const merged = (leads ?? []).map((lead: any) => ({
      ...lead,
      booth_name: boothNameMap.get(String(lead.booth_id)) ?? "부스",
    }));

    return NextResponse.json({
      ok: true,
      leads: merged,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed to load leads" },
      { status: 500 }
    );
  }
}