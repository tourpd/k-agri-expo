import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = (searchParams.get("keyword") || "").trim();

    let query = supabase
      .from("expo_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (keyword) {
      query = query.or(
        `company_name.ilike.%${keyword}%,applicant_name.ilike.%${keyword}%,phone.ilike.%${keyword}%,email.ilike.%${keyword}%,product_name.ilike.%${keyword}%`
      );
    }

    const { data, error } = await query.limit(500);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: data || [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "주문 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}