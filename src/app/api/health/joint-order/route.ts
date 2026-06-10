import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const farmerName = String(body.farmer_name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!farmerName || !phone || !address) {
      return NextResponse.json(
        {
          ok: false,
          error: "성함, 전화번호, 주소를 모두 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("health_groupbuy_orders")
      .insert({
        product_name: "MSM 프리미엄 로얄 관절 부스터",
        farmer_name: farmerName,
        phone,
        address,
        quantity,
        unit_price: 49900,
        order_status: "접수",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      order_id: data?.id,
      message: "공동구매 신청이 완료되었습니다.",
    });
  } catch (error) {
    console.error("[joint-order]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "공동구매 신청 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}