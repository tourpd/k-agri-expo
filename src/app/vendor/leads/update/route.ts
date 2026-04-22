import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Body = {
  id: string;
  status?: string;
  memo?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const updateData: any = {};

    if (body.status) {
      updateData.status = clean(body.status);
    }

    if (body.memo !== undefined) {
      updateData.memo = clean(body.memo);
    }

    const { error } = await supabase
      .from("deal_leads")
      .update(updateData)
      .eq("id", body.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "update failed" },
      { status: 500 }
    );
  }
}