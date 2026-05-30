import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: FormDataEntryValue | null) {
  return String(v || "").trim();
}

function cleanNumberText(v: FormDataEntryValue | null) {
  return String(v || "").replace(/[^0-9]/g, "").trim();
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const supabase = createSupabaseAdminClient();

  const brandId = clean(formData.get("brand_id"));
  const productId = clean(formData.get("product_id"));
  const eventId = clean(formData.get("event_id"));

  const postcode = clean(formData.get("postcode"));
  const baseAddress = clean(formData.get("base_address"));
  const detailAddress = clean(formData.get("detail_address"));

  const addressFromForm = clean(formData.get("address"));
  const mergedAddress =
    addressFromForm ||
    [postcode, baseAddress, detailAddress].filter(Boolean).join(" ");

  if (!brandId || !productId) {
    return NextResponse.redirect(
      new URL("/expo?order=missing_product", req.url),
      303
    );
  }

  const payload = {
    brand_id: brandId,
    product_id: productId,
    event_id: eventId || null,

    farmer_name: clean(formData.get("farmer_name")),
    phone: clean(formData.get("phone")),

    address: mergedAddress,
    postcode,
    base_address: baseAddress,
    detail_address: detailAddress,

    crop: clean(formData.get("crop")),
    farm_size: cleanNumberText(formData.get("farm_size")),
    quantity: cleanNumberText(formData.get("quantity")) || "1",

    recommended_quantity:
      Number(cleanNumberText(formData.get("recommended_quantity"))) || null,
    quantity_note: clean(formData.get("quantity_note")),

    depositor_name: clean(formData.get("depositor_name")),
    memo: clean(formData.get("memo")),

    payment_status: "입금대기",
    order_status: "접수",
    source: "brand_order",

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (
    !payload.farmer_name ||
    !payload.phone ||
    !payload.address ||
    !payload.quantity
  ) {
    return NextResponse.redirect(
      new URL(
        `/expo/brand-order?brand_id=${brandId}&product_id=${productId}&error=required`,
        req.url
      ),
      303
    );
  }

  const { data, error } = await supabase
    .from("expo_brand_orders")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL(`/expo/brand-order/complete?order_id=${data.id}`, req.url),
    303
  );
}