import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("cms_settings")
      .select("*")
      .eq("id", 1)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cms: data?.[0] || null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "CMS 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      hero_title,
      hero_subtitle,
      hero_button_text,
      hero_button_link,
      hero_secondary_button_text,
      hero_secondary_button_link,
      hero_video_url,
      notice_text,
    }: {
      hero_title?: string;
      hero_subtitle?: string;
      hero_button_text?: string;
      hero_button_link?: string;
      hero_secondary_button_text?: string;
      hero_secondary_button_link?: string;
      hero_video_url?: string;
      notice_text?: string;
    } = body;

    const { data, error } = await supabase
      .from("cms_settings")
      .upsert(
        {
          id: 1,
          hero_title: hero_title ?? null,
          hero_subtitle: hero_subtitle ?? null,
          hero_button_text: hero_button_text ?? null,
          hero_button_link: hero_button_link ?? null,
          hero_secondary_button_text: hero_secondary_button_text ?? null,
          hero_secondary_button_link: hero_secondary_button_link ?? null,
          hero_video_url: hero_video_url ?? null,
          notice_text: notice_text ?? null,
        },
        { onConflict: "id" }
      )
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
      cms: data,
      message: "메인 페이지 CMS가 저장되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "CMS 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}