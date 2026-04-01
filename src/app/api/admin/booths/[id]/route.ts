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

const ALLOWED_STATUS = ["draft", "live", "closed"];

function toNullableTrimmedString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalTrimmedString(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value.trim();
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
    const boothId = id;

    if (!boothId) {
      return NextResponse.json(
        { success: false, error: "유효한 booth_id가 필요합니다." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload = {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      intro: typeof body.intro === "string" ? body.intro.trim() : undefined,
      description:
        typeof body.description === "string"
          ? body.description.trim()
          : undefined,

      website_url: toNullableTrimmedString(body.website_url),
      youtube_url: toNullableTrimmedString(body.youtube_url),
      hero_image_url: toNullableTrimmedString(body.hero_image_url),
      logo_url: toNullableTrimmedString(body.logo_url),

      status:
        typeof body.status === "string" &&
        ALLOWED_STATUS.includes(body.status)
          ? body.status
          : undefined,

      is_public:
        typeof body.is_public === "boolean" ? body.is_public : undefined,

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
      .from("booths")
      .update(updateData)
      .eq("booth_id", boothId)
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
      booth: data,
      message: "부스 정보가 저장되었습니다.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "부스 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}