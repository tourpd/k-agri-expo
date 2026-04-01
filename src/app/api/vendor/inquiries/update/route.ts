// src/app/api/vendor/inquiries/update/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  inquiry_id?: string;
  status?: string;
  memo?: string;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function isAllowedStatus(status: string) {
  return ["new", "contacted", "closed"].includes(status);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const inquiry_id = clean(body.inquiry_id);
    const status = clean(body.status);
    const memoRaw = body.memo;

    if (!inquiry_id) {
      return NextResponse.json(
        { ok: false, error: "inquiry_id is required." },
        { status: 400 }
      );
    }

    if (!status && memoRaw === undefined) {
      return NextResponse.json(
        { ok: false, error: "status or memo is required." },
        { status: 400 }
      );
    }

    if (status && !isAllowedStatus(status)) {
      return NextResponse.json(
        { ok: false, error: "invalid status. allowed: new, contacted, closed" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;

      if (status === "contacted") {
        updateData.contacted_at = new Date().toISOString();
      }

      if (status === "closed") {
        updateData.closed_at = new Date().toISOString();

        // contacted_at이 없는데 바로 closed로 가는 경우도 보정
        const { data: currentRow } = await supabase
          .from("expo_inquiries")
          .select("contacted_at")
          .eq("inquiry_id", inquiry_id)
          .maybeSingle();

        if (!currentRow?.contacted_at) {
          updateData.contacted_at = new Date().toISOString();
        }
      }

      if (status === "new") {
        updateData.contacted_at = null;
        updateData.closed_at = null;
      }
    }

    if (memoRaw !== undefined) {
      const memo = clean(memoRaw);
      updateData.memo = memo || null;
      updateData.vendor_memo = memo || null;
    }

    const { data, error } = await supabase
      .from("expo_inquiries")
      .update(updateData)
      .eq("inquiry_id", inquiry_id)
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
        vendor_memo,
        contacted_at,
        closed_at,
        updated_at,
        created_at
        `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "update failed" },
      { status: 500 }
    );
  }
}