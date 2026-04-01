import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  event_type?: "booth_click" | "product_click" | "inquiry_submit" | "order_paid";
  target_type?: "booth" | "product" | "inquiry" | "order";
  target_id?: string;
  booth_id?: string | null;
  product_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  meta?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.event_type || !body.target_type || !body.target_id) {
      return NextResponse.json(
        { ok: false, error: "event_type, target_type, target_id are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase.from("expo_behavior_logs").insert({
      event_type: body.event_type,
      target_type: body.target_type,
      target_id: body.target_id,
      booth_id: body.booth_id ?? null,
      product_id: body.product_id ?? null,
      user_id: body.user_id ?? null,
      session_id: body.session_id ?? null,
      meta: body.meta ?? {},
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "log insert failed" },
      { status: 500 }
    );
  }
}