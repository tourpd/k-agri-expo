import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (!eventId || isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: "올바른 이벤트 ID가 아닙니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data[0],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "이벤트 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (!eventId || isNaN(eventId)) {
      return NextResponse.json(
        { success: false, error: "올바른 이벤트 ID가 아닙니다." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      status,
      video_url,
      price_text,
      notice_lines,
    }: {
      title?: string;
      description?: string;
      status?: "open" | "closed" | "done";
      video_url?: string;
      price_text?: string;
      notice_lines?: string;
    } = body;

    const { data, error } = await supabase
      .from("events")
      .update({
        title: title ?? null,
        description: description ?? null,
        status: status ?? "open",
        video_url: video_url ?? null,
        price_text: price_text ?? null,
        notice_lines: notice_lines ?? null,
      })
      .eq("id", eventId)
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
      event: data,
      message: "이벤트가 저장되었습니다.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "이벤트 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}