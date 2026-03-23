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
      website_url:
        typeof body.website_url === "string"
          ? body.website_url.trim() || null
          : undefined,
      youtube_url:
        typeof body.youtube_url === "string"
          ? body.youtube_url.trim() || null
          : undefined,
      hero_image_url:
        typeof body.hero_image_url === "string"
          ? body.hero_image_url.trim() || null
          : undefined,
      logo_url:
        typeof body.logo_url === "string"
          ? body.logo_url.trim() || null
          : undefined,
      status:
        typeof body.status === "string" &&
        ALLOWED_STATUS.includes(body.status)
          ? body.status
          : undefined,
      is_public:
        typeof body.is_public === "boolean" ? body.is_public : undefined,
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
      .select()
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