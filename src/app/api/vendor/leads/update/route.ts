import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  lead_id?: string;
  lead_status?: "new" | "warm" | "hot" | "customer" | "dormant";
  memo?: string | null;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
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

    const body = (await req.json()) as Body;

    const lead_id = clean(body.lead_id);
    const lead_status = clean(body.lead_status) as Body["lead_status"];
    const memo = clean(body.memo) || null;

    if (!lead_id) {
      return NextResponse.json(
        { ok: false, error: "lead_id is required." },
        { status: 400 }
      );
    }

    if (!lead_status) {
      return NextResponse.json(
        { ok: false, error: "lead_status is required." },
        { status: 400 }
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
      .select("booth_id")
      .eq("vendor_id", vendor.id);

    if (boothError) {
      return NextResponse.json(
        { ok: false, error: boothError.message },
        { status: 500 }
      );
    }

    const boothIds = (booths ?? []).map((b: any) => String(b.booth_id));

    if (boothIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No booth found for this vendor." },
        { status: 404 }
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("expo_leads")
      .select("*")
      .eq("id", lead_id)
      .in("booth_id", boothIds)
      .maybeSingle();

    if (leadError) {
      return NextResponse.json(
        { ok: false, error: leadError.message },
        { status: 500 }
      );
    }

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found or access denied." },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("expo_leads")
      .update({
        lead_status,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead_id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      lead: updated,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed to update lead" },
      { status: 500 }
    );
  }
}