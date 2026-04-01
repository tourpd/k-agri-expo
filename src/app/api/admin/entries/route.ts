import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("event_id");
    const keyword = (searchParams.get("keyword") || "").trim();
    const region = (searchParams.get("region") || "").trim();
    const crop = (searchParams.get("crop") || "").trim();

    let query = supabase
      .from("event_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventId && !isNaN(Number(eventId))) {
      query = query.eq("event_id", Number(eventId));
    }

    if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    if (crop) {
      query = query.ilike("crop", `%${crop}%`);
    }

    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,phone.ilike.%${keyword}%,entry_code.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.limit(1000);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: data || [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "응모자 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}