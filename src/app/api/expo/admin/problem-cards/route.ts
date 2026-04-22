import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type ProblemCardPayload = {
  id?: string;
  title?: string;
  summary?: string;
  link_url?: string;
  crop_key?: string;
  topic_key?: string;
  season_key?: string;
  start_month?: number;
  end_month?: number;
  priority?: number;
  is_active?: boolean;
  is_featured?: boolean;
  badge_text?: string;
  thumbnail_url?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text ? text : null;
}

function normalizeMonth(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(12, Math.floor(n)));
}

function normalizePriority(value: unknown, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function shapeRow(payload: ProblemCardPayload) {
  const nowMonth = new Date().getMonth() + 1;

  return {
    title: normalizeText(payload.title),
    summary: normalizeNullableText(payload.summary),
    link_url: normalizeText(payload.link_url),
    crop_key: normalizeNullableText(payload.crop_key),
    topic_key: normalizeNullableText(payload.topic_key),
    season_key: normalizeNullableText(payload.season_key),
    start_month: normalizeMonth(payload.start_month, nowMonth),
    end_month: normalizeMonth(payload.end_month, nowMonth),
    priority: normalizePriority(payload.priority, 100),
    is_active: !!payload.is_active,
    is_featured: !!payload.is_featured,
    badge_text: normalizeNullableText(payload.badge_text),
    thumbnail_url: normalizeNullableText(payload.thumbnail_url),
  };
}

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  return ok;
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) return jsonError("관리자 권한이 없습니다.", 401);

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_problem_cards")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[problem-cards][GET]", error);
      return jsonError("카드 목록을 불러오지 못했습니다.", 500);
    }

    return NextResponse.json({
      ok: true,
      items: data ?? [],
    });
  } catch (error) {
    console.error("[problem-cards][GET][unexpected]", error);
    return jsonError("카드 목록 조회 중 오류가 발생했습니다.", 500);
  }
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return jsonError("관리자 권한이 없습니다.", 401);

  try {
    const payload = (await req.json()) as ProblemCardPayload;
    const row = shapeRow(payload);

    if (!row.title) {
      return jsonError("제목을 입력해 주세요.");
    }

    if (!row.link_url) {
      return jsonError("링크 URL을 입력해 주세요.");
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_problem_cards")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      console.error("[problem-cards][POST]", error);
      return jsonError("카드 생성에 실패했습니다.", 500);
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (error) {
    console.error("[problem-cards][POST][unexpected]", error);
    return jsonError("카드 생성 중 오류가 발생했습니다.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return jsonError("관리자 권한이 없습니다.", 401);

  try {
    const payload = (await req.json()) as ProblemCardPayload;
    const id = normalizeText(payload.id);

    if (!id) {
      return jsonError("수정할 카드 ID가 필요합니다.");
    }

    const row = shapeRow(payload);

    if (!row.title) {
      return jsonError("제목을 입력해 주세요.");
    }

    if (!row.link_url) {
      return jsonError("링크 URL을 입력해 주세요.");
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_problem_cards")
      .update(row)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[problem-cards][PUT]", error);
      return jsonError("카드 수정에 실패했습니다.", 500);
    }

    return NextResponse.json({
      ok: true,
      item: data,
    });
  } catch (error) {
    console.error("[problem-cards][PUT][unexpected]", error);
    return jsonError("카드 수정 중 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return jsonError("관리자 권한이 없습니다.", 401);

  try {
    const id = normalizeText(req.nextUrl.searchParams.get("id"));

    if (!id) {
      return jsonError("삭제할 카드 ID가 필요합니다.");
    }

    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("expo_problem_cards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[problem-cards][DELETE]", error);
      return jsonError("카드 삭제에 실패했습니다.", 500);
    }

    return NextResponse.json({
      ok: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("[problem-cards][DELETE][unexpected]", error);
    return jsonError("카드 삭제 중 오류가 발생했습니다.", 500);
  }
}