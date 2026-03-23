import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = Number(body?.order_id);

    if (!orderId || Number.isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "유효한 주문 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("expo_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: orderError?.message || "주문을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 이미 처리 완료된 주문이면 재처리 방지
    if (
      order.payment_status === "paid" &&
      order.vendor_id &&
      order.booth_id
    ) {
      return NextResponse.json({
        success: true,
        message: "이미 입금 확인 및 부스 생성이 완료된 주문입니다.",
        order,
      });
    }

    let vendor: any = null;
    let booth: any = null;

    // 1) 기존 vendor 찾기
    if (order.vendor_id) {
      const { data: existingVendorById } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", order.vendor_id)
        .maybeSingle();

      if (existingVendorById) {
        vendor = existingVendorById;
      }
    }

    if (!vendor && order.email) {
      const { data: existingVendorByEmail } = await supabase
        .from("vendors")
        .select("*")
        .eq("email", order.email)
        .maybeSingle();

      if (existingVendorByEmail) {
        vendor = existingVendorByEmail;
      }
    }

    if (!vendor && order.company_name) {
      const { data: existingVendorByCompany } = await supabase
        .from("vendors")
        .select("*")
        .eq("company_name", order.company_name)
        .maybeSingle();

      if (existingVendorByCompany) {
        vendor = existingVendorByCompany;
      }
    }

    // 2) vendor 생성
    if (!vendor) {
      const { data: createdVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          company_name: order.company_name,
          email: order.email || null,
        })
        .select()
        .single();

      if (vendorError || !createdVendor) {
        return NextResponse.json(
          {
            success: false,
            error: vendorError?.message || "vendor 생성 실패",
          },
          { status: 500 }
        );
      }

      vendor = createdVendor;
    }

    // 3) 기존 booth 찾기
    if (order.booth_id) {
      const { data: existingBoothById } = await supabase
        .from("booths")
        .select("*")
        .eq("booth_id", order.booth_id)
        .maybeSingle();

      if (existingBoothById) {
        booth = existingBoothById;
      }
    }

    if (!booth) {
      const { data: existingBoothByVendor } = await supabase
        .from("booths")
        .select("*")
        .eq("vendor_id", vendor.id)
        .maybeSingle();

      if (existingBoothByVendor) {
        booth = existingBoothByVendor;
      }
    }

    // 4) booth 생성
    if (!booth) {
      const { data: createdBooth, error: boothError } = await supabase
        .from("booths")
        .insert({
          vendor_id: vendor.id,
          name: order.company_name,
          intro: `${order.company_name} 부스입니다.`,
          description: `${
            order.product_name || "입점 상품"
          } 신청으로 자동 생성된 부스입니다.`,
          is_public: true,
          status: "live",
        })
        .select()
        .single();

      if (boothError || !createdBooth) {
        return NextResponse.json(
          {
            success: false,
            error: boothError?.message || "booth 생성 실패",
          },
          { status: 500 }
        );
      }

      booth = createdBooth;
    }

    // 5) 주문 상태 업데이트
    const { data: updatedOrder, error: updateError } = await supabase
      .from("expo_orders")
      .update({
        payment_status: "paid",
        order_status: "approved",
        vendor_id: vendor.id,
        booth_id: booth.booth_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "입금 확인 완료 + vendor/booth 자동 생성 완료",
      order: updatedOrder,
      vendor,
      booth,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "입금 확인 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}