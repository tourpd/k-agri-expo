import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const boothId = normalizeString(searchParams.get("booth_id"));

    if (boothId) {
      const { data, error } = await admin
        .from("buyer_favorites")
        .select("id, booth_id")
        .eq("user_id", user.id)
        .eq("booth_id", boothId)
        .maybeSingle();

      if (error) {
        return jsonError(error.message, 500);
      }

      return NextResponse.json({
        ok: true,
        liked: !!data,
        item: data || null,
      });
    }

    const { data, error } = await admin
      .from("buyer_favorites")
      .select("id, booth_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      ok: true,
      items: data || [],
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("로그인이 필요합니다.", 401);
    }

    const admin = getSupabaseAdmin();
    const body = await req.json();
    const boothId = normalizeString(body.booth_id);

    if (!boothId) {
      return jsonError("booth_id가 필요합니다.");
    }

    const { data: existing } = await admin
      .from("buyer_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("booth_id", boothId)
      .maybeSingle();

    if (existing?.id) {
      await admin
        .from("buyer_favorites")
        .delete()
        .eq("id", existing.id);

      return NextResponse.json({
        ok: true,
        liked: false,
        message: "찜이 해제되었습니다.",
      });
    }

    const { data, error } = await admin
      .from("buyer_favorites")
      .insert({
        user_id: user.id,
        booth_id: boothId,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message || "찜 저장 실패", 500);
    }

    return NextResponse.json({
      ok: true,
      liked: true,
      item: data,
      message: "찜 목록에 저장되었습니다.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      500
    );
  }
}