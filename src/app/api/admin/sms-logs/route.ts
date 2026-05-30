import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin(req: Request) {
  const url = new URL(req.url);

  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }

  return await isAdminAuthenticated();
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const ok = await requireAdmin(req);

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: "관리자 인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);

    const keyword = safe(url.searchParams.get("keyword"));
    const status = safe(url.searchParams.get("status"));
    const smsType = safe(url.searchParams.get("sms_type"));

    let query = supabase
      .from("expo_sms_logs")
      .select(`
        id,
        order_id,
        phone,
        receiver_name,
        message,
        sms_type,
        send_status,
        provider_response,
        error_message,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    if (status && status !== "all") {
      query = query.eq("send_status", status);
    }

    if (smsType && smsType !== "all") {
      query = query.eq("sms_type", smsType);
    }

    if (keyword) {
      query = query.or(
        [
          `order_id.ilike.%${keyword}%`,
          `phone.ilike.%${keyword}%`,
          `receiver_name.ilike.%${keyword}%`,
          `message.ilike.%${keyword}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "문자 로그 조회 실패",
      },
      { status: 500 }
    );
  }
}