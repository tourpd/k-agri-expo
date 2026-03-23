import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  booth_id?: string;
  booth_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;

  user_id?: string | null;
  session_id?: string | null;

  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;

  message?: string;
  contact_channel?: string | null;
};

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const booth_id = clean(body.booth_id);
    const booth_name = clean(body.booth_name) || null;
    const product_id = clean(body.product_id) || null;
    const product_name = clean(body.product_name) || null;

    const user_id = clean(body.user_id) || null;
    const session_id = clean(body.session_id) || null;

    const name = clean(body.name) || null;
    const phone = clean(body.phone) || null;
    const region = clean(body.region) || null;
    const crop = clean(body.crop) || null;

    const message = clean(body.message);
    const contact_channel = clean(body.contact_channel) || "form";

    if (!booth_id) {
      return NextResponse.json(
        { ok: false, error: "booth_id is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "message is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 1) 문의 저장
    const { data: inquiry, error: inquiryError } = await supabase
      .from("expo_inquiries")
      .insert({
        booth_id,
        booth_name,
        product_id,
        product_name,
        user_id,
        session_id,
        name,
        phone,
        region,
        crop,
        message,
        contact_channel,
        status: "new",
        source: "expo",
      })
      .select("*")
      .single();

    if (inquiryError) {
      return NextResponse.json(
        { ok: false, error: inquiryError.message },
        { status: 500 }
      );
    }

    // 2) 리드 찾기 우선순위
    // booth_id + phone 가 가장 우선
    let existingLead: any = null;

    if (phone) {
      const { data } = await supabase
        .from("expo_leads")
        .select("*")
        .eq("booth_id", booth_id)
        .eq("phone", phone)
        .maybeSingle();

      existingLead = data ?? null;
    }

    // phone 없으면 booth_id + name 으로 보조 탐색
    if (!existingLead && name) {
      const { data } = await supabase
        .from("expo_leads")
        .select("*")
        .eq("booth_id", booth_id)
        .eq("name", name)
        .maybeSingle();

      existingLead = data ?? null;
    }

    // 3) 리드 업데이트/생성
    if (existingLead) {
      const nextInquiryCount = Number(existingLead.inquiry_count ?? 0) + 1;

      let nextLeadStatus = existingLead.lead_status ?? "new";
      if (nextInquiryCount >= 3) nextLeadStatus = "hot";
      else if (nextInquiryCount >= 2) nextLeadStatus = "warm";

      await supabase
        .from("expo_leads")
        .update({
          name: name ?? existingLead.name ?? null,
          phone: phone ?? existingLead.phone ?? null,
          region: region ?? existingLead.region ?? null,
          crop: crop ?? existingLead.crop ?? null,
          last_inquiry_at: new Date().toISOString(),
          inquiry_count: nextInquiryCount,
          lead_status: nextLeadStatus,
          last_product_id: product_id ?? existingLead.last_product_id ?? null,
          last_product_name: product_name ?? existingLead.last_product_name ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id);
    } else {
      await supabase.from("expo_leads").insert({
        booth_id,
        name,
        phone,
        region,
        crop,
        first_inquiry_at: new Date().toISOString(),
        last_inquiry_at: new Date().toISOString(),
        inquiry_count: 1,
        lead_status: "new",
        last_product_id: product_id,
        last_product_name: product_name,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      inquiry,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "inquiry insert failed" },
      { status: 500 }
    );
  }
}