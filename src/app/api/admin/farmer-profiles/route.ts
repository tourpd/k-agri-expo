// src/app/api/admin/farmer-profiles/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = phoneOnly(searchParams.get("phone"));

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "전화번호가 없습니다.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

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
      profile: data || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "농민 프로필 조회 실패",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = phoneOnly(body.phone);

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "전화번호가 없습니다.",
        },
        { status: 400 }
      );
    }

    const payload = {
      phone,
      farmer_name: safe(body.farmer_name),
      region: safe(body.region),
      crop: safe(body.crop),
      farm_size: safe(body.farm_size),
      stage: safe(body.stage) || "신규",
      last_contact_at: body.last_contact_at || new Date().toISOString(),
      next_contact_at: body.next_contact_at || null,
      repurchase_score:
        body.repurchase_score === undefined || body.repurchase_score === null
          ? null
          : Number(body.repurchase_score),
      memo: safe(body.memo),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("farmer_profiles")
      .upsert(payload, {
        onConflict: "phone",
      })
      .select("*")
      .single();

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
      profile: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "농민 프로필 저장 실패",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}