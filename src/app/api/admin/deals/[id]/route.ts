import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = {
  params: Promise<{ id: string }>;
};

function toNullableTrimmedString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ok = await isAdminAuthenticated();

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "관리자 인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const dealId = id;

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: "유효한 deal id가 필요합니다." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload = {
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,
      deal_url: toNullableTrimmedString(body.deal_url),

      is_active:
        typeof body.is_active === "boolean" ? body.is_active : undefined,

      sponsor_weight: toOptionalNumber(body.sponsor_weight),
      manual_boost: toOptionalNumber(body.manual_boost),
      is_featured:
        typeof body.is_featured === "boolean" ? body.is_featured : undefined,
      campaign_tag: toNullableTrimmedString(body.campaign_tag),
    };

    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) updateData[key] = value;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "수정할 데이터가 없습니다." },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("booth_deals")
      .update(updateData)
      .eq("id", dealId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deal: data,
      message: "딜 정보가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "딜 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}