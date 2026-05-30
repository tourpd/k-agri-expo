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

function num(v: unknown, fallback = 100) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function nullIfEmpty(v: unknown) {
  const s = clean(v);
  return s ? s : null;
}

function normalizePayload(body: any) {
  return {
    diagnosis_keyword: clean(body.diagnosis_keyword),
    crop_name: nullIfEmpty(body.crop_name),
    issue_type: clean(body.issue_type) || "insect",

    product_name: clean(body.product_name),
    product_id: nullIfEmpty(body.product_id),
    product_slug: nullIfEmpty(body.product_slug),
    booth_id: nullIfEmpty(body.booth_id),

    recommend_order: num(body.recommend_order, 100),
    recommend_label: nullIfEmpty(body.recommend_label),
    recommend_reason: nullIfEmpty(body.recommend_reason),

    button_text: clean(body.button_text) || "구매하기",
    button_link:
      clean(body.button_link) ||
      `/photodoctor/buy?product=${encodeURIComponent(clean(body.product_name))}`,

    is_active: body.is_active === undefined ? true : bool(body.is_active),

    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("photodoctor_recommend_rules")
      .select("*")
      .order("diagnosis_keyword", { ascending: true })
      .order("recommend_order", { ascending: true })
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
        error:
          error instanceof Error
            ? error.message
            : "추천규칙 조회 실패",
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

    if (!payload.diagnosis_keyword) {
      return NextResponse.json(
        { ok: false, error: "진단 키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!payload.product_name) {
      return NextResponse.json(
        { ok: false, error: "추천 자재명을 입력해주세요." },
        { status: 400 }
      );
    }

    if (id) {
      const { data, error } = await supabase
        .from("photodoctor_recommend_rules")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message, detail: error },
          { status: 500 }
        );
      }

      revalidatePath("/admin/photodoctor-recommend-rules");
      revalidatePath("/ai-consult");

      return NextResponse.json({
        ok: true,
        mode: "updated",
        item: data,
      });
    }

    const { data, error } = await supabase
      .from("photodoctor_recommend_rules")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    revalidatePath("/admin/photodoctor-recommend-rules");
    revalidatePath("/ai-consult");

    return NextResponse.json({
      ok: true,
      mode: "created",
      item: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "추천규칙 저장 실패",
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
      .from("photodoctor_recommend_rules")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, detail: error },
        { status: 500 }
      );
    }

    revalidatePath("/admin/photodoctor-recommend-rules");
    revalidatePath("/ai-consult");

    return NextResponse.json({
      ok: true,
      deleted_id: id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "추천규칙 삭제 실패",
      },
      { status: 500 }
    );
  }
}