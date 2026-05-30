import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      customer_name,
      phone,
      address,
      crop,
      diagnosis,
      product_name,
      quantity,
      price_krw,
      shipping_fee_krw,
      total_krw,
      source,
    } = body;

    const { data, error } = await supabase
      .from("photodoctor_orders")
      .insert({
        customer_name,
        phone,
        address,
        crop,
        diagnosis,
        product_name,
        quantity,
        price_krw,
        shipping_fee_krw,
        total_krw,
        source,
      })
      .select()
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
      order: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "주문 저장 실패",
      },
      { status: 500 }
    );
  }
}