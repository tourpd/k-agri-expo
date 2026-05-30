import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v || "").trim();
}

function bool(v: unknown) {
  return v === true || v === "true" || v === 1 || v === "1";
}

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const ALLOWED_PROMO_TYPES = new Set([
  "live",
  "giveaway",
  "sample",
  "discount",
  "health",
  "alert",
  "special",
]);

const ALLOWED_MEDIA_TYPES = new Set(["image", "video", "mixed"]);

function normalizePromoType(v: unknown) {
  const value = clean(v) || "live";
  return ALLOWED_PROMO_TYPES.has(value) ? value : "live";
}

function normalizeMediaType(v: unknown) {
  const value = clean(v) || "video";
  return ALLOWED_MEDIA_TYPES.has(value) ? value : "video";
}

function normalizePayload(body: any) {
  return {
    title: clean(body.title),
    subtitle: clean(body.subtitle),
    description: clean(body.description),

    promo_type: normalizePromoType(body.promo_type),
    media_type: normalizeMediaType(body.media_type),

    sponsor_name: clean(body.sponsor_name) || "영진로타리",
    partner_name: clean(body.partner_name) || "K-Agri Expo",

    prize_label: clean(body.prize_label) || "오늘의 대표 경품",
    prize_title: clean(body.prize_title) || null,
    prize_desc: clean(body.prize_desc) || null,

    feature_1: clean(body.feature_1) || null,
    feature_2: clean(body.feature_2) || null,
    feature_3: clean(body.feature_3) || null,
    feature_4: clean(body.feature_4) || null,

    live_date_label: clean(body.live_date_label) || null,
    live_datetime: clean(body.live_datetime) || null,

    participant_label: clean(body.participant_label) || "현재 참여 농가",
    participant_count_manual: num(body.participant_count_manual, 0),
    show_participant_count:
      body.show_participant_count === undefined
        ? true
        : bool(body.show_participant_count),

    image_url: clean(body.image_url) || null,
    video_url: clean(body.video_url) || null,

    button_text: clean(body.button_text) || "무료 추첨 참여하기",
    button_link: clean(body.button_link) || "/expo/live/join",

    badge: clean(body.badge) || "MONTHLY LIVE EVENT",

    is_featured: bool(body.is_featured),
    is_active: body.is_active === undefined ? true : bool(body.is_active),

    sort_order: num(body.sort_order, 100),

    starts_at: clean(body.starts_at) || null,
    ends_at: clean(body.ends_at) || null,

    updated_at: new Date().toISOString(),
  };
}

function getMissingColumnName(error: any) {
  const message = String(error?.message || "");

  const match =
    message.match(/Could not find the '([^']+)' column/) ||
    message.match(/column "([^"]+)" of relation/) ||
    message.match(/'([^']+)' column/);

  return match?.[1] || "";
}

async function updateWithColumnRetry({
  supabase,
  id,
  payload,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  id: string;
  payload: Record<string, any>;
}) {
  let nextPayload = { ...payload };

  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("expo_promotions")
      .update(nextPayload)
      .eq("id", id)
      .select("*")
      .single();

    if (!error) return { data, error: null };

    const missing = getMissingColumnName(error);

    if (!missing || !(missing in nextPayload)) {
      return { data: null, error };
    }

    delete nextPayload[missing];
  }

  return {
    data: null,
    error: new Error("저장 실패: 컬럼 확인 재시도 초과"),
  };
}

async function insertWithColumnRetry({
  supabase,
  payload,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  payload: Record<string, any>;
}) {
  let nextPayload = { ...payload };

  for (let i = 0; i < 20; i++) {
    const { data, error } = await supabase
      .from("expo_promotions")
      .insert(nextPayload)
      .select("*")
      .single();

    if (!error) return { data, error: null };

    const missing = getMissingColumnName(error);

    if (!missing || !(missing in nextPayload)) {
      return { data: null, error };
    }

    delete nextPayload[missing];
  }

  return {
    data: null,
    error: new Error("저장 실패: 컬럼 확인 재시도 초과"),
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_promotions")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "프로모션 조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await req.json();

    const id = clean(body.id);
    const payload = normalizePayload(body);

    if (!payload.title) {
      return NextResponse.json(
        { ok: false, error: "제목을 입력해주세요." },
        { status: 400 }
      );
    }

    if (payload.is_featured) {
      await supabase
        .from("expo_promotions")
        .update({ is_featured: false })
        .neq("id", id || "00000000-0000-0000-0000-000000000000");
    }

    if (id) {
      const { data, error } = await updateWithColumnRetry({
        supabase,
        id,
        payload,
      });

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : String((error as any)?.message || "저장 실패"),
            detail: error,
          },
          { status: 500 }
        );
      }

      revalidatePath("/expo");
      revalidatePath("/admin/promotions");

      return NextResponse.json({
        ok: true,
        mode: "updated",
        item: data,
      });
    }

    const { data, error } = await insertWithColumnRetry({
      supabase,
      payload,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : String((error as any)?.message || "저장 실패"),
          detail: error,
        },
        { status: 500 }
      );
    }

    revalidatePath("/expo");
    revalidatePath("/admin/promotions");

    return NextResponse.json({
      ok: true,
      mode: "created",
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "프로모션 저장 실패",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(req.url);
    const id = clean(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "삭제할 id가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("expo_promotions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    revalidatePath("/expo");
    revalidatePath("/admin/promotions");

    return NextResponse.json({
      ok: true,
      deleted_id: id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "프로모션 삭제 실패",
      },
      { status: 500 }
    );
  }
}