import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();

    const boothId = safeText(body?.boothId);
    const title = safeText(body?.title);
    const description = safeText(body?.description);
    const regularPriceText = safeText(body?.regular_price_text);
    const expoPriceText = safeText(body?.expo_price_text);
    const stockText = safeText(body?.stock_text);
    const deadlineAt = safeText(body?.deadline_at);
    const buyUrl = safeText(body?.buy_url);

    if (!boothId || !title) {
      return NextResponse.json(
        { ok: false, error: "boothId와 title이 필요합니다." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: booth } = await admin
      .from("booths")
      .select("booth_id, owner_user_id")
      .eq("booth_id", boothId)
      .maybeSingle();

    if (!booth || booth.owner_user_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "본인 부스만 등록할 수 있습니다." },
        { status: 403 }
      );
    }

    const { data, error } = await admin
      .from("expo_deals")
      .insert({
        booth_id: boothId,
        title,
        description: description || null,
        regular_price_text: regularPriceText || null,
        expo_price_text: expoPriceText || null,
        stock_text: stockText || null,
        deadline_at: deadlineAt || null,
        buy_url: buyUrl || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const dealId = safeText(body?.dealId);
    const isActive = !!body?.is_active;

    const admin = createSupabaseAdminClient();

    const { data: deal } = await admin
      .from("expo_deals")
      .select("deal_id, booth_id")
      .eq("deal_id", dealId)
      .maybeSingle();

    if (!deal) {
      return NextResponse.json({ ok: false, error: "특가를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: booth } = await admin
      .from("booths")
      .select("booth_id, owner_user_id")
      .eq("booth_id", deal.booth_id)
      .maybeSingle();

    if (!booth || booth.owner_user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
    }

    const { error } = await admin
      .from("expo_deals")
      .update({ is_active: isActive })
      .eq("deal_id", dealId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const dealId = safeText(body?.dealId);

    const admin = createSupabaseAdminClient();

    const { data: deal } = await admin
      .from("expo_deals")
      .select("deal_id, booth_id")
      .eq("deal_id", dealId)
      .maybeSingle();

    if (!deal) {
      return NextResponse.json({ ok: false, error: "특가를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: booth } = await admin
      .from("booths")
      .select("booth_id, owner_user_id")
      .eq("booth_id", deal.booth_id)
      .maybeSingle();

    if (!booth || booth.owner_user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
    }

    const { error } = await admin
      .from("expo_deals")
      .delete()
      .eq("deal_id", dealId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}